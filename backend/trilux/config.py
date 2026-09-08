import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class Config:
    REDIS_URL = os.getenv('REDIS_URL')
    # Database Secret Configuration
    DATABASE_NAME = os.getenv('DATABASE_NAME')
    DATABASE_USER=os.getenv('DATABASE_USER')
    DATABASE_PASSWORD=os.getenv('DATABASE_PASSWORD')
    DATABASE_HOST=os.getenv('DATABASE_HOST')
    DATABASE_PORT=os.getenv('DATABASE_PORT')
    JWT_SECRET=os.getenv('JWT_SECRET')

    # SMTP Configuration
    SMTP_FROM=os.getenv('SMTP_FROM')
    SMTP_PASSWORD=os.getenv('SMTP_PASSWORD')
    SMTP_HOST=os.getenv('SMTP_HOST')
    SMTP_PORT=os.getenv('SMTP_PORT')
    SENDGRID_API_KEY = os.getenv('SENDGRID_API_KEY')
    SMTP_FROM_EMAIL = os.getenv('SMTP_FROM_EMAIL')

    # S3 / R2 Configuration
    S3_ACCESS_KEY=os.getenv('S3_ACCESS_KEY')
    S3_SECRET_KEY=os.getenv('S3_SECRET_KEY')
    S3_ACCOUNT_ID=os.getenv('S3_ACCOUNT_ID')
    S3_BUCKET_NAME=os.getenv('S3_BUCKET_NAME')
    SCAN_BUCKET=os.getenv('SCAN_BUCKET')
    GITHUB_REPO_REPORT_BUCKET=os.getenv('GITHUB_REPO_REPORT_BUCKET')
    GITHUB_REPO_SCANS_BUCKET=os.getenv('GITHUB_REPO_SCANS_BUCKET')
    MOBILE_APP_SCAN_BUCKET=os.getenv('MOBILE_APP_SCAN_BUCKET', os.getenv('GITHUB_REPO_REPORT_BUCKET'))
    BROWSER_EXTENSION_SCAN_BUCKET=os.getenv('BROWSER_EXTENSION_SCAN_BUCKET', os.getenv('GITHUB_REPO_REPORT_BUCKET'))
    REPORTS_BUCKET=os.getenv('REPORTS_BUCKET', 'repo-reports')
    S3_URL = os.getenv('S3_URL')

    # LLM Configurations
    LLM_API_URL = os.getenv('LLM_API_URL')
    LLM_MODEL_NAME = os.getenv('LLM_MODEL_NAME')
    GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')

    # Recon AI layer — pluggable provider (openrouter | anthropic | bedrock | gemini)
    RECON_AI_PROVIDER = os.getenv('RECON_AI_PROVIDER', 'bedrock')
    OPENROUTER_API_KEY = os.getenv('OPENROUTER_API_KEY')
    OPENROUTER_MODEL = os.getenv('OPENROUTER_MODEL', 'stepfun/step-3.5-flash:free')
    ANTHROPIC_API_KEY = os.getenv('ANTHROPIC_API_KEY')
    # Bedrock reuses the machine's AWS chain (env/profile/SSO) + AWS_REGION.

    # Recon storage + MobSF
    RECON_BUCKET = os.getenv('RECON_BUCKET')
    MOBSF_URL = os.getenv('MOBSF_URL', 'http://localhost:8000')
    MOBSF_API_KEY = os.getenv('MOBSF_API_KEY')

    # Django Configurations
    SECRET_KEY = os.getenv('DJANGO_SECRET_KEY')
    CSRF_AND_CORS_URLS = os.getenv('CSRF_AND_CORS_URLS').split(',')
    ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS').split(',')
    DEBUG = os.getenv('DEBUG') == 'True'



