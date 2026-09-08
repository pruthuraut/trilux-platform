import ast
import json
import os
import re
import time
from api.helpers.llm_helper import call_llm
from celery import shared_task
from django.core.mail import send_mail
from django.core.mail import send_mail
import random

from trilux.config import Config as config
from .models import DynamicAnalysis, StaticAnalysis, Testing, SASTTriage
import os
import shutil
import uuid
from git import Repo
import logging
import concurrent.futures
import urllib3
import requests

import pandas as pd
import subprocess
from helpers.s3_helper import S3Helper


logger = logging.getLogger(__name__)

# LLM SAST chunking: large files are split into overlapping line windows so no
# code is silently dropped past the model's context window. Sized conservatively
# in characters (~4 chars/token) with a line overlap so a vuln straddling a
# chunk boundary is still seen in full by at least one chunk.
LLM_MAX_CHARS_PER_CHUNK = 12000   # ~3k tokens of code per request
LLM_CHUNK_OVERLAP_LINES = 20      # lines repeated between adjacent chunks
LLM_MAX_FILE_BYTES = 2_000_000    # skip absurdly large files entirely


def _chunk_code_by_lines(code, max_chars=LLM_MAX_CHARS_PER_CHUNK,
                         overlap=LLM_CHUNK_OVERLAP_LINES):
    """Split source into (start_line, end_line, text) windows that each fit the
    char budget, with `overlap` lines shared between adjacent windows. start_line
    is 1-based and absolute in the original file, so findings map to real lines.
    A single line longer than max_chars is hard-split (never dropped)."""
    lines = code.splitlines()
    if not lines:
        return []
    chunks = []
    i = 0
    n = len(lines)
    while i < n:
        cur, size, j = [], 0, i
        while j < n:
            ln = lines[j]
            add = len(ln) + 1
            if cur and size + add > max_chars:
                break
            # A lone oversized line: hard-split so it's never skipped.
            if not cur and add > max_chars:
                for k in range(0, len(ln), max_chars):
                    chunks.append((j + 1, j + 1, ln[k:k + max_chars]))
                j += 1
                size = 0
                break
            cur.append(ln)
            size += add
            j += 1
        if cur:
            chunks.append((i + 1, j, "\n".join(cur)))
        if j >= n:
            break
        i = max(j - overlap, i + 1)  # step back for overlap, always progress
    return chunks


@shared_task(bind=True)
def CloneRepoTask(self, data):
    print(f"data: {data}")

    original_data = ast.literal_eval(data)
    print(f"original_data: {original_data}")
    project_id = original_data['project']  # Use original_data instead of data
    print(f"project_id: {project_id}")
    static_analysis_type = original_data['static_analysis_type']
    source_url = original_data['source_url']
    repo_token = original_data['repo_token']
    repo_type = original_data['repo_type']
    StaticAnalysis_id = original_data['staticAnalysis_id']
    StaticAnalysis_obj = StaticAnalysis.objects.get(pk=StaticAnalysis_id)

    # Initialize S3Helper
    s3_helper = S3Helper(bucket_name=config.SCAN_BUCKET)

    # Note: S3Helper automatically handles bucket operations

    # 1. Upload GitHub Repository to S3
    def upload_github_repo(github_url, username, access_token):
        """Clones a GitHub repo and uploads it to S3 using S3Helper."""
        # Generate a unique folder name
        repo_name = github_url.split("/")[-1].replace(".git", "")
        unique_folder = f"{repo_name}_{uuid.uuid4().hex[:8]}"  # Append unique ID
        
        # Clone repository
        temp_dir = f"/tmp/{unique_folder}"
        clone_url = f"https://{username}:{access_token}@{github_url.replace('https://', '')}"
        
        try:
            logger.info(f"Cloning {github_url} into {temp_dir}...")
            Repo.clone_from(clone_url, temp_dir)
            
            # Upload repository files
            for root, _, files in os.walk(temp_dir):
                for file in files:
                    local_path = os.path.join(root, file)
                    s3_path = os.path.relpath(local_path, temp_dir)  # Relative path for S3
                    
                    # Upload to S3 using S3Helper
                    result = s3_helper.upload_file(local_path, f"{unique_folder}/{s3_path}")
                    if result['success']:
                        logger.info(f"Uploaded {s3_path} to S3")
                    else:
                        logger.error(f"Failed to upload {s3_path}: {result['message']}")

            logger.info(f"Repository '{repo_name}' uploaded as '{unique_folder}' successfully.")
            return unique_folder

        except Exception as e:
            logger.info(f"Error cloning or uploading repo: {e}")

        finally:
            # Cleanup temp directory
            if os.path.exists(temp_dir):
                shutil.rmtree(temp_dir)

    # 2. List All Files in a Repository
    def list_repository_files(unique_folder):
        """Lists all files and subfolders inside a specific repository."""
        try:
            result = s3_helper.list_files(prefix=f"{unique_folder}/")
            
            if result['success'] and result['files']:
                for file_info in result['files']:
                    logger.info(file_info['key'])  # logger.info full path
            else:
                logger.info(f"No files found in repository '{unique_folder}'.")

        except Exception as e:
            logger.info(f"Error listing files: {e}")

    # 3. Delete a Repository
    def delete_repository(unique_folder):
        """Deletes an entire repository folder from S3."""
        try:
            result = s3_helper.delete_folder(f"{unique_folder}/")
            if result['success']:
                logger.info(f"Repository '{unique_folder}' deleted successfully. {result['message']}")
            else:
                logger.info(f"Error deleting repository: {result['message']}")

        except Exception as e:
            logger.info(f"Error deleting repository: {e}")

    # Example Usage
    pattern = r"https://github\.com/([^/]+)"

    # Search for the pattern in the URL
    match = re.match(pattern, source_url)
    USERNAME = ""
    if match:
        # Return the username (the first capture group)
        USERNAME= match.group(1)
    else:
        USERNAME = None

    # Step 1: Upload repository
    folder_name = upload_github_repo(source_url, USERNAME, repo_token)
    StaticAnalysis.objects.filter(pk=StaticAnalysis_id).update(repo_folder_name=folder_name, static_analysis_status='Cloning')
    original_data['folder_name'] = folder_name
    LLMtestingTask.delay(original_data)
    StaticAnalysis.objects.filter(pk=StaticAnalysis_id).update(repo_folder_name=folder_name, static_analysis_status='InProgress')
    return f"{folder_name} Created Successfully & started with the testing ✅"


@shared_task(bind=True)
def LLMtestingTask(self, data):

    # code for LLM testing
    API_URL = config.LLM_API_URL
    HEADERS = {"Content-Type": "application/json"}

    # Disable SSL warnings (for testing purposes only)
    urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

    # S3 Buckets
    REPO_BUCKET = config.SCAN_BUCKET  # Repository storage bucket
    SCAN_BUCKET = config.GITHUB_REPO_REPORT_BUCKET    # Vulnerability scan reports bucket

    # ---------- Utility Functions ----------

    # Note: S3Helper automatically handles bucket operations
    def ensure_bucket(bucket_name):
        """Ensure the specified S3 bucket exists; if not, create it."""
        # S3Helper handles bucket validation internally
        logger.info(f"Using bucket '{bucket_name}' via S3Helper")

    def is_text_file(file_path):
        """
        Heuristic: read the first 1024 bytes in binary mode.
        If a null byte is found, treat it as binary.
        """
        try:
            with open(file_path, 'rb') as f:
                chunk = f.read(1024)
                if b'\0' in chunk:
                    return False
        except Exception:
            return False
        return True

    # ---------- LLM Vulnerability Scanner ----------

    def clean_llm_json(text):
        """
        Strip markdown code-block wrappers (```json … ```) and other
        common LLM formatting artefacts so json.loads can succeed.
        """
        if not text:
            return text
        text = text.strip()
        # Remove opening ```json or ``` and closing ```
        if text.startswith("```"):
            # Remove the first line (```json, ```JSON, ```, etc.)
            first_newline = text.find("\n")
            if first_newline != -1:
                text = text[first_newline + 1:]
            else:
                text = text[3:]
        if text.endswith("```"):
            text = text[:-3]
        return text.strip()

    def _build_scan_prompt(file_path, numbered_code):
        return f"""
                        "Scan the following file for security vulnerabilities and generate fixes. "
                        "Return the results in JSON format with the following fields:\n\n"
                        "- id (it should be according to the vulnerability_type id)\n"
                        "- vulnerability_type(select for this array ['A01:2021-Broken Access Control', 'A02:2021-Cryptographic Failures', 'A03:2021-Injection', 'A04:2021-Insecure Design', 'A05:2021-Security Misconfiguration', 'A06:2021-Vulnerable and Outdated Components', 'A07:2021-Identification and Authentication Failures', 'A08:2021-Software and Data Integrity Failures', 'A09:2021-Security Logging and Monitoring Failures', 'A10:2021-Server-Side Request Forgery', 'A11:2021-Insecure Serialization', 'Miscellaneous'])\n"
                        "- title\n"
                        "- severity\n"
                        "- location (include file path and line number; use the line numbers prefixed on each line below)\n"
                        "- description\n"
                        "- fix (suggets correct code)\n\n"
                        "- tips (provide additional information to the developer)\n\n"
                        f"File path: {file_path}\n\n"
                        "vulnerableCode (each line is prefixed with its absolute line number):\n" + {numbered_code}"""

    def scan_file_for_vulnerabilities(file_path, code):
        """
        Sends the file's content to the LLM vulnerability scanning API and
        returns the concatenated raw responses.

        Large files are split into overlapping, line-numbered chunks so no code
        is silently truncated past the model's context window (each line carries
        its absolute number so findings map to real line numbers). Small files
        take a single request, matching the previous behaviour.
        """
        chunks = _chunk_code_by_lines(code)
        if not chunks:
            return ""
        if len(chunks) > 1:
            logger.info(f"{file_path}: {len(code)} chars -> {len(chunks)} chunks (chunked LLM scan)")

        responses = []
        for (start, end, text) in chunks:
            numbered = "\n".join(
                f"{start + off}: {line}" for off, line in enumerate(text.splitlines())
            )
            payload = _build_scan_prompt(file_path, numbered)
            try:
                content = call_llm(payload)  # temperature=0 (deterministic) by default
                if content:
                    responses.append(content)
            except Exception as e:
                logger.info(f"Exception while scanning {file_path} lines {start}-{end}: {e}")
                # Surface the failure instead of silently treating it as "clean".
                responses.append(json.dumps({
                    "scan_error": f"chunk {start}-{end} failed: {e}",
                    "file_path": file_path,
                }))
        # Single chunk keeps the exact prior return shape (one raw string).
        return responses[0] if len(responses) == 1 else "\n".join(responses)

    def process_file(file_path):
        """
        Processes a single file:
        - Skips non-text files and files in the .git folder or with unwanted extensions.
        - Reads the file content.
        - Calls the LLM vulnerability scanner.
        - Returns a parsed JSON result (or raw text) enriched with file path info.
        """
        try:
            # Skip binary files
            if not is_text_file(file_path):
                logger.info(f"Skipping binary file: {file_path}")
                return None
            # Skip non-source files (e.g., .pyc files or anything in a .git folder)
            if file_path.endswith(".pyc") or ".git" in file_path:
                logger.info(f"Skipping non-source file: {file_path}")
                return None

            # Size guard: don't try to scan absurdly large files. Report the skip
            # explicitly so it's never mistaken for "scanned, no vulns found".
            try:
                fsize = os.path.getsize(file_path)
            except OSError:
                fsize = 0
            if fsize > LLM_MAX_FILE_BYTES:
                logger.info(f"Skipping oversized file ({fsize} bytes): {file_path}")
                return {"file_path": file_path,
                        "scan_error": f"skipped: file too large ({fsize} bytes > {LLM_MAX_FILE_BYTES})"}

            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                code = f.read()
            logger.info(f"Scanning file: {file_path}...")
            result = scan_file_for_vulnerabilities(file_path, code)
            if result:
                try:
                    cleaned = clean_llm_json(result)
                    parsed_result = json.loads(cleaned)

                    # The LLM may return a list, a dict with "vulnerabilities",
                    # or a single vulnerability dict.
                    if isinstance(parsed_result, list):
                        # Enrich every item with the file_path
                        for item in parsed_result:
                            if isinstance(item, dict):
                                if "location" not in item or isinstance(item.get("location"), str):
                                    item["location"] = {"file_path": file_path, "line": item.get("line", "N/A")}
                        return {"vulnerabilities": parsed_result, "file_path": file_path}
                    elif isinstance(parsed_result, dict) and "vulnerabilities" in parsed_result:
                        for item in parsed_result["vulnerabilities"]:
                            if isinstance(item, dict):
                                if "location" not in item or isinstance(item.get("location"), str):
                                    item["location"] = {"file_path": file_path, "line": item.get("line", "N/A")}
                        return parsed_result
                    else:
                        # Single vulnerability object
                        if "location" not in parsed_result:
                            parsed_result["location"] = {"file_path": file_path, "line": parsed_result.get("line", "N/A")}
                        elif isinstance(parsed_result["location"], str):
                            parsed_result["location"] = {"file_path": file_path, "line": parsed_result.get("line", "N/A")}
                        return parsed_result
                except Exception as e:
                    logger.info(f"Error parsing vulnerability result for {file_path}: {e}")
                    return {"file_path": file_path, "raw_response": result}
            else:
                return None
        except Exception as e:
            logger.info(f"Skipping file {file_path} due to error: {e}")
            return None

    # ---------- Repository Scanner using S3 and Multithreading ----------

    def scan_repository_with_llm(unique_folder):
        # Initialize S3Helper instances
        repo_s3_helper = S3Helper(
            bucket_name=REPO_BUCKET
        )
        
        scan_s3_helper = S3Helper(
            bucket_name=SCAN_BUCKET
        )
        
        try:
            ensure_bucket(SCAN_BUCKET)
            logger.info(f"Confirmed bucket '{SCAN_BUCKET}' exists.")
        except Exception as e:
            logger.info(f"Error ensuring bucket exists: {e}")
        
        temp_dir = f"/tmp/{unique_folder}"
        os.makedirs(temp_dir, exist_ok=True)
        logger.info(f"Downloading repository '{unique_folder}' from S3...")

        # List files in repository using S3Helper
        files_result = repo_s3_helper.list_files(prefix=f"{unique_folder}/")
        if not files_result['success'] or not files_result['files']:
            logger.info(f"Repository '{unique_folder}' not found in S3.")
            return None

        # Download files from S3, preserving directory structure.
        for file_info in files_result['files']:
            s3_key = file_info['key']
            relative_path = s3_key[len(unique_folder) + 1 :]  # Remove the repository folder prefix.
            local_path = os.path.join(temp_dir, relative_path)
            os.makedirs(os.path.dirname(local_path), exist_ok=True)
            logger.info(f"Downloading {s3_key} -> {local_path}")
            
            download_result = repo_s3_helper.download_file(s3_key, local_path)
            if not download_result['success']:
                logger.error(f"Failed to download {s3_key}: {download_result['message']}")

        logger.info(f"Repository downloaded to: {temp_dir}")

        vulnerability_results = []
        with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
            futures = []
            for root, _, files in os.walk(temp_dir):
                for filename in files:
                    full_path = os.path.join(root, filename)
                    futures.append(executor.submit(process_file, full_path))
            for future in concurrent.futures.as_completed(futures):
                result = future.result()
                if result:
                    vulnerability_results.append(result)
                    logger.info(f"Found vulnerability in file: {result.get('location', {}).get('file_path', 'unknown')}")

        # Process raw results to ensure we have a clean list structure
        processed_vulnerability_results = []
        for result in vulnerability_results:
            # Handle raw response format
            if "raw_response" in result:
                try:
                    # Try to parse the raw response
                    raw_json = json.loads(clean_llm_json(result["raw_response"]))
                    
                    # If the response has a 'vulnerabilities' key, extract those items
                    if "vulnerabilities" in raw_json:
                        for vuln in raw_json["vulnerabilities"]:
                            # Ensure location is properly formatted
                            if "location" in vuln and isinstance(vuln["location"], dict):
                                if "file_path" in vuln["location"]:
                                    # Fix any escaped underscores or spaces in file_path
                                    vuln["location"]["file_path"] = vuln["location"]["file_path"].replace("\\_", "_").replace("\\ ", " ")
                                
                                # Normalize line number field name
                                if "line_number" in vuln["location"]:
                                    vuln["location"]["line"] = vuln["location"]["line_number"]
                                    del vuln["location"]["line_number"]
                                    
                            processed_vulnerability_results.append(vuln)
                    else:
                        # Just add the entire parsed object
                        processed_vulnerability_results.append(raw_json)
                except Exception as e:
                    logger.info(f"Error processing raw response: {e}")
                    # Add the original result as fallback
                    processed_vulnerability_results.append(result)
            else:
                # Already parsed result, just add it
                processed_vulnerability_results.append(result)

        report_s3_path = None
        # Save initial raw results for debugging purposes
        if processed_vulnerability_results:
            # First, clean any file paths or strings with escape characters
            for item in processed_vulnerability_results:
                # Clean file paths in location dictionaries
                if isinstance(item.get("location"), dict) and "file_path" in item["location"]:
                    item["location"]["file_path"] = item["location"]["file_path"].replace("\\_", "_").replace("\\ ", " ")
                
                # Clean strings in other fields
                for key in ["description", "fix", "tips"]:
                    if isinstance(item.get(key), str):
                        item[key] = item[key].replace("\\n", " ").replace("\\", "")

            # Save the raw results to a temporary file
            raw_json_path = f"/tmp/{unique_folder}_raw_vuln.json"
            with open(raw_json_path, "w", encoding="utf-8") as raw_file:
                json.dump(processed_vulnerability_results, raw_file, indent=4, ensure_ascii=False)
            logger.info(f"Raw vulnerability results saved at: {raw_json_path}")
            
            # Process with LLM to format results
            prompt = f"""{processed_vulnerability_results} above are the output of the LLM. Return the results in the following JSON format: [pure JSON inside square brackets—do not write anything outside the brackets]. 

            The structure must be:
            [
            {{
                "vulnerabilities": [
                {{
                    "id": "",
                    "vulnerability_type": [""],
                    "title": "",
                    "severity": "",
                    "location": {{
                    "filePath": "",
                    "lineNumber": 
                    }},
                    "description": "",
                    "fix": "",
                    "tips": [""]
                }}
                ],
                "message": "",
                "timestamp": "",
                "location": {{
                "file_path": "",
                "line": ""
                }}
            }}
            ]

            Notes:
            - Only return valid JSON.
            - Do not include any explanations or text outside the JSON.
            - Ensure all fields are included.
            - `vulnerability_type` and `tips` should be arrays.
            - `lineNumber` should be a number (not a string).
            """
            
            
            
            try:
                    content = call_llm(prompt)
                    logger.info(f"LLM response received, content length: {len(content)}")
                    
                    # Extract just the JSON array part
                    try:
                        # Find the JSON array in the response
                        json_start = content.find('[')
                        json_end = content.rfind(']') + 1
                        
                        if json_start >= 0 and json_end > json_start:
                            json_content = content[json_start:json_end]
                            
                            # Clean the JSON content of any escape characters
                            json_content = json_content.replace('\\n', ' ').replace('\\', '')
                            
                            # Parse the cleaned JSON
                            processed_results = json.loads(json_content)
                            logger.info(f"Successfully parsed JSON from LLM response")
                            
                            # Clean up any remaining escape sequences in file paths or other fields
                            for item in processed_results:
                                if isinstance(item.get("location"), dict):
                                    if "file_path" in item["location"]:
                                        item["location"]["file_path"] = item["location"]["file_path"].replace("\\_", "_").replace("\\ ", " ")
                                
                                # Clean strings in other fields
                                for key in ["description", "fix", "tips"]:
                                    if isinstance(item.get(key), str):
                                        item[key] = item[key].replace("\\n", " ").replace("\\", "")
                            
                            processed_vulnerability_results = processed_results
                        else:
                            # Fallback - use the raw content
                            logger.info("JSON array not found in response, trying to parse entire content")
                            processed_results = json.loads(content)
                            
                            # Clean processed results
                            for item in processed_results:
                                if isinstance(item.get("location"), dict):
                                    if "file_path" in item["location"]:
                                        item["location"]["file_path"] = item["location"]["file_path"].replace("\\_", "_").replace("\\ ", " ")
                                
                                # Clean strings in other fields
                                for key in ["description", "fix", "tips"]:
                                    if isinstance(item.get(key), str):
                                        item[key] = item[key].replace("\\n", " ").replace("\\", "")
                            
                            processed_vulnerability_results = processed_results
                            
                    except json.JSONDecodeError as e:
                        logger.info(f"Error parsing LLM response as JSON: {e}")
                        logger.info(f"Content sample: {content[:200]}...")
                        # Continue with the pre-processed results
                        logger.info("Using pre-processed vulnerability results instead")
            except Exception as e:
                logger.info(f"Exception during LLM processing: {e}")
                # Continue with pre-processed results if LLM processing fails
            
            # Save final report and upload to S3
            report_json_path = f"/tmp/{unique_folder}_vuln_report.json"
            try:
                with open(report_json_path, "w", encoding="utf-8") as report_file:
                    json.dump(processed_vulnerability_results, report_file, indent=4, ensure_ascii=False)
                logger.info(f"Vulnerability report saved at: {report_json_path}")
                
                # Verify file exists and has content
                if os.path.exists(report_json_path) and os.path.getsize(report_json_path) > 0:
                    try:
                        # Upload to S3 using S3Helper
                        upload_result = scan_s3_helper.upload_file(report_json_path, f"{unique_folder}_vuln_report.json")
                        if upload_result['success']:
                            logger.info(f"Vulnerability report uploaded to S3 bucket '{SCAN_BUCKET}' as '{unique_folder}_vuln_report.json'")
                            
                            # Verify upload succeeded by checking if file exists in bucket
                            if scan_s3_helper.file_exists(f"{unique_folder}_vuln_report.json"):
                                logger.info("Upload verified successfully")
                                report_s3_path = f"s3://{SCAN_BUCKET}/{unique_folder}_vuln_report.json"
                            else:
                                logger.info("Upload verification failed, trying to upload again")
                                # Try uploading again
                                retry_result = scan_s3_helper.upload_file(report_json_path, f"{unique_folder}_vuln_report.json")
                                if retry_result['success']:
                                    report_s3_path = f"s3://{SCAN_BUCKET}/{unique_folder}_vuln_report.json"
                                else:
                                    logger.error(f"Retry upload failed: {retry_result['message']}")
                        else:
                            logger.error(f"Upload failed: {upload_result['message']}")
                    except Exception as e:
                        logger.info(f"Error uploading file to S3: {e}")
                else:
                    logger.info(f"Failed to create report file or file is empty: {report_json_path}")
            except Exception as e:
                logger.info(f"Error creating vulnerability report: {e}")
        else:
            logger.info("No vulnerabilities detected in the repository.")
            
            # Even if no vulnerabilities found, create an empty report
            empty_report_path = f"/tmp/{unique_folder}_empty_report.json"
            try:
                with open(empty_report_path, "w", encoding="utf-8") as empty_file:
                    json.dump([], empty_file)
                
                # Upload empty report using S3Helper
                upload_result = scan_s3_helper.upload_file(empty_report_path, f"{unique_folder}_vuln_report.json")
                if upload_result['success']:
                    logger.info(f"Empty report uploaded to S3 bucket '{SCAN_BUCKET}' as '{unique_folder}_vuln_report.json'")
                    report_s3_path = f"s3://{SCAN_BUCKET}/{unique_folder}_vuln_report.json"
                else:
                    logger.error(f"Failed to upload empty report: {upload_result['message']}")
            except Exception as e:
                logger.info(f"Error creating/uploading empty report: {e}")

        # Cleanup temporary files.
        shutil.rmtree(temp_dir, ignore_errors=True)
        return report_s3_path
        
    def list_scan_reports():
        """Lists all vulnerability scan reports stored in S3."""
        scan_s3_helper = S3Helper(
            bucket_name=SCAN_BUCKET
        )
        
        result = scan_s3_helper.list_files()
        if result['success'] and result['files']:
            for file_info in result['files']:
                logger.info(file_info['key'])
        else:
            logger.info("No scan reports found.")

    def delete_scan_report(unique_folder):
        """Deletes a vulnerability scan report from S3."""
        scan_s3_helper = S3Helper(
            bucket_name=SCAN_BUCKET
        )
        
        result = scan_s3_helper.delete_file(f"{unique_folder}_vuln_report.json")
        if result['success']:
            logger.info(f"Deleted scan report: {unique_folder}_vuln_report.json")
        else:
            logger.info(f"Error deleting scan report: {result['message']}")

    # ---------- Example Usage ----------
    UNIQUE_FOLDER = data['folder_name']  # Example repository folder in S3
    report_path = scan_repository_with_llm(UNIQUE_FOLDER)
    if report_path:
        logger.info(f"Vulnerability report available at: {report_path}")

    StaticAnalysis.objects.filter(pk=data['staticAnalysis_id']).update(static_analysis_status='Completed', LLM_analysis_result=report_path)

    return f"{data} \n\n =========================== LLM Testing Done Successfully ✅ ==========================="


@shared_task(bind=True)
def GitLeaksTestingTask(self, data):

    # code for GitLeaks testing
    # S3 Buckets
    REPO_BUCKET = config.S3_BUCKET  # Repository storage bucket
    SCAN_BUCKET = config.GITHUB_REPO_REPORT_BUCKET    # Vulnerability scan reports bucket

    # Note: S3Helper automatically handles bucket operations
    def ensure_bucket(bucket_name):
        """Ensure the specified S3 bucket exists; if not, create it."""
        # S3Helper handles bucket validation internally
        print(f"Using bucket '{bucket_name}' via S3Helper")

    # 1️⃣ UNIVERSAL FUNCTION TO SCAN REPOSITORY
    def scan_repository_from_s3(unique_folder):
        """
        Downloads a repository from S3, runs a Gitleaks scan,
        and uploads the vulnerability report back to S3.
        
        Args:
            unique_folder (str): The repository's unique name in S3.
        
        Returns:
            str: S3 path to the uploaded scan report, or None if no vulnerabilities are found.
        """
        # Initialize S3Helper instances
        repo_s3_helper = S3Helper(
            bucket_name=REPO_BUCKET
        )
        
        scan_s3_helper = S3Helper(
            bucket_name=SCAN_BUCKET
        )
        
        ensure_bucket(SCAN_BUCKET)

        temp_dir = f"/tmp/a/{unique_folder}"
        os.makedirs(temp_dir, exist_ok=True)

        print(f"Downloading repository '{unique_folder}' from S3...")

        # Fetch all objects under the repo folder using S3Helper
        files_result = repo_s3_helper.list_files(prefix=f"{unique_folder}/")
        if not files_result['success'] or not files_result['files']:
            print(f"Repository '{unique_folder}' not found in S3.")
            return None

        # Download repository from S3 and preserve directory structure
        for file_info in files_result['files']:
            s3_key = file_info['key']
            # Remove the repository folder prefix (e.g. "MindCare-APIs_bc30848c/")
            relative_path = s3_key[len(unique_folder) + 1 :]
            local_path = os.path.join(temp_dir, relative_path)

            os.makedirs(os.path.dirname(local_path), exist_ok=True)
            print(f"Downloading {s3_key} -> {local_path}")
            
            download_result = repo_s3_helper.download_file(s3_key, local_path)
            if not download_result['success']:
                print(f"Failed to download {s3_key}: {download_result['message']}")

        print(f"Repository downloaded to: {temp_dir}")

        # Run Gitleaks scan using the directory mode
        scan_report = f"/tmp/a/{unique_folder}_scan.json"
        csv_report = f"/tmp/a/{unique_folder}_scan.csv"

        try:
            print(f"Running Gitleaks scan on {temp_dir}...")
            # Using "gitleaks dir" mode to scan the downloaded repo directory.
            command = f"gitleaks dir -v {temp_dir} -f json -r {scan_report}"
            result = subprocess.run(command, shell=True)

            # Gitleaks returns 0 if no leaks, 1 if leaks are found.
            if result.returncode not in [0, 1]:
                print(f"Gitleaks encountered an error. Exit code: {result.returncode}")
                return None

            if not os.path.exists(scan_report):
                print("Error: Gitleaks scan report not found.")
                return None

            # Read and parse the JSON output
            with open(scan_report, "r") as f:
                try:
                    data_json = json.load(f)
                except json.JSONDecodeError:
                    print("Error: Invalid JSON format in Gitleaks report.")
                    return None

            if not data_json:
                print("Scan report is empty (No vulnerabilities found).")
                return None

            # Extract relevant details from each finding using the documented keys
            findings = []
            for leak in data_json:
                findings.append({
                    "file_name": leak.get("File", "N/A"),
                    "line_number": leak.get("Line", "N/A"),
                    "secret": leak.get("Secret", "N/A"),
                    "rule_id": leak.get("RuleID", "N/A"),
                    "entropy": leak.get("Entropy", "N/A"),
                    "commit": leak.get("Commit", "N/A")
                })

            if not findings:
                print("No valid vulnerabilities found.")
                return None

            # Save findings to CSV
            df = pd.DataFrame(findings)
            df.to_csv(csv_report, index=False)
            print(f"Converted scan report to CSV: {csv_report}")

            # Upload the CSV report to S3 using S3Helper
            upload_result = scan_s3_helper.upload_file(csv_report, f"{unique_folder}_scan.csv")
            if upload_result['success']:
                print(f"Scan report uploaded to S3 bucket '{SCAN_BUCKET}' as '{unique_folder}_scan.csv'")
                return f"s3://{SCAN_BUCKET}/{unique_folder}_scan.csv"
            else:
                print(f"Failed to upload scan report: {upload_result['message']}")
                return None

        except Exception as e:
            print(f"Error running Gitleaks: {e}")
            return None

        finally:
            # Cleanup local storage
            shutil.rmtree(temp_dir, ignore_errors=True)
            if os.path.exists(scan_report):
                os.remove(scan_report)
            if os.path.exists(csv_report):
                os.remove(csv_report)

    # 2️⃣ List Scan Reports
    def list_scan_reports():
        """Lists all scan reports stored in S3."""
        scan_s3_helper = S3Helper(bucket_name=SCAN_BUCKET)
        
        result = scan_s3_helper.list_files()
        if result['success'] and result['files']:
            for file_info in result['files']:
                print(file_info['key'])
        else:
            print("No scan reports found.")

    # 3️⃣ Delete a Scan Report
    def delete_scan_report(unique_folder):
        """Deletes a scan report from S3."""
        scan_s3_helper = S3Helper(bucket_name=SCAN_BUCKET)
        
        result = scan_s3_helper.delete_file(f"{unique_folder}_scan.csv")
        if result['success']:
            print(f"Deleted scan report: {unique_folder}_scan.csv")
        else:
            print(f"Error deleting scan report: {result['message']}")

    UNIQUE_FOLDER = data['folder_name'] 
    report_path = scan_repository_from_s3(UNIQUE_FOLDER)
    if report_path:
        print(f"Vulnerability report saved at: {report_path}")

    testing_obj = Testing.objects.get(pk=data['test_id'])
    if testing_obj.test_count<2:
        testing_obj.test_count += 1
        testing_obj.GitLeaks_test_result = report_path
        testing_obj.save()
    else:
        Testing.objects.filter(pk=data['test_id']).update(testing_status='Completed', GitLeaks_test_result=report_path)
    return f"{data} \n\n =========================== GitLeaks Testing Done Successfully ✅ ==========================="

@shared_task(bind=True)
def NucleiTestingTask(self, data):
    try:
        print(f"data: {data}")
        # Get the DynamicAnalysis object using the provided ID
        dynamic_analysis = DynamicAnalysis.objects.get(pk=data)
        # change dynamic_analysis_status to 'InProgress'
        DynamicAnalysis.objects.filter(pk=data).update(dynamic_analysis_status='InProgress')
        logger.info(f"Starting Nuclei scan with data: {dynamic_analysis}")
        
        # MinIO/S3 Configuration
        SCAN_BUCKET = config.GITHUB_REPO_REPORT_BUCKET
        
        # Initialize S3Helper
        scan_s3_helper = S3Helper(
            bucket_name=SCAN_BUCKET
        )
        
        def ensure_bucket():
            """Ensure the specified S3 bucket exists; if not, create it."""
            logger.info(f"Using bucket '{SCAN_BUCKET}' via S3Helper")
        
        ensure_bucket()
        
        # Get target URL from the DynamicAnalysis object
        target_url = dynamic_analysis.source_url
        if not target_url:
            logger.error("No target URL provided for Nuclei scan")
            return "Error: No target URL provided for Nuclei scan"
        
        # Create a unique identifier for the scan
        scan_id = f"nuclei_scan_{dynamic_analysis.id}_{uuid.uuid4().hex[:8]}"
        
        # Run Nuclei scan on HOST MACHINE
        logger.info(f"Running Nuclei scan on {target_url}")
        
        # Path where nuclei templates exist on the host machine
        nuclei_templates_path = "app/nuclei-templates-main"  # Adjust this to your host path
        
        # Execute nuclei command on host machine
        
        command = f"nuclei -u {target_url} -t /Users/sanket./Downloads/nuclei-templates-main"
        
        try:
            result = subprocess.run(command, shell=True, capture_output=True, text=True, timeout=300)
            
            if result.returncode not in [0, 1]:  # Nuclei returns 1 if vulnerabilities found
                logger.error(f"Nuclei scan failed: {result.stderr}")
                return f"Error: Nuclei scan failed: {result.stderr}"
            
            logger.info("Nuclei scan completed")
            
            # Read the JSON output from the file
            json_path = f"/tmp/{scan_id}.json"
            if os.path.exists(json_path):
                with open(json_path, 'r') as f:
                    nuclei_output = f.read()
            else:
                nuclei_output = result.stdout
            
            # Process with LLM
            logger.info("Processing scan results with LLM")
            prompt = f"{nuclei_output}\nabove are the output of nuclei give this in below json format [pure json inside square brackets dont write anything outside the squre brackets] you have to give url, issue, severity, description for the issue [note: only return json for all the scaned results, i am going to add this in my code] \n\n[{{ \"url\": \"\", \"issue\": \"\", \"severity\": \"\", \"description\": \"\", \"timestamp\": \"\" }} ,{{ \"url\": \"\", \"issue\": \"\", \"severity\": \"\", \"description\": \"\", \"timestamp\": \"\" }} ]"

            content = call_llm(prompt)

            if content:
                # Save results to temporary file
                result_json_path = f"/tmp/{scan_id}_result.json"
                try:
                    # Try to parse as JSON first
                    parsed_content = json.loads(content)
                    with open(result_json_path, 'w') as f:
                        json.dump(parsed_content, f, indent=2)
                except json.JSONDecodeError:
                    # If not valid JSON, save raw content
                    with open(result_json_path, 'w') as f:
                        f.write(content)
                
                # Upload to S3 using S3Helper
                upload_result = scan_s3_helper.upload_file(result_json_path, f"{scan_id}.json")
                if upload_result['success']:
                    s3_path = f"s3://{SCAN_BUCKET}/{scan_id}.json"
                    logger.info(f"Nuclei scan results uploaded to {s3_path}")
                    
                    # Update DynamicAnalysis object
                    DynamicAnalysis.objects.filter(pk=data).update(
                        dynamic_analysis_status='Completed', 
                        Nuclei_analysis_result=s3_path
                    )
                    
                    # Cleanup temp files
                    if os.path.exists(json_path):
                        os.remove(json_path)
                    if os.path.exists(result_json_path):
                        os.remove(result_json_path)
                    
                    return f"Nuclei scan completed and results uploaded to {s3_path}"
                else:
                    logger.error(f"Failed to upload results: {upload_result['message']}")
                    return f"Error: Failed to upload results: {upload_result['message']}"
            else:
                logger.error("LLM processing returned empty content")
                return "Error: LLM processing returned empty content"
                
        except subprocess.TimeoutExpired:
            logger.error("Nuclei scan timed out after 5 minutes")
            return "Error: Nuclei scan timed out"
        except Exception as e:
            logger.error(f"Error running Nuclei scan: {str(e)}")
            return f"Error running Nuclei scan: {str(e)}"
            
    except Exception as e:
        logger.error(f"Error in NucleiTestingTask: {str(e)}")
        return f"Error in NucleiTestingTask: {str(e)}"


