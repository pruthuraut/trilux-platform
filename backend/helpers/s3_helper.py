import boto3
import os
from botocore.client import Config
from botocore.exceptions import ClientError, NoCredentialsError
from typing import List, Optional, Dict, Any
from io import BytesIO

from trilux.config import Config as config


class S3Helper:
    """
    A helper class for Cloudflare R2 (S3-compatible) storage operations.
    Handles file upload, download, deletion, and listing operations.
    """
    
    def __init__(self, bucket_name:str, region: str = "auto"):
        """
        Initialize the S3Helper with Cloudflare R2 credentials.
        
        :param access_key: R2 access key ID
        :param secret_key: R2 secret access key  
        :param account_id: Cloudflare account ID
        :param bucket_name: Default bucket name
        :param region: AWS region (default: "auto" for R2)
        """
        self.access_key = config.S3_ACCESS_KEY
        self.secret_key = config.S3_SECRET_KEY
        self.account_id = config.S3_ACCOUNT_ID
        self.bucket_name = bucket_name
        self.region = region
        self.endpoint_url = f"https://{self.account_id}.r2.cloudflarestorage.com"
        
        # Initialize the S3 client
        self._client = None
        self._initialize_client()
    
    def _initialize_client(self):
        """Initialize the S3 client with R2 configuration."""
        try:
            self._client = boto3.client(
                "s3",
                endpoint_url=self.endpoint_url,
                aws_access_key_id=self.access_key,
                aws_secret_access_key=self.secret_key,
                config=Config(signature_version="s3v4"),
                region_name=self.region
            )
        except Exception as e:
            raise Exception(f"Failed to initialize S3 client: {str(e)}")
    
    @property
    def client(self):
        """Get the S3 client instance."""
        if self._client is None:
            self._initialize_client()
        return self._client
    
    def upload_file(self, file_path: str, object_name: Optional[str] = None, bucket_name: Optional[str] = None, 
                   extra_args: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Upload a file to R2 storage.
        
        :param file_path: Local path of the file to upload
        :param object_name: Key (name) for the object in R2. If None, uses the filename
        :param bucket_name: Bucket name. If None, uses the default bucket
        :param extra_args: Extra arguments for upload (e.g., metadata, content type)
        :return: Dictionary with success status, message, and public URL
        """
        if bucket_name is None:
            bucket_name = self.bucket_name
            
        if object_name is None:
            object_name = os.path.basename(file_path)
        
        if not os.path.exists(file_path):
            return {
                'success': False,
                'message': f"File not found: {file_path}",
                'public_url': None
            }
        
        try:
            # Upload the file
            self.client.upload_file(
                file_path, 
                bucket_name, 
                object_name,
                ExtraArgs=extra_args or {}
            )
            
            # Generate public URL
            public_url = f"https://pub-{self.account_id}.r2.dev/{object_name}"
            
            return {
                'success': True,
                'message': f"Successfully uploaded {file_path} to {bucket_name}/{object_name}",
                'public_url': public_url,
                'object_name': object_name,
                'bucket_name': bucket_name
            }
            
        except ClientError as e:
            return {
                'success': False,
                'message': f"Client error during upload: {str(e)}",
                'public_url': None
            }
        except Exception as e:
            return {
                'success': False,
                'message': f"Upload failed: {str(e)}",
                'public_url': None
            }
    
    def upload_file_obj(self, file_obj: BytesIO, object_name: str, bucket_name: Optional[str] = None,
                       extra_args: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Upload a file object to R2 storage.
        
        :param file_obj: File-like object to upload
        :param object_name: Key (name) for the object in R2
        :param bucket_name: Bucket name. If None, uses the default bucket
        :param extra_args: Extra arguments for upload
        :return: Dictionary with success status, message, and public URL
        """
        if bucket_name is None:
            bucket_name = self.bucket_name
        
        try:
            self.client.upload_fileobj(
                file_obj,
                bucket_name,
                object_name,
                ExtraArgs=extra_args or {}
            )
            
            public_url = f"https://pub-{self.account_id}.r2.dev/{object_name}"
            
            return {
                'success': True,
                'message': f"Successfully uploaded file object to {bucket_name}/{object_name}",
                'public_url': public_url,
                'object_name': object_name,
                'bucket_name': bucket_name
            }
            
        except Exception as e:
            return {
                'success': False,
                'message': f"Upload failed: {str(e)}",
                'public_url': None
            }
    
    def download_file(self, object_name: str, file_path: str, bucket_name: Optional[str] = None) -> Dict[str, Any]:
        """
        Download a file from R2 storage.
        
        :param object_name: Key (name) of the object in R2
        :param file_path: Local path where the file will be saved
        :param bucket_name: Bucket name. If None, uses the default bucket
        :return: Dictionary with success status and message
        """
        if bucket_name is None:
            bucket_name = self.bucket_name
        
        try:
            # Create directory if it doesn't exist
            os.makedirs(os.path.dirname(file_path), exist_ok=True)
            
            self.client.download_file(bucket_name, object_name, file_path)
            
            return {
                'success': True,
                'message': f"Successfully downloaded {bucket_name}/{object_name} to {file_path}",
                'file_path': file_path
            }
            
        except ClientError as e:
            error_code = e.response['Error']['Code']
            if error_code == 'NoSuchKey':
                return {
                    'success': False,
                    'message': f"File not found: {object_name}",
                    'file_path': None
                }
            else:
                return {
                    'success': False,
                    'message': f"Download failed: {str(e)}",
                    'file_path': None
                }
        except Exception as e:
            return {
                'success': False,
                'message': f"Download failed: {str(e)}",
                'file_path': None
            }
    
    def download_file_obj(self, object_name: str, bucket_name: Optional[str] = None) -> Dict[str, Any]:
        """
        Download a file from R2 storage as a file object.
        
        :param object_name: Key (name) of the object in R2
        :param bucket_name: Bucket name. If None, uses the default bucket
        :return: Dictionary with success status, message, and file object
        """
        if bucket_name is None:
            bucket_name = self.bucket_name
        
        try:
            file_obj = BytesIO()
            self.client.download_fileobj(bucket_name, object_name, file_obj)
            file_obj.seek(0)  # Reset pointer to beginning
            
            return {
                'success': True,
                'message': f"Successfully downloaded {bucket_name}/{object_name}",
                'file_obj': file_obj
            }
            
        except ClientError as e:
            error_code = e.response['Error']['Code']
            if error_code == 'NoSuchKey':
                return {
                    'success': False,
                    'message': f"File not found: {object_name}",
                    'file_obj': None
                }
            else:
                return {
                    'success': False,
                    'message': f"Download failed: {str(e)}",
                    'file_obj': None
                }
        except Exception as e:
            return {
                'success': False,
                'message': f"Download failed: {str(e)}",
                'file_obj': None
            }
    
    def delete_file(self, object_name: str, bucket_name: Optional[str] = None) -> Dict[str, Any]:
        """
        Delete a single file from R2 storage.
        
        :param object_name: Key (name) of the object to delete
        :param bucket_name: Bucket name. If None, uses the default bucket
        :return: Dictionary with success status and message
        """
        if bucket_name is None:
            bucket_name = self.bucket_name
        
        try:
            self.client.delete_object(Bucket=bucket_name, Key=object_name)
            
            return {
                'success': True,
                'message': f"Successfully deleted {bucket_name}/{object_name}"
            }
            
        except Exception as e:
            return {
                'success': False,
                'message': f"Delete failed: {str(e)}"
            }
    
    def delete_folder(self, folder_prefix: str, bucket_name: Optional[str] = None) -> Dict[str, Any]:
        """
        Delete all files in a folder (prefix) from R2 storage.
        
        :param folder_prefix: Folder path/prefix (e.g., "folder/subfolder/")
        :param bucket_name: Bucket name. If None, uses the default bucket
        :return: Dictionary with success status, message, and deletion count
        """
        if bucket_name is None:
            bucket_name = self.bucket_name
        
        # Ensure folder_prefix ends with '/' if it's meant to be a folder
        if folder_prefix and not folder_prefix.endswith('/'):
            folder_prefix += '/'
        
        try:
            # List all objects with the given prefix
            response = self.client.list_objects_v2(Bucket=bucket_name, Prefix=folder_prefix)
            
            if 'Contents' not in response:
                return {
                    'success': True,
                    'message': f"No files found in folder: {folder_prefix}",
                    'deleted_count': 0
                }
            
            # Prepare objects for batch deletion
            objects_to_delete = [{'Key': obj['Key']} for obj in response['Contents']]
            
            if not objects_to_delete:
                return {
                    'success': True,
                    'message': f"No files found in folder: {folder_prefix}",
                    'deleted_count': 0
                }
            
            # Delete objects in batches (max 1000 at a time)
            deleted_count = 0
            batch_size = 1000
            errors = []
            
            for i in range(0, len(objects_to_delete), batch_size):
                batch = objects_to_delete[i:i + batch_size]
                
                delete_response = self.client.delete_objects(
                    Bucket=bucket_name,
                    Delete={'Objects': batch}
                )
                
                if 'Deleted' in delete_response:
                    deleted_count += len(delete_response['Deleted'])
                
                if 'Errors' in delete_response:
                    errors.extend(delete_response['Errors'])
            
            if errors:
                return {
                    'success': False,
                    'message': f"Partially deleted {deleted_count} files. {len(errors)} errors occurred.",
                    'deleted_count': deleted_count,
                    'errors': errors
                }
            
            return {
                'success': True,
                'message': f"Successfully deleted {deleted_count} files from folder: {folder_prefix}",
                'deleted_count': deleted_count
            }
            
        except Exception as e:
            return {
                'success': False,
                'message': f"Folder deletion failed: {str(e)}",
                'deleted_count': 0
            }
    
    def list_files(self, prefix: str = "", bucket_name: Optional[str] = None, max_keys: int = 1000) -> Dict[str, Any]:
        """
        List files in a bucket or folder.
        
        :param prefix: Folder prefix to filter files (optional)
        :param bucket_name: Bucket name. If None, uses the default bucket
        :param max_keys: Maximum number of keys to return
        :return: Dictionary with success status, message, and list of files
        """
        if bucket_name is None:
            bucket_name = self.bucket_name
        
        try:
            files = []
            continuation_token = None
            total_files = 0
            
            while len(files) < max_keys:
                list_kwargs = {
                    'Bucket': bucket_name,
                    'Prefix': prefix,
                    'MaxKeys': min(1000, max_keys - len(files))
                }
                
                if continuation_token:
                    list_kwargs['ContinuationToken'] = continuation_token
                
                response = self.client.list_objects_v2(**list_kwargs)
                
                if 'Contents' in response:
                    for obj in response['Contents']:
                        files.append({
                            'key': obj['Key'],
                            'size': obj['Size'],
                            'last_modified': obj['LastModified'],
                            'etag': obj['ETag']
                        })
                        total_files += 1
                
                if not response.get('IsTruncated') or len(files) >= max_keys:
                    break
                    
                continuation_token = response.get('NextContinuationToken')
            
            return {
                'success': True,
                'message': f"Found {len(files)} files in {bucket_name}/{prefix}",
                'files': files,
                'total_files': total_files,
                'truncated': len(files) >= max_keys
            }
            
        except Exception as e:
            return {
                'success': False,
                'message': f"List files failed: {str(e)}",
                'files': []
            }
    
    def file_exists(self, object_name: str, bucket_name: Optional[str] = None) -> bool:
        """
        Check if a file exists in R2 storage.
        
        :param object_name: Key (name) of the object to check
        :param bucket_name: Bucket name. If None, uses the default bucket
        :return: True if file exists, False otherwise
        """
        if bucket_name is None:
            bucket_name = self.bucket_name
        
        try:
            self.client.head_object(Bucket=bucket_name, Key=object_name)
            return True
        except ClientError as e:
            error_code = e.response['Error']['Code']
            if error_code == '404':
                return False
            raise e
    
    def get_file_info(self, object_name: str, bucket_name: Optional[str] = None) -> Dict[str, Any]:
        """
        Get information about a file in R2 storage.
        
        :param object_name: Key (name) of the object
        :param bucket_name: Bucket name. If None, uses the default bucket
        :return: Dictionary with file information
        """
        if bucket_name is None:
            bucket_name = self.bucket_name
        
        try:
            response = self.client.head_object(Bucket=bucket_name, Key=object_name)
            
            return {
                'success': True,
                'file_info': {
                    'key': object_name,
                    'size': response.get('ContentLength'),
                    'last_modified': response.get('LastModified'),
                    'content_type': response.get('ContentType'),
                    'etag': response.get('ETag'),
                    'metadata': response.get('Metadata', {})
                }
            }
            
        except ClientError as e:
            error_code = e.response['Error']['Code']
            if error_code == '404':
                return {
                    'success': False,
                    'message': f"File not found: {object_name}",
                    'file_info': None
                }
            else:
                return {
                    'success': False,
                    'message': f"Failed to get file info: {str(e)}",
                    'file_info': None
                }
        except Exception as e:
            return {
                'success': False,
                'message': f"Failed to get file info: {str(e)}",
                'file_info': None
            }
    
    def generate_presigned_url(self, object_name: str, bucket_name: Optional[str] = None, 
                              expiration: int = 3600, http_method: str = 'GET') -> Dict[str, Any]:
        """
        Generate a presigned URL for temporary access to a file.
        
        :param object_name: Key (name) of the object
        :param bucket_name: Bucket name. If None, uses the default bucket
        :param expiration: Time in seconds for the presigned URL to remain valid
        :param http_method: HTTP method ('GET', 'POST', 'PUT', 'DELETE')
        :return: Dictionary with presigned URL
        """
        if bucket_name is None:
            bucket_name = self.bucket_name
        
        try:
            method_mapping = {
                'GET': 'get_object',
                'POST': 'post_object',
                'PUT': 'put_object',
                'DELETE': 'delete_object'
            }
            
            client_method = method_mapping.get(http_method.upper(), 'get_object')
            
            presigned_url = self.client.generate_presigned_url(
                client_method,
                Params={'Bucket': bucket_name, 'Key': object_name},
                ExpiresIn=expiration
            )
            
            return {
                'success': True,
                'presigned_url': presigned_url,
                'expires_in': expiration
            }
            
        except Exception as e:
            return {
                'success': False,
                'message': f"Failed to generate presigned URL: {str(e)}",
                'presigned_url': None
            }
