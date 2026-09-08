import json
import time
import logging
from django.utils.deprecation import MiddlewareMixin
from django.http import JsonResponse
from django.core.cache import cache
from django.conf import settings

import json
import time
import logging
from django.utils.deprecation import MiddlewareMixin
from django.http import JsonResponse
from django.core.cache import cache
from django.conf import settings

# Configure logger for request logging
logger = logging.getLogger('request_logger')

class RequestLoggingMiddleware(MiddlewareMixin):
    """
    Middleware to log all incoming HTTP requests with comprehensive details.
    Logs request method, URL, headers, body, user info, IP address, and response status.
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
        super().__init__(get_response)
    
    def process_request(self, request):
        """Log incoming request details."""
        request._logging_start_time = time.time()
        
        # Get client IP address
        client_ip = self.get_client_ip(request)
        
        # Get user information
        user_info = "Anonymous"
        if hasattr(request, 'user') and request.user.is_authenticated:
            user_info = f"User(id={request.user.id}, email={getattr(request.user, 'email', 'N/A')})"
        
        # Get request headers (filter sensitive headers)
        headers = self.get_filtered_headers(request)
        
        # Get request body (for non-GET requests)
        request_body = self.get_request_body(request)
        
        # Log request details
        log_data = {
            'event': 'request_started',
            'method': request.method,
            'url': request.get_full_path(),
            'scheme': request.scheme,
            'client_ip': client_ip,
            'user_agent': request.META.get('HTTP_USER_AGENT', ''),
            'content_type': request.META.get('CONTENT_TYPE', ''),
            'content_length': request.META.get('CONTENT_LENGTH', ''),
            'user': user_info,
            'headers': headers,
            'body': request_body,
            'timestamp': time.time()
        }
        
        logger.info(f"Request Started: {json.dumps(log_data, indent=2)}")
    
    def process_response(self, request, response):
        """Log response details."""
        if hasattr(request, '_logging_start_time'):
            processing_time = time.time() - request._logging_start_time
            
            # Get response data (truncate if too large)
            response_content = self.get_response_content(response)
            
            log_data = {
                'event': 'request_completed',
                'method': request.method,
                'url': request.get_full_path(),
                'status_code': response.status_code,
                'processing_time_ms': round(processing_time * 1000, 2),
                'response_headers': dict(response.headers),
                'response_content': response_content,
                'timestamp': time.time()
            }
            
            # Log with different levels based on status code
            if response.status_code >= 500:
                logger.error(f"Request Completed with Server Error: {json.dumps(log_data, indent=2)}")
            elif response.status_code >= 400:
                logger.warning(f"Request Completed with Client Error: {json.dumps(log_data, indent=2)}")
            else:
                logger.info(f"Request Completed Successfully: {json.dumps(log_data, indent=2)}")
        
        return response
    
    def process_exception(self, request, exception):
        """Log exceptions that occur during request processing."""
        if hasattr(request, '_logging_start_time'):
            processing_time = time.time() - request._logging_start_time
            
            log_data = {
                'event': 'request_exception',
                'method': request.method,
                'url': request.get_full_path(),
                'exception_type': type(exception).__name__,
                'exception_message': str(exception),
                'processing_time_ms': round(processing_time * 1000, 2),
                'timestamp': time.time()
            }
            
            logger.error(f"Request Exception: {json.dumps(log_data, indent=2)}")
        
        return None  # Let Django handle the exception normally
    
    def get_client_ip(self, request):
        """Extract client IP address from request."""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0].strip()
        else:
            ip = request.META.get('REMOTE_ADDR', 'Unknown')
        return ip
    
    def get_filtered_headers(self, request):
        """Get request headers while filtering out sensitive information."""
        sensitive_headers = {
            'HTTP_AUTHORIZATION', 'HTTP_COOKIE', 'HTTP_X_API_KEY', 
            'HTTP_X_AUTH_TOKEN', 'HTTP_AUTHORIZATION_TOKEN'
        }
        
        headers = {}
        for key, value in request.META.items():
            if key.startswith('HTTP_') and key not in sensitive_headers:
                # Convert HTTP_HEADER_NAME to Header-Name format
                header_name = key[5:].replace('_', '-').title()
                headers[header_name] = value
        
        return headers
    
    def get_request_body(self, request):
        """Extract request body, handling different content types."""
        if request.method in ['GET', 'HEAD', 'OPTIONS']:
            return None
        
        try:
            # Get raw body
            body = request.body
            if not body:
                return None
            
            content_type = request.META.get('CONTENT_TYPE', '').lower()
            
            # Handle JSON content
            if 'application/json' in content_type:
                try:
                    return json.loads(body.decode('utf-8'))
                except (json.JSONDecodeError, UnicodeDecodeError):
                    return body.decode('utf-8', errors='replace')[:1000]  # Truncate if too large
            
            # Handle form data
            elif 'application/x-www-form-urlencoded' in content_type:
                return dict(request.POST)
            
            # Handle multipart form data (including file uploads)
            elif 'multipart/form-data' in content_type:
                form_data = {}
                if hasattr(request, 'POST'):
                    form_data.update(dict(request.POST))
                if hasattr(request, 'FILES'):
                    file_info = {}
                    for key, file_obj in request.FILES.items():
                        file_info[key] = {
                            'name': file_obj.name,
                            'size': file_obj.size,
                            'content_type': file_obj.content_type
                        }
                    form_data['_files'] = file_info
                return form_data
            
            # Handle other content types
            else:
                body_str = body.decode('utf-8', errors='replace')
                # Truncate very large bodies
                if len(body_str) > 1000:
                    return body_str[:1000] + '... (truncated)'
                return body_str
                
        except Exception as e:
            return f"Error reading request body: {str(e)}"
    
    def get_response_content(self, response):
        """Extract response content for logging (with size limits)."""
        try:
            # Don't log binary content or very large responses
            content_type = response.get('Content-Type', '').lower()
            
            if any(binary_type in content_type for binary_type in 
                   ['image/', 'video/', 'audio/', 'application/octet-stream']):
                return f"Binary content ({content_type})"
            
            if hasattr(response, 'content'):
                content = response.content
                if len(content) > 2000:  # Limit response content size
                    return f"Large response (size: {len(content)} bytes) - truncated"
                
                try:
                    content_str = content.decode('utf-8')
                    # Try to parse as JSON for better formatting
                    if 'application/json' in content_type:
                        return json.loads(content_str)
                    return content_str
                except (UnicodeDecodeError, json.JSONDecodeError):
                    return f"Non-text content ({content_type})"
            
            return "No content"
            
        except Exception as e:
            return f"Error reading response content: {str(e)}"


class RateLimitMiddleware(MiddlewareMixin):
    RATE_LIMIT = 100  # Number of allowed requests
    TIME_PERIOD = 60  # Time period in seconds

    def process_request(self, request):
        ip = self.get_client_ip(request)
        key = f'rate-limit-{ip}'
        
        request_count = cache.get(key)
        if request_count is None:
            cache.set(key, 0, timeout=self.TIME_PERIOD)
            request_count = 0
        
        if request_count >= self.RATE_LIMIT:
            return JsonResponse({'error': 'Rate limit exceeded'}, status=429)
        
        cache.incr(key)

    def get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip