#!/usr/bin/env python3
"""
Mobile App Vulnerability Scanner
Decompiles APK/IPA files and analyzes source code for security vulnerabilities
"""

import os
import subprocess
import json
import tempfile
import shutil
from pathlib import Path
from typing import List, Dict, Any, Optional
import zipfile
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class AppDecompiler:
    """Handles decompilation of mobile applications"""
    
    def __init__(self, app_path: str):
        self.app_path = Path(app_path)
        self.app_type = self._detect_app_type()
        self.temp_dir = None
        self.source_dir = None
        
    def _detect_app_type(self) -> str:
        """Detect if file is APK or IPA"""
        suffix = self.app_path.suffix.lower()
        if suffix == '.apk':
            return 'apk'
        elif suffix == '.ipa':
            return 'ipa'
        else:
            raise ValueError(f"Unsupported file type: {suffix}. Only .apk and .ipa supported")
    
    def decompile(self) -> Path:
        """Decompile the app and return source directory path"""
        self.temp_dir = Path(tempfile.mkdtemp(prefix='app_decompile_'))
        
        if self.app_type == 'apk':
            self.source_dir = self._decompile_apk()
        else:
            self.source_dir = self._decompile_ipa()
            
        return self.source_dir
    
    def _decompile_apk(self) -> Path:
        """Decompile APK using apktool and dex2jar"""
        output_dir = self.temp_dir / 'apk_source'
        
        # Try using apktool
        try:
            logger.info("Decompiling APK with apktool...")
            subprocess.run([
                'apktool', 'd', str(self.app_path), 
                '-o', str(output_dir), '-f'
            ], check=True, capture_output=True)
            return output_dir
        except (subprocess.CalledProcessError, FileNotFoundError):
            logger.info("apktool not found or failed, using basic unzip method...")
            return self._unzip_apk()
    
    def _unzip_apk(self) -> Path:
        """Basic APK extraction as fallback"""
        output_dir = self.temp_dir / 'apk_extracted'
        output_dir.mkdir(exist_ok=True)
        
        with zipfile.ZipFile(self.app_path, 'r') as zip_ref:
            zip_ref.extractall(output_dir)
        
        return output_dir
    
    def _decompile_ipa(self) -> Path:
        """Extract and decompile IPA file"""
        output_dir = self.temp_dir / 'ipa_source'
        output_dir.mkdir(exist_ok=True)
        
        logger.info("Extracting IPA file...")
        with zipfile.ZipFile(self.app_path, 'r') as zip_ref:
            zip_ref.extractall(output_dir)
        
        # Look for Payload directory
        payload_dir = output_dir / 'Payload'
        if payload_dir.exists():
            return payload_dir
        
        return output_dir
    
    def cleanup(self):
        """Remove temporary files"""
        if self.temp_dir and self.temp_dir.exists():
            shutil.rmtree(self.temp_dir)


class SourceCodeChunker:
    """Splits source code into manageable chunks"""
    
    def __init__(self, source_dir: Path, chunk_size: int = 5000):
        self.source_dir = source_dir
        self.chunk_size = chunk_size
        self.supported_extensions = {'.java', '.kt', '.xml', '.smali', '.swift', '.m', '.mm', '.h'}
    
    def get_source_files(self) -> List[Path]:
        """Recursively find all source files"""
        source_files = []
        for ext in self.supported_extensions:
            source_files.extend(self.source_dir.rglob(f'*{ext}'))
        return sorted(source_files)
    
    def chunk_files(self) -> List[Dict[str, Any]]:
        """Split files into chunks with metadata"""
        chunks = []
        source_files = self.get_source_files()
        
        logger.info(f"Found {len(source_files)} source files to analyze")
        
        for file_path in source_files:
            try:
                with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read()
                
                # Split large files into chunks
                if len(content) <= self.chunk_size:
                    chunks.append({
                        'file': str(file_path.relative_to(self.source_dir)),
                        'content': content,
                        'chunk_index': 0,
                        'total_chunks': 1
                    })
                else:
                    lines = content.split('\n')
                    current_chunk = []
                    current_size = 0
                    chunk_index = 0
                    
                    for line in lines:
                        line_size = len(line) + 1
                        if current_size + line_size > self.chunk_size and current_chunk:
                            chunks.append({
                                'file': str(file_path.relative_to(self.source_dir)),
                                'content': '\n'.join(current_chunk),
                                'chunk_index': chunk_index,
                                'total_chunks': -1  # Will update later
                            })
                            current_chunk = [line]
                            current_size = line_size
                            chunk_index += 1
                        else:
                            current_chunk.append(line)
                            current_size += line_size
                    
                    if current_chunk:
                        chunks.append({
                            'file': str(file_path.relative_to(self.source_dir)),
                            'content': '\n'.join(current_chunk),
                            'chunk_index': chunk_index,
                            'total_chunks': chunk_index + 1
                        })
                    
                    # Update total_chunks for all chunks of this file
                    file_chunks = [c for c in chunks if c['file'] == str(file_path.relative_to(self.source_dir))]
                    total = len(file_chunks)
                    for c in file_chunks:
                        c['total_chunks'] = total
                        
            except Exception as e:
                logger.info(f"Error reading {file_path}: {e}")
        
        return chunks