@shared_task(bind=True)
def CVEscanTestingTask(self, data):

    # code for CVEscan testing
    time.sleep(15)

    testing_obj = Testing.objects.get(pk=data['test_id'])
    if testing_obj.test_count<2:
        testing_obj.test_count += 1
        testing_obj.CVEscan_test_result = ""
        testing_obj.save()
    else:
        Testing.objects.filter(pk=data['test_id']).update(testing_status='Completed', CVEscan_test_result="")
    return f"{data} \n\n =========================== CVEscan Testing Done Successfully ✅ ==========================="


@shared_task(bind=True)
def MobileAppAnalysisTask(self, mobile_analysis_id: int):
    """
    Celery task to analyze mobile app (APK/IPA) for security vulnerabilities.
    
    Steps:
    1. Get the MobileAppAnalysis record
    2. Download the app file from storage
    3. Run vulnerability analysis using mobile_app_parcer
    4. Upload results to S3
    5. Update the database record with results
    """
    from api.models import MobileAppAnalysis
    from api.helpers.mobile_app_parcer import analyze_app
    from api.helpers.llm_helper import call_llm
    
    # Initialize S3Helper for mobile app analysis results
    MOBILE_SCAN_BUCKET = getattr(config, 'MOBILE_APP_SCAN_BUCKET', config.GITHUB_REPO_REPORT_BUCKET)
    s3_helper = S3Helper(bucket_name=MOBILE_SCAN_BUCKET)
    
    try:
        # Get the MobileAppAnalysis record
        mobile_analysis = MobileAppAnalysis.objects.get(pk=mobile_analysis_id)
        
        # Update status to InProgress
        mobile_analysis.mobile_app_analysis_status = 'InProgress'
        mobile_analysis.save()
        
        logger.info(f"Starting mobile app analysis for ID: {mobile_analysis_id}")
        
        # Get the app file path
        app_file_path = mobile_analysis.app_file.path
        
        if not os.path.exists(app_file_path):
            raise FileNotFoundError(f"App file not found: {app_file_path}")
        
        logger.info(f"Analyzing app file: {app_file_path}")
        
        # Run the vulnerability analysis
        results = analyze_app(app_file_path, call_llm)
        
        logger.info(f"Analysis complete. Found {results.get('total_vulnerabilities', 0)} vulnerabilities")
        
        # Extract summary counts
        summary = results.get('summary', {})
        critical_count = summary.get('critical', 0)
        high_count = summary.get('high', 0)
        medium_count = summary.get('medium', 0)
        low_count = summary.get('low', 0)
        total_vulnerabilities = results.get('total_vulnerabilities', 0)
        
        # Generate unique filename for S3
        timestamp = time.strftime('%Y%m%d_%H%M%S')
        s3_object_key = f"mobile_app_analysis/{mobile_analysis_id}_{timestamp}_results.json"
        
        # Save results to a temporary file
        import tempfile
        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as tmp_file:
            json.dump(results, tmp_file, indent=2)
            tmp_file_path = tmp_file.name
        
        try:
            # Upload to S3
            upload_result = s3_helper.upload_file(tmp_file_path, s3_object_key)
            
            if upload_result['success']:
                s3_path = f"s3://{MOBILE_SCAN_BUCKET}/{s3_object_key}"
                logger.info(f"Results uploaded to {s3_path}")
                
                # Update the MobileAppAnalysis record
                mobile_analysis.analysis_result = s3_path
                mobile_analysis.mobile_app_analysis_status = 'Completed'
                mobile_analysis.total_vulnerabilities = total_vulnerabilities
                mobile_analysis.critical_count = critical_count
                mobile_analysis.high_count = high_count
                mobile_analysis.medium_count = medium_count
                mobile_analysis.low_count = low_count
                mobile_analysis.save()
                
                logger.info(f"Mobile app analysis completed successfully for ID: {mobile_analysis_id}")
                return f"Mobile app analysis completed. Found {total_vulnerabilities} vulnerabilities."
            else:
                raise Exception(f"Failed to upload results to S3: {upload_result['message']}")
                
        finally:
            # Cleanup temporary file
            if os.path.exists(tmp_file_path):
                os.unlink(tmp_file_path)
                
    except MobileAppAnalysis.DoesNotExist:
        logger.error(f"MobileAppAnalysis with ID {mobile_analysis_id} not found")
        return f"Error: MobileAppAnalysis with ID {mobile_analysis_id} not found"
        
    except Exception as e:
        logger.error(f"Error in MobileAppAnalysisTask: {str(e)}")
        
        # Update status to Failed
        try:
            MobileAppAnalysis.objects.filter(pk=mobile_analysis_id).update(
                mobile_app_analysis_status='Failed',
                error_message=str(e)
            )
        except Exception as update_error:
            logger.error(f"Failed to update error status: {str(update_error)}")
        
        return f"Error in MobileAppAnalysisTask: {str(e)}"


