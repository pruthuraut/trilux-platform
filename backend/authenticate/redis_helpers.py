# Add this to tasks.py or create a new file like redis_helpers.py

# Constants for Redis keys
OTP_KEY_PREFIX = "auth:otp:"
OTP_VALIDITY_KEY_PREFIX = "auth:otp_validity:"
VERIFICATION_STATUS_KEY_PREFIX = "auth:verification_status:"
RESET_TOKEN_KEY_PREFIX = "auth:reset_token:"
TEMP_USER_KEY_PREFIX = "auth:temp_user:"

# Cache expiration times
OTP_EXPIRATION = 60 * 10  # 10 minutes
VERIFICATION_STATUS_EXPIRATION = 60 * 60  # 1 hour
TEMP_USER_EXPIRATION = 60 * 60 * 24  # 24 hours

# Helper functions for Redis operations
def store_temp_user(email, user_data, password):
    """
    Store temporary user data in Redis.
    """
    from django.contrib.auth.hashers import make_password
    from django.core.cache import cache
    import json
    
    # Create a serializable dictionary
    user_dict = {}
    for key, value in user_data.items():
        if isinstance(value, (str, int, bool, float, type(None))):
            user_dict[key] = value
    
    # Add hashed password
    user_dict['password'] = make_password(password)
    
    # Store in Redis
    temp_user_key = f"{TEMP_USER_KEY_PREFIX}{email}"
    cache.set(temp_user_key, json.dumps(user_dict), timeout=TEMP_USER_EXPIRATION)
    
    return True

def get_temp_user(email):
    """
    Get temporary user data from Redis.
    """
    from django.core.cache import cache
    import json
    
    temp_user_key = f"{TEMP_USER_KEY_PREFIX}{email}"
    temp_user_data = cache.get(temp_user_key)
    
    if temp_user_data:
        return json.loads(temp_user_data)
    return None

def create_user_from_redis(email):
    """
    Create a user in the database from Redis data.
    """
    from django.core.cache import cache
    import json
    from django.contrib.auth import get_user_model
    
    User = get_user_model()
    temp_user_key = f"{TEMP_USER_KEY_PREFIX}{email}"
    temp_user_data = cache.get(temp_user_key)
    
    if not temp_user_data:
        return None
    
    user_data = json.loads(temp_user_data)
    
    # Create user with pre-hashed password
    user = User.objects.create(
        email=email,
        password=user_data['password'],  # Already hashed
        is_user=True
    )
    
    # Clear Redis data
    cache.delete(temp_user_key)
    
    return user
