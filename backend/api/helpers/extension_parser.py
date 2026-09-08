#!/usr/bin/env python3
"""
Browser Extension Vulnerability Scanner
Analyzes Chrome, Firefox, Safari extensions for security vulnerabilities
"""

import os
import json
import tempfile
import shutil
import zipfile
from pathlib import Path
from typing import List, Dict, Any, Optional
import re


class ExtensionExtractor:
    """Handles extraction of browser extensions"""
    
    EXTENSION_TYPES = {
        '.crx': 'chrome',
        '.xpi': 'firefox',
        '.safariextz': 'safari',
        '.zip': 'generic'
    }
    
    def __init__(self, extension_path: str):
        self.extension_path = Path(extension_path)
        self.extension_type = self._detect_extension_type()
        self.temp_dir = None
        self.source_dir = None
        self.manifest = None
        
    def _detect_extension_type(self) -> str:
        """Detect browser extension type"""
        suffix = self.extension_path.suffix.lower()
        
        # Check if it's a directory (unpacked extension)
        if self.extension_path.is_dir():
            if (self.extension_path / 'manifest.json').exists():
                return 'unpacked'
            else:
                raise ValueError("Directory does not contain manifest.json")
        
        ext_type = self.EXTENSION_TYPES.get(suffix)
        if not ext_type:
            raise ValueError(f"Unsupported extension type: {suffix}")
        return ext_type
    
    def extract(self) -> Path:
        """Extract extension and return source directory path"""
        if self.extension_type == 'unpacked':
            self.source_dir = self.extension_path
            self.manifest = self._load_manifest()
            return self.source_dir
        
        self.temp_dir = Path(tempfile.mkdtemp(prefix='ext_extract_'))
        
        if self.extension_type == 'chrome':
            self.source_dir = self._extract_crx()
        elif self.extension_type == 'firefox':
            self.source_dir = self._extract_xpi()
        elif self.extension_type == 'safari':
            self.source_dir = self._extract_safari()
        else:
            self.source_dir = self._extract_generic()
        
        self.manifest = self._load_manifest()
        return self.source_dir
    
    def _extract_crx(self) -> Path:
        """Extract Chrome extension (.crx)"""
        output_dir = self.temp_dir / 'chrome_extension'
        output_dir.mkdir(exist_ok=True)
        
        print("Extracting Chrome extension (.crx)...")
        
        # CRX format: header + zip data
        # Read and skip CRX header
        with open(self.extension_path, 'rb') as f:
            # Read magic number
            magic = f.read(4)
            if magic == b'Cr24':
                # CRX3 format
                version = int.from_bytes(f.read(4), 'little')
                header_size = int.from_bytes(f.read(4), 'little')
                f.seek(header_size, 1)  # Skip header
                zip_start = f.tell()
            else:
                # Try CRX2 format
                f.seek(0)
                magic = f.read(4)
                if magic != b'Cr24':
                    # Might be a plain ZIP
                    zip_start = 0
                else:
                    f.seek(8)  # Skip version
                    pub_key_len = int.from_bytes(f.read(4), 'little')
                    sig_len = int.from_bytes(f.read(4), 'little')
                    zip_start = 16 + pub_key_len + sig_len
            
            # Extract ZIP portion
            f.seek(zip_start)
            zip_data = f.read()
            
            temp_zip = self.temp_dir / 'temp.zip'
            with open(temp_zip, 'wb') as zf:
                zf.write(zip_data)
        
        try:
            with zipfile.ZipFile(temp_zip, 'r') as zip_ref:
                zip_ref.extractall(output_dir)
        except zipfile.BadZipFile:
            # If that fails, try treating the whole file as a zip
            with zipfile.ZipFile(self.extension_path, 'r') as zip_ref:
                zip_ref.extractall(output_dir)
        
        return output_dir
    
    def _extract_xpi(self) -> Path:
        """Extract Firefox extension (.xpi)"""
        output_dir = self.temp_dir / 'firefox_extension'
        output_dir.mkdir(exist_ok=True)
        
        print("Extracting Firefox extension (.xpi)...")
        with zipfile.ZipFile(self.extension_path, 'r') as zip_ref:
            zip_ref.extractall(output_dir)
        
        return output_dir
    
    def _extract_safari(self) -> Path:
        """Extract Safari extension (.safariextz)"""
        output_dir = self.temp_dir / 'safari_extension'
        output_dir.mkdir(exist_ok=True)
        
        print("Extracting Safari extension (.safariextz)...")
        # Safari extensions are XAR archives
        try:
            import subprocess
            subprocess.run(['xar', '-xf', str(self.extension_path), '-C', str(output_dir)], 
                         check=True, capture_output=True)
        except (subprocess.CalledProcessError, FileNotFoundError):
            print("Warning: xar tool not found. Trying as ZIP...")
            try:
                with zipfile.ZipFile(self.extension_path, 'r') as zip_ref:
                    zip_ref.extractall(output_dir)
            except:
                print("Could not extract Safari extension. Manual extraction may be required.")
        
        return output_dir
    
    def _extract_generic(self) -> Path:
        """Extract generic ZIP-based extension"""
        output_dir = self.temp_dir / 'extension'
        output_dir.mkdir(exist_ok=True)
        
        print("Extracting extension archive...")
        with zipfile.ZipFile(self.extension_path, 'r') as zip_ref:
            zip_ref.extractall(output_dir)
        
        return output_dir
    
    def _load_manifest(self) -> Optional[Dict]:
        """Load and parse manifest.json"""
        manifest_path = self.source_dir / 'manifest.json'
        if manifest_path.exists():
            try:
                with open(manifest_path, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except Exception as e:
                print(f"Error loading manifest: {e}")
        return None
    
    def get_extension_info(self) -> Dict[str, Any]:
        """Extract basic extension information from manifest"""
        if not self.manifest:
            return {}
        
        return {
            'name': self.manifest.get('name', 'Unknown'),
            'version': self.manifest.get('version', 'Unknown'),
            'description': self.manifest.get('description', ''),
            'permissions': self.manifest.get('permissions', []),
            'host_permissions': self.manifest.get('host_permissions', []),
            'content_scripts': self.manifest.get('content_scripts', []),
            'background': self.manifest.get('background', {}),
            'manifest_version': self.manifest.get('manifest_version', 2)
        }
    
    def cleanup(self):
        """Remove temporary files"""
        if self.temp_dir and self.temp_dir.exists():
            shutil.rmtree(self.temp_dir)


class ExtensionCodeChunker:
    """Splits extension source code into manageable chunks"""
    
    def __init__(self, source_dir: Path, chunk_size: int = 5000):
        self.source_dir = source_dir
        self.chunk_size = chunk_size
        self.code_extensions = {'.js', '.html', '.css', '.json', '.xml', '.ts', '.jsx', '.tsx', '.vue'}
    
    def get_source_files(self) -> List[Path]:
        """Recursively find all source files"""
        source_files = []
        for ext in self.code_extensions:
            source_files.extend(self.source_dir.rglob(f'*{ext}'))
        
        # Filter out minified files and large libraries
        filtered_files = []
        for file in source_files:
            # Skip common third-party library directories
            if any(part in file.parts for part in ['node_modules', 'vendor', 'lib', 'libraries']):
                if file.stat().st_size > 100000:  # Skip large library files
                    continue
            filtered_files.append(file)
        
        return sorted(filtered_files)
    
    def chunk_files(self) -> List[Dict[str, Any]]:
        """Split files into chunks with metadata"""
        chunks = []
        source_files = self.get_source_files()
        
        print(f"Found {len(source_files)} source files to analyze")
        
        for file_path in source_files:
            try:
                with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read()
                
                # Check if file is minified (heuristic)
                is_minified = self._is_minified(content, file_path)
                
                # Split large files into chunks
                if len(content) <= self.chunk_size:
                    chunks.append({
                        'file': str(file_path.relative_to(self.source_dir)),
                        'content': content,
                        'chunk_index': 0,
                        'total_chunks': 1,
                        'is_minified': is_minified,
                        'file_type': file_path.suffix
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
                                'total_chunks': -1,
                                'is_minified': is_minified,
                                'file_type': file_path.suffix
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
                            'total_chunks': chunk_index + 1,
                            'is_minified': is_minified,
                            'file_type': file_path.suffix
                        })
                    
                    # Update total_chunks
                    file_chunks = [c for c in chunks if c['file'] == str(file_path.relative_to(self.source_dir))]
                    total = len(file_chunks)
                    for c in file_chunks:
                        c['total_chunks'] = total
                        
            except Exception as e:
                print(f"Error reading {file_path}: {e}")
        
        return chunks
    
    def _is_minified(self, content: str, file_path: Path) -> bool:
        """Heuristic to detect minified code"""
        if file_path.suffix == '.json':
            return False
        
        # Check for .min. in filename
        if '.min.' in file_path.name:
            return True
        
        # Heuristic: if average line length > 500 chars, likely minified
        lines = content.split('\n')
        if lines:
            avg_line_length = sum(len(line) for line in lines) / len(lines)
            if avg_line_length > 500:
                return True
        
        return False


class ExtensionVulnerabilityScanner:
    """Scans extension code for vulnerabilities using LLM"""
    
    def __init__(self, call_llm_func, extension_info: Dict[str, Any]):
        self.call_llm = call_llm_func
        self.extension_info = extension_info
        self.vulnerabilities = []
        self.permission_issues = []
    
    def analyze_permissions(self):
        """Analyze extension permissions for security concerns"""
        print("Analyzing extension permissions...")
        
        permissions = self.extension_info.get('permissions', [])
        host_permissions = self.extension_info.get('host_permissions', [])
        
        risky_permissions = {
            'webRequest': 'Can intercept and modify network requests',
            'webRequestBlocking': 'Can block network requests',
            'proxy': 'Can modify proxy settings',
            'cookies': 'Can read and modify cookies',
            'tabs': 'Can access tab information',
            '<all_urls>': 'Has access to all websites',
            '*://*/*': 'Has access to all websites',
            'debugger': 'Can use debugging API',
            'management': 'Can manage other extensions',
            'nativeMessaging': 'Can communicate with native applications',
            'storage': 'Can store data locally',
            'geolocation': 'Can access location data',
            'clipboardRead': 'Can read clipboard data',
            'clipboardWrite': 'Can write to clipboard'
        }
        
        all_perms = permissions + host_permissions
        
        for perm in all_perms:
            for risky_perm, description in risky_permissions.items():
                if risky_perm in str(perm):
                    self.permission_issues.append({
                        'type': 'Risky Permission',
                        'severity': 'medium',
                        'permission': perm,
                        'description': description,
                        'recommendation': 'Ensure this permission is necessary and properly justified'
                    })
    
    def scan_chunk(self, chunk: Dict[str, Any]) -> Optional[Dict]:
        """Scan a single chunk for vulnerabilities"""
        if chunk.get('is_minified'):
            print(f"Skipping minified file: {chunk['file']}")
            return None
        
        prompt = self._build_vulnerability_prompt(chunk)
        
        print(f"Scanning {chunk['file']} (chunk {chunk['chunk_index'] + 1}/{chunk['total_chunks']})...")
        
        try:
            response = self.call_llm(prompt)
            return self._parse_llm_response(response, chunk)
        except Exception as e:
            print(f"Error scanning chunk: {e}")
            return None
    
    def _build_vulnerability_prompt(self, chunk: Dict[str, Any]) -> str:
        """Build prompt for LLM vulnerability analysis"""
        file_type = chunk.get('file_type', '')
        
        context = f"""
Extension: {self.extension_info.get('name', 'Unknown')}
Version: {self.extension_info.get('version', 'Unknown')}
Manifest Version: {self.extension_info.get('manifest_version', 2)}
Permissions: {', '.join(self.extension_info.get('permissions', [])[:10])}
"""
        
        return f"""Analyze the following browser extension code for security vulnerabilities.

{context}

File: {chunk['file']} ({file_type})
Chunk: {chunk['chunk_index'] + 1}/{chunk['total_chunks']}

Source Code:
```
{chunk['content']}
```

Identify browser extension-specific security vulnerabilities including:
- XSS (Cross-Site Scripting) vulnerabilities
- Content Security Policy bypasses
- Insecure message passing (postMessage)
- Unsafe eval() or Function() usage
- DOM-based vulnerabilities
- Insecure storage of sensitive data
- API key or credential exposure
- Unsafe external resource loading
- Improper permission usage
- Data exfiltration risks
- Man-in-the-middle vulnerabilities
- Insufficient input validation
- Clickjacking vulnerabilities
- Privacy leaks (PII exposure)
- Unsafe use of chrome/browser APIs

Return findings in JSON format:
{{
    "vulnerabilities": [
        {{
            "type": "vulnerability type",
            "severity": "critical|high|medium|low",
            "description": "detailed description",
            "location": "specific code location or line reference",
            "recommendation": "how to fix",
            "cwe_id": "CWE ID if applicable (optional)"
        }}
    ]
}}

If no vulnerabilities found, return: {{"vulnerabilities": []}}
"""
    
    def _parse_llm_response(self, response: str, chunk: Dict[str, Any]) -> Optional[Dict]:
        """Parse LLM response and extract vulnerabilities"""
        try:
            # Extract JSON from response
            start = response.find('{')
            end = response.rfind('}') + 1
            if start != -1 and end > start:
                json_str = response[start:end]
                result = json.loads(json_str)
                
                # Add context to each vulnerability
                if 'vulnerabilities' in result and result['vulnerabilities']:
                    for vuln in result['vulnerabilities']:
                        vuln['file'] = chunk['file']
                        vuln['chunk'] = f"{chunk['chunk_index'] + 1}/{chunk['total_chunks']}"
                        vuln['file_type'] = chunk.get('file_type', '')
                    
                    self.vulnerabilities.extend(result['vulnerabilities'])
                
                return result
        except json.JSONDecodeError as e:
            print(f"Failed to parse JSON response: {e}")
        
        return None
    
    def get_results(self) -> Dict[str, Any]:
        """Return all found vulnerabilities and issues as JSON"""
        all_issues = self.vulnerabilities + self.permission_issues
        
        return {
            "extension_info": self.extension_info,
            "total_vulnerabilities": len(all_issues),
            "code_vulnerabilities": len(self.vulnerabilities),
            "permission_issues": len(self.permission_issues),
            "vulnerabilities": all_issues,
            "summary": self._generate_summary()
        }
    
    def _generate_summary(self) -> Dict[str, Any]:
        """Generate summary statistics"""
        severity_count = {"critical": 0, "high": 0, "medium": 0, "low": 0}
        vuln_types = {}
        
        all_issues = self.vulnerabilities + self.permission_issues
        
        for vuln in all_issues:
            severity = vuln.get('severity', 'low').lower()
            if severity in severity_count:
                severity_count[severity] += 1
            
            vuln_type = vuln.get('type', 'Unknown')
            vuln_types[vuln_type] = vuln_types.get(vuln_type, 0) + 1
        
        return {
            "by_severity": severity_count,
            "by_type": vuln_types,
            "risk_score": self._calculate_risk_score(severity_count)
        }
    
    def _calculate_risk_score(self, severity_count: Dict[str, int]) -> int:
        """Calculate overall risk score (0-100)"""
        weights = {"critical": 25, "high": 10, "medium": 5, "low": 1}
        score = sum(severity_count[sev] * weight for sev, weight in weights.items())
        return min(score, 100)


def analyze_extension(extension_path: str, call_llm_func, chunk_size: int = 5000) -> Dict[str, Any]:
    """
    Main function to extract and analyze browser extension
    
    Args:
        extension_path: Path to extension file (.crx, .xpi, .safariextz, .zip) or unpacked directory
        call_llm_func: Function that takes source code and returns vulnerability analysis
        chunk_size: Maximum characters per chunk (default: 5000)
    
    Returns:
        JSON dict containing all found vulnerabilities and security issues
    """
    extractor = None
    
    try:
        # Step 1: Extract the extension
        print(f"Starting analysis of {extension_path}...")
        extractor = ExtensionExtractor(extension_path)
        source_dir = extractor.extract()
        extension_info = extractor.get_extension_info()
        
        print(f"Extraction complete: {source_dir}")
        print(f"Extension: {extension_info.get('name', 'Unknown')} v{extension_info.get('version', 'Unknown')}")
        
        # Step 2: Initialize scanner
        scanner = ExtensionVulnerabilityScanner(call_llm_func, extension_info)
        
        # Step 3: Analyze permissions
        scanner.analyze_permissions()
        
        # Step 4: Chunk the source code
        chunker = ExtensionCodeChunker(source_dir, chunk_size)
        chunks = chunker.chunk_files()
        print(f"Created {len(chunks)} chunks for analysis")
        
        # Step 5: Scan each chunk
        for i, chunk in enumerate(chunks, 1):
            print(f"Progress: {i}/{len(chunks)}")
            scanner.scan_chunk(chunk)
        
        # Step 6: Return results
        results = scanner.get_results()
        print(f"\nAnalysis complete!")
        print(f"Total issues found: {results['total_vulnerabilities']}")
        print(f"Code vulnerabilities: {results['code_vulnerabilities']}")
        print(f"Permission issues: {results['permission_issues']}")
        print(f"Risk Score: {results['summary']['risk_score']}/100")
        print(f"Summary by severity: {results['summary']['by_severity']}")
        
        return results
        
    finally:
        # Cleanup
        if extractor and extractor.temp_dir:
            extractor.cleanup()


if __name__ == "__main__":
    # Example usage
    print("This module should be imported. Example usage:")
    print("""
from extension_parser import analyze_extension
from my_llm_module import call_llm

# Analyze a Chrome extension
results = analyze_extension('my-extension.crx', call_llm)

# Analyze an unpacked extension directory
results = analyze_extension('path/to/extension-folder', call_llm)

# Save results
with open('extension_security_report.json', 'w') as f:
    json.dump(results, f, indent=2)
    
print(f"Risk Score: {results['summary']['risk_score']}/100")
    """)