@shared_task(bind=True)
def BrowserExtensionAnalysisTask(self, extension_analysis_id: int):
    """
    Celery task to analyze browser extension for security vulnerabilities.
    
    Supports Chrome (.crx), Firefox (.xpi), Safari (.safariextz), and generic (.zip) extensions.
    
    Steps:
    1. Get the BrowserExtensionAnalysis record
    2. Download the extension file from storage
    3. Run vulnerability analysis using extension_parser
    4. Upload results to S3
    5. Update the database record with results
    """
    from api.models import BrowserExtensionAnalysis
    from api.helpers.extension_parser import analyze_extension
    from api.helpers.llm_helper import call_llm
    
    # Initialize S3Helper for browser extension analysis results
    EXTENSION_SCAN_BUCKET = getattr(config, 'BROWSER_EXTENSION_SCAN_BUCKET', config.GITHUB_REPO_REPORT_BUCKET)
    s3_helper = S3Helper(bucket_name=EXTENSION_SCAN_BUCKET)
    
    try:
        # Get the BrowserExtensionAnalysis record
        extension_analysis = BrowserExtensionAnalysis.objects.get(pk=extension_analysis_id)
        
        # Update status to Extracting
        extension_analysis.browser_extension_analysis_status = 'Extracting'
        extension_analysis.save()
        
        logger.info(f"Starting browser extension analysis for ID: {extension_analysis_id}")
        
        # Get the extension file path
        extension_file_path = extension_analysis.extension_file.path
        
        if not os.path.exists(extension_file_path):
            raise FileNotFoundError(f"Extension file not found: {extension_file_path}")
        
        logger.info(f"Analyzing extension file: {extension_file_path}")
        
        # Update status to InProgress
        extension_analysis.browser_extension_analysis_status = 'InProgress'
        extension_analysis.save()
        
        # Run the vulnerability analysis
        results = analyze_extension(extension_file_path, call_llm)
        
        logger.info(f"Analysis complete. Found {results.get('total_vulnerabilities', 0)} vulnerabilities")
        
        # Extract extension info
        extension_info = results.get('extension_info', {})
        extension_name = extension_info.get('name', extension_analysis.extension_name or 'Unknown')
        extension_version = extension_info.get('version', '')
        manifest_version = extension_info.get('manifest_version')
        permissions = extension_info.get('permissions', []) + extension_info.get('host_permissions', [])
        
        # Extract summary counts
        summary = results.get('summary', {})
        by_severity = summary.get('by_severity', {})
        critical_count = by_severity.get('critical', 0)
        high_count = by_severity.get('high', 0)
        medium_count = by_severity.get('medium', 0)
        low_count = by_severity.get('low', 0)
        total_vulnerabilities = results.get('total_vulnerabilities', 0)
        code_vulnerabilities = results.get('code_vulnerabilities', 0)
        permission_issues = results.get('permission_issues', 0)
        risk_score = summary.get('risk_score', 0)
        
        # Generate unique filename for S3
        timestamp = time.strftime('%Y%m%d_%H%M%S')
        s3_object_key = f"browser_extension_analysis/{extension_analysis_id}_{timestamp}_results.json"
        
        # Save results to a temporary file
        import tempfile
        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as tmp_file:
            json.dump(results, tmp_file, indent=2)
            tmp_file_path = tmp_file.name
        
        try:
            # Upload to S3
            upload_result = s3_helper.upload_file(tmp_file_path, s3_object_key)
            
            if upload_result['success']:
                s3_path = f"s3://{EXTENSION_SCAN_BUCKET}/{s3_object_key}"
                logger.info(f"Results uploaded to {s3_path}")
                
                # Update the BrowserExtensionAnalysis record
                extension_analysis.extension_name = extension_name
                extension_analysis.extension_version = extension_version
                extension_analysis.manifest_version = manifest_version
                extension_analysis.permissions = permissions
                extension_analysis.analysis_result = s3_path
                extension_analysis.browser_extension_analysis_status = 'Completed'
                extension_analysis.total_vulnerabilities = total_vulnerabilities
                extension_analysis.code_vulnerabilities = code_vulnerabilities
                extension_analysis.permission_issues = permission_issues
                extension_analysis.critical_count = critical_count
                extension_analysis.high_count = high_count
                extension_analysis.medium_count = medium_count
                extension_analysis.low_count = low_count
                extension_analysis.risk_score = risk_score
                extension_analysis.save()
                
                logger.info(f"Browser extension analysis completed successfully for ID: {extension_analysis_id}")
                return f"Browser extension analysis completed. Found {total_vulnerabilities} vulnerabilities. Risk Score: {risk_score}/100"
            else:
                raise Exception(f"Failed to upload results to S3: {upload_result['message']}")
                
        finally:
            # Cleanup temporary file
            if os.path.exists(tmp_file_path):
                os.unlink(tmp_file_path)
                
    except BrowserExtensionAnalysis.DoesNotExist:
        logger.error(f"BrowserExtensionAnalysis with ID {extension_analysis_id} not found")
        return f"Error: BrowserExtensionAnalysis with ID {extension_analysis_id} not found"
        
    except Exception as e:
        logger.error(f"Error in BrowserExtensionAnalysisTask: {str(e)}")
        
        # Update status to Failed
        try:
            BrowserExtensionAnalysis.objects.filter(pk=extension_analysis_id).update(
                browser_extension_analysis_status='Failed',
                error_message=str(e)
            )
        except Exception as update_error:
            logger.error(f"Failed to update error status: {str(update_error)}")
        
        return f"Error in BrowserExtensionAnalysisTask: {str(e)}"

