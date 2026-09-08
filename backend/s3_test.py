import boto3
from botocore.client import Config

def upload_to_r2(file_path: str, bucket_name: str, object_name: str, access_key: str, secret_key: str, account_id: str):
    """
    Uploads a file to Cloudflare R2 storage.

    :param file_path: Local path of the file to upload
    :param bucket_name: Name of the R2 bucket
    :param object_name: Key (name) for the object in R2
    :param access_key: R2 access key ID
    :param secret_key: R2 secret access key
    :param account_id: Cloudflare account ID
    """
    # Construct the R2 endpoint
    endpoint_url = f"https://{account_id}.r2.cloudflarestorage.com"

    # Initialize the R2 client
    s3_client = boto3.client(
        "s3",
        endpoint_url=endpoint_url,
        aws_access_key_id=access_key,
        aws_secret_access_key=secret_key,
        config=Config(signature_version="s3v4"),
        region_name="auto"  # R2 doesn't require a specific AWS region
    )

    # Upload file
    try:
        s3_client.upload_file(file_path, bucket_name, object_name)
        print(f"✅ Uploaded {file_path} to {bucket_name}/{object_name}")
        
        # Generate public URL (if bucket allows public access)
        public_url = f"https://pub-{account_id}.r2.dev/{object_name}"
        print(f"🔗 Public URL: {public_url}")
        
        return True
    except Exception as e:
        print(f"❌ Upload failed: {e}")
        return False


if __name__ == "__main__":
    # Your credentials - ⚠️ NEVER commit these to version control!
    S3_ACCESS_KEY = "8b1a43219e3b17cf082fbb72c86746c4"
    S3_SECRET_ACCESS_KEY = "38b068697fc08b0313bb7897d9b1680931a4faee0249a31a39bc4e715a8cb80f"
    
    # Extract account ID from your endpoint URL
    # Your endpoint: https://cc1d2cddc5fda060532ae0bc4f06a6ba.r2.cloudflarestorage.com
    ACCOUNT_ID = "cc1d2cddc5fda060532ae0bc4f06a6ba"
    
    S3_BUCKET = "trilux"
    FILE_PATH = "s3_test.py"
    OBJECT_NAME = "s3_test.py"
    
    upload_to_r2(FILE_PATH, S3_BUCKET, OBJECT_NAME, S3_ACCESS_KEY, S3_SECRET_ACCESS_KEY, ACCOUNT_ID)