class VulnerabilityScanner:
    """Scans source code chunks for vulnerabilities using LLM"""
    
    def __init__(self, call_llm_func):
        self.call_llm = call_llm_func
        self.vulnerabilities = []
    
    def scan_chunk(self, chunk: Dict[str, Any]) -> Optional[Dict]:
        """Scan a single chunk and extract vulnerabilities"""
        prompt = self._build_vulnerability_prompt(chunk)
        
        logger.info(f"Scanning {chunk['file']} (chunk {chunk['chunk_index'] + 1}/{chunk['total_chunks']})...")
        
        try:
            response = self.call_llm(prompt)
            return self._parse_llm_response(response, chunk)
        except Exception as e:
            logger.info(f"Error scanning chunk: {e}")
            return None
    
    def _build_vulnerability_prompt(self, chunk: Dict[str, Any]) -> str:
        """Build prompt for LLM vulnerability analysis"""
        return f"""Analyze the following mobile app source code for security vulnerabilities.

File: {chunk['file']}
Chunk: {chunk['chunk_index'] + 1}/{chunk['total_chunks']}

Source Code:
```
{chunk['content']}
```

Identify security vulnerabilities including but not limited to:
- SQL injection
- Hardcoded credentials/API keys
- Insecure data storage
- Weak cryptography
- Insecure network communication
- Code injection vulnerabilities
- Authentication/authorization issues
- Sensitive data exposure
- Improper session handling
- Insecure use of third-party libraries

Return findings in JSON format:
{{
    "vulnerabilities": [
        {{
            "type": "vulnerability type",
            "severity": "critical|high|medium|low",
            "description": "detailed description",
            "location": "specific code location",
            "recommendation": "how to fix"
        }}
    ]
}}

If no vulnerabilities found, return: {{"vulnerabilities": []}}
"""
    
    def _parse_llm_response(self, response: str, chunk: Dict[str, Any]) -> Optional[Dict]:
        """Parse LLM response and extract vulnerabilities"""
        try:
            # Try to extract JSON from response
            start = response.find('{')
            end = response.rfind('}') + 1
            if start != -1 and end > start:
                json_str = response[start:end]
                result = json.loads(json_str)
                
                # Add file context to each vulnerability
                if 'vulnerabilities' in result and result['vulnerabilities']:
                    for vuln in result['vulnerabilities']:
                        vuln['file'] = chunk['file']
                        vuln['chunk'] = f"{chunk['chunk_index'] + 1}/{chunk['total_chunks']}"
                    
                    self.vulnerabilities.extend(result['vulnerabilities'])
                
                return result
        except json.JSONDecodeError as e:
            logger.info(f"Failed to parse JSON response: {e}")
        
        return None
    
    def get_results(self) -> Dict[str, Any]:
        """Return all found vulnerabilities as JSON"""
        return {
            "total_vulnerabilities": len(self.vulnerabilities),
            "vulnerabilities": self.vulnerabilities,
            "summary": self._generate_summary()
        }
    
    def _generate_summary(self) -> Dict[str, int]:
        """Generate summary statistics"""
        summary = {"critical": 0, "high": 0, "medium": 0, "low": 0}
        for vuln in self.vulnerabilities:
            severity = vuln.get('severity', 'low').lower()
            if severity in summary:
                summary[severity] += 1
        return summary


def analyze_app(app_path: str, call_llm_func, chunk_size: int = 5000) -> Dict[str, Any]:
    """
    Main function to decompile and analyze mobile app
    
    Args:
        app_path: Path to APK or IPA file
        call_llm_func: Function that takes source code and returns vulnerability analysis
        chunk_size: Maximum characters per chunk (default: 5000)
    
    Returns:
        JSON dict containing all found vulnerabilities
    """
    decompiler = None
    
    try:
        # Step 1: Decompile the app
        logger.info(f"Starting analysis of {app_path}...")
        decompiler = AppDecompiler(app_path)
        source_dir = decompiler.decompile()
        logger.info(f"Decompilation complete: {source_dir}")
        
        # Step 2: Chunk the source code
        chunker = SourceCodeChunker(source_dir, chunk_size)
        chunks = chunker.chunk_files()
        logger.info(f"Created {len(chunks)} chunks for analysis")
        
        # Step 3: Scan each chunk
        scanner = VulnerabilityScanner(call_llm_func)
        for i, chunk in enumerate(chunks, 1):
            logger.info(f"Progress: {i}/{len(chunks)}")
            scanner.scan_chunk(chunk)
        
        # Step 4: Return results
        results = scanner.get_results()
        logger.info(f"\nAnalysis complete! Found {results['total_vulnerabilities']} vulnerabilities")
        logger.info(f"Summary: {results['summary']}")
        
        return results
        
    finally:
        # Cleanup
        if decompiler:
            decompiler.cleanup()


if __name__ == "__main__":
    pass
    # Example usage (requires call_llm function to be imported)
    print("This module should be imported. Example usage:")
    print("""
        from app_parser import analyze_app
        from my_llm_module import call_llm

        results = analyze_app('path/to/app.apk', call_llm)
        print(json.dumps(results, indent=2))
            """)
    # from llm_helper import call_llm

    # results = analyze_app('app.apk', call_llm)
    # # save in json file 
    # with open('vulnerability_report.json', 'w') as f:
    #     json.dump(results, f, indent=4)

    # """)