def _extract_archive(file_field, dest_dir, zipfile, descend=True):
    """
    Extract an uploaded .zip into dest_dir (guarding against zip-slip).

    descend=True  (SCA): return the single top-level folder if the archive nests
                  everything under one (so scan_project finds requirements.txt /
                  package.json / pyproject.toml at the root it inspects).
    descend=False (Taint): return dest_dir itself — the taint engine needs the
                  extraction ROOT so intra-project imports like `pkg.mod` resolve
                  across files.
    """
    if not zipfile.is_zipfile(file_field):
        # is_zipfile consumed/seeked the file; reopen via storage for extraction.
        file_field.seek(0)
    with zipfile.ZipFile(file_field) as zf:
        # Guard against path traversal (zip slip): reject absolute / .. members.
        for member in zf.namelist():
            norm = os.path.normpath(member)
            if norm.startswith(('/', '..')) or os.path.isabs(norm):
                raise ValueError(f"unsafe path in archive: {member}")
        zf.extractall(dest_dir)

    if not descend:
        return dest_dir
    entries = [e for e in os.listdir(dest_dir) if not e.startswith('__MACOSX')]
    if len(entries) == 1 and os.path.isdir(os.path.join(dest_dir, entries[0])):
        return os.path.join(dest_dir, entries[0])
    return dest_dir


# Backwards-compatible alias for the SCA task.
def _extract_sca_archive(file_field, dest_dir, zipfile):
    return _extract_archive(file_field, dest_dir, zipfile, descend=True)


@shared_task(bind=True)
def SCAScanTask(self, sca_analysis_id):
    """
    Software Composition Analysis. The source is either a GitHub repo (cloned)
    or an uploaded .zip of a local repo (extracted); we then run the
    SoftwareCompositionAnalyzer (OSV/NVD dependency CVE lookups + regex SAST)
    and persist the JSON result + severity rollups on the SCAAnalysis record.
    """
    import tempfile
    import zipfile
    from api.models import SCAAnalysis
    from api.helpers.sca_core import SoftwareCompositionAnalyzer

    try:
        sca = SCAAnalysis.objects.get(pk=sca_analysis_id)
    except SCAAnalysis.DoesNotExist:
        logger.error(f"SCAScanTask: SCAAnalysis {sca_analysis_id} not found")
        return f"Error: SCAAnalysis {sca_analysis_id} not found"

    source_type = sca.source_type or 'github'
    repo_url = (sca.source_url or "").strip()
    has_file = bool(sca.source_file)

    if source_type == 'github' and not repo_url:
        SCAAnalysis.objects.filter(pk=sca_analysis_id).update(
            sca_analysis_status='Failed', error_message='No source_url provided')
        return "Error: no source_url provided"
    if source_type == 'upload' and not has_file:
        SCAAnalysis.objects.filter(pk=sca_analysis_id).update(
            sca_analysis_status='Failed', error_message='No uploaded file provided')
        return "Error: no uploaded file provided"

    temp_dir = tempfile.mkdtemp(prefix=f"sca_{sca_analysis_id}_")
    try:
        if source_type == 'upload':
            SCAAnalysis.objects.filter(pk=sca_analysis_id).update(sca_analysis_status='Extracting')
            logger.info(f"SCAScanTask: extracting uploaded archive -> {temp_dir}")
            scan_root = _extract_sca_archive(sca.source_file, temp_dir, zipfile)
            project_name = os.path.splitext(os.path.basename(sca.source_file.name))[0] or "uploaded-repo"
        else:
            SCAAnalysis.objects.filter(pk=sca_analysis_id).update(sca_analysis_status='Cloning')
            logger.info(f"SCAScanTask: cloning {repo_url} -> {temp_dir}")
            Repo.clone_from(repo_url, temp_dir, depth=1)
            scan_root = temp_dir
            project_name = repo_url.rstrip('/').split('/')[-1].replace('.git', '')

        SCAAnalysis.objects.filter(pk=sca_analysis_id).update(sca_analysis_status='InProgress')

        analyzer = SoftwareCompositionAnalyzer(logger=logger)
        result = analyzer.scan_project(scan_root, project_name=project_name)

        # Severity rollups across dependency CVEs + code (SAST) findings.
        stats = result.get('stats', {}) or {}
        deps = result.get('dependencies', []) or []
        code_vulns = result.get('code_vulnerabilities', []) or []
        counts = {'critical': stats.get('critical', 0), 'high': stats.get('high', 0),
                  'medium': stats.get('medium', 0), 'low': stats.get('low', 0)}
        for cv in code_vulns:
            sev = (cv.get('severity') or '').lower()
            if sev in counts:
                counts[sev] += 1
        total_vulns = sum(len(d.get('vulnerabilities', [])) for d in deps)

        SCAAnalysis.objects.filter(pk=sca_analysis_id).update(
            sca_analysis_status='Completed',
            analysis_result=result,
            total_dependencies=len(deps),
            total_vulnerabilities=total_vulns,
            code_vulnerabilities=len(code_vulns),
            critical_count=counts['critical'],
            high_count=counts['high'],
            medium_count=counts['medium'],
            low_count=counts['low'],
            error_message='',
        )
        logger.info(f"SCAScanTask: completed {sca.scan_uuid} "
                    f"({len(deps)} deps, {total_vulns} dep-CVEs, {len(code_vulns)} code issues)")
        return f"SCA scan completed for {sca.scan_uuid}"

    except Exception as e:
        logger.exception("SCAScanTask failed")
        SCAAnalysis.objects.filter(pk=sca_analysis_id).update(
            sca_analysis_status='Failed', error_message=str(e)[:2000])
        return f"Error in SCAScanTask: {e}"
    finally:
        shutil.rmtree(temp_dir, ignore_errors=True)


@shared_task(bind=True)
def TaintAnalysisTask(self, static_analysis_id, is_primary=True):
    """
    Cross-file, repo-wide taint SAST (deterministic; Python; no LLM).

    Source is either a GitHub repo (cloned) or an uploaded .zip of dropped
    source (extracted). Runs the taint engine (api/helpers/sast) over the whole
    checkout, tracing attacker-controlled input from sources to dangerous sinks
    ACROSS files. Findings + severity rollups are stored on Taint_analysis_result.

    is_primary=True  -> this task owns the record's status (standalone 'Taint' scan).
    is_primary=False -> auto-triggered alongside another pipeline (LLM/GitLeaks/CVE);
                        it ONLY writes Taint_analysis_result and never touches
                        static_analysis_status, so it can't race the primary task.
    """
    import tempfile
    import zipfile
    from api.helpers.sast import scan_repo

    try:
        sa = StaticAnalysis.objects.get(pk=static_analysis_id)
    except StaticAnalysis.DoesNotExist:
        logger.error(f"TaintAnalysisTask: StaticAnalysis {static_analysis_id} not found")
        return f"Error: StaticAnalysis {static_analysis_id} not found"

    is_upload = (sa.source_type == 'upload') and bool(sa.source_file)
    repo_url = (sa.source_url or "").strip()
    if not is_upload and not repo_url:
        if is_primary:
            StaticAnalysis.objects.filter(pk=static_analysis_id).update(
                static_analysis_status='Failed', error_message='No source_url or upload provided')
        return "Error: no source provided"

    temp_dir = tempfile.mkdtemp(prefix=f"taint_{static_analysis_id}_")
    try:
        if is_upload:
            if is_primary:
                StaticAnalysis.objects.filter(pk=static_analysis_id).update(
                    static_analysis_status='InProgress')
            logger.info(f"TaintAnalysisTask: extracting upload -> {temp_dir} (primary={is_primary})")
            # descend=False: scan the extraction ROOT so package imports resolve.
            scan_root = _extract_archive(sa.source_file, temp_dir, zipfile, descend=False)
        else:
            logger.info(f"TaintAnalysisTask: cloning {repo_url} -> {temp_dir} (primary={is_primary})")
            Repo.clone_from(repo_url, temp_dir, depth=1)
            scan_root = temp_dir

        # Persistent triage decisions for this project (survive across scans),
        # keyed by the stable finding fingerprint.
        triage = {
            t.fingerprint: {'status': t.status, 'note': t.note}
            for t in SASTTriage.objects.filter(project=sa.project).exclude(status='open')
        }

        result = scan_repo(scan_root, triage=triage)

        payload = {
            'taint_findings': result['findings'],   # all findings (with suppression/triage labels)
            'active': result['active'],              # active subset only
            'summary': result['summary'],            # counts over ACTIVE findings
            'total': result['total'],
            'active_total': result['active_total'],
            'suppressed_total': result['suppressed_total'],
            'cross_file': result['cross_file'],
        }
        fields = {'Taint_analysis_result': payload}
        if is_primary:
            fields['static_analysis_status'] = 'Completed'
            fields['error_message'] = ''
        StaticAnalysis.objects.filter(pk=static_analysis_id).update(**fields)
        logger.info(f"TaintAnalysisTask: completed {sa.scan_uuid} "
                    f"({result['total']} findings, {result['active_total']} active, "
                    f"{result['suppressed_total']} suppressed/triaged, "
                    f"{result['cross_file']} cross-file, primary={is_primary})")
        return f"Taint analysis completed for {sa.scan_uuid}"

    except Exception as e:
        logger.exception("TaintAnalysisTask failed")
        if is_primary:
            StaticAnalysis.objects.filter(pk=static_analysis_id).update(
                static_analysis_status='Failed', error_message=str(e)[:2000])
        return f"Error in TaintAnalysisTask: {e}"
    finally:
        shutil.rmtree(temp_dir, ignore_errors=True)
