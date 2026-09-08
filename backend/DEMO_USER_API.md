# Demo User & UUID Login API Documentation

## Overview

This system provides a complete solution for creating demo users with organizations and authenticating them using lifetime-valid access tokens. The system uses a `DemoAccessAccount` table to store UUIDs that are linked to user accounts.

## Architecture

### Database Schema

#### DemoAccessAccount Table
```
- id (AutoField, Primary Key)
- uuid (CharField, Unique, Indexed) - Unique identifier for demo access
- user (OneToOneField -> User) - Associated user account
- organization (ForeignKey -> Organization) - Associated organization
- is_active (BooleanField, default=True) - Whether this access is active
- created_at (DateTimeField) - Creation timestamp
- updated_at (DateTimeField) - Last update timestamp
```

## API Endpoints

### 1. Create Demo User
**POST** `/auth/create-demo-user/`

Creates a new demo user, organization, user profile, and demo access account with a UUID.

#### Request
```bash
curl -X POST https://api.trilux.dev/auth/create-demo-user/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "organization_name": "Demo Organization",
    "organization_email": "org@example.com",
    "organization_phone": "+1-555-0100",
    "organization_address": "123 Security Street, San Francisco",
    "business_type": "Technology",
    "country": "USA",
    "city": "San Francisco",
    "postal_code": "94105",
    "user_name": "John Doe",
    "user_role": "Admin"
  }'
```

#### Request Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| email | string | Yes | Email address for the demo user |
| organization_name | string | Yes | Name of the organization |
| organization_email | string | Yes | Organization email (must be unique) |
| organization_phone | string | Yes | Phone number for organization |
| organization_address | string | Yes | Physical address |
| business_type | string | No | Type of business (default: "Technology") |
| country | string | No | Country (default: "USA") |
| city | string | No | City (default: "San Francisco") |
| postal_code | string | No | Postal code (default: "94105") |
| user_name | string | No | Full name of user (defaults to email) |
| user_role | string | No | User role in organization (default: "Admin") |

#### Response (201 Created)
```json
{
  "user_id": 6,
  "email": "demo-505ef920@trilux.dev",
  "organization_id": 5,
  "organization_name": "Demo Org 505ef920",
  "uuid": "7f9c87db-97ed-4c70-b7d8-996f93b76a79",
  "message": "Demo user created successfully",
  "next_step": "Use UUID to login: GET /auth/uuid-login/?uuid=7f9c87db-97ed-4c70-b7d8-996f93b76a79"
}
```

#### Error Responses

**400 Bad Request** - Validation error
```json
{
  "message": "Invalid Input",
  "error": {
    "email": ["User with this email already exists"],
    "organization_email": ["Organization with this email already exists"]
  }
}
```

---

### 2. UUID Login
**GET** `/auth/uuid-login/`

Authenticates a user via UUID and returns a lifetime-valid access token.

#### Request
```bash
curl -X GET "https://api.trilux.dev/auth/uuid-login/?uuid=7f9c87db-97ed-4c70-b7d8-996f93b76a79" \
  -k
```

#### Query Parameters

| Parameter | Required | Description |
|-----------|----------|-------------|
| uuid | Yes | UUID string from DemoAccessAccount |

#### Response (200 OK)
```json
{
  "user": "demo-505ef920@trilux.dev",
  "user_id": 6,
  "message": "Login Success",
  "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjozOTE1MTA4Mjg1LCJpYXQiOjE3NzA2NjAyODUsImp0aSI6ImI5Y2I2NjJjOGU5MDQ2ZWY5OTE3MTlhZGJiMGQyYzk1IiwidXNlcl9pZCI6NiwiZW1haWwiOiJkZW1vLTUwNWVmOTIwQHRyaWx1eC5kZXYifQ.gGBo5BqGE-HOtkVho3kMadbGw7Kv7qKxeJxGVk0wOfk",
  "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3MzI1MjI4NSwiaWF0IjoxNzcwNjYwMjg1LCJqdGkiOiIzZTM0MjVlNzdhNWY0NzQzODk3YjRiMTVmODcyNzI3OSIsInVzZXJfaWQiOjZ9.lSKC3PhqBCN67JwA26ai3PEwTywumLHIGm0Wuif_WrI",
  "token_type": "Bearer",
  "expires_in": "Lifetime"
}
```

#### Error Responses

**400 Bad Request** - Missing UUID
```json
{
  "message": "UUID is required",
  "error": "uuid query parameter is missing or empty"
}
```

**404 Not Found** - UUID not found or inactive
```json
{
  "message": "Invalid UUID",
  "error": "UUID not found or inactive"
}
```

---

### 3. Get Demo Access Accounts
**GET** `/auth/demo-access-accounts/`

Requires authentication. Returns all demo access accounts for the authenticated user.

#### Request
```bash
curl -X GET https://api.trilux.dev/auth/demo-access-accounts/ \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -k
```

#### Response (200 OK)
```json
{
  "count": 2,
  "results": [
    {
      "id": 1,
      "uuid": "7f9c87db-97ed-4c70-b7d8-996f93b76a79",
      "user": 6,
      "organization": 5,
      "is_active": true,
      "created_at": "2026-02-09T18:01:25.123456Z",
      "updated_at": "2026-02-09T18:01:25.123456Z"
    }
  ]
}
```

---

### 4. Create Demo Access Account
**POST** `/auth/demo-access-accounts/`

Requires authentication. Creates a new demo access account (UUID) for the authenticated user.

#### Request
```bash
curl -X POST https://api.trilux.dev/auth/demo-access-accounts/ \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -k
```

#### Response (201 Created)
```json
{
  "message": "Demo access account created successfully",
  "data": {
    "id": 2,
    "uuid": "new-uuid-generated",
    "user": 6,
    "organization": 5,
    "is_active": true,
    "created_at": "2026-02-09T18:02:00.000000Z",
    "updated_at": "2026-02-09T18:02:00.000000Z"
  }
}
```

---

## Complete Workflow

### Step 1: Create Demo User
```bash
curl -X POST https://api.trilux.dev/auth/create-demo-user/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "demo@example.com",
    "organization_name": "Test Organization",
    "organization_email": "org@example.com",
    "organization_phone": "+1-555-0100",
    "organization_address": "123 Main St"
  }'
```

Response includes `uuid`: `7f9c87db-97ed-4c70-b7d8-996f93b76a79`

### Step 2: Login with UUID
```bash
curl -X GET "https://api.trilux.dev/auth/uuid-login/?uuid=7f9c87db-97ed-4c70-b7d8-996f93b76a79" \
  -k
```

Response includes `access` token

### Step 3: Use Token to Access API
```bash
curl -X GET https://api.trilux.dev/api/project/ \
  -H "Authorization: Bearer eyJhbGci..." \
  -k
```

---

## Token Characteristics

### Access Token
- **Lifetime**: ~68 years (effectively never expires)
- **Type**: JWT
- **Algorithm**: HS256
- **Payload**:
  - `user_id`: User's ID
  - `email`: User's email
  - `exp`: Expiration timestamp (very far future)
  - `iat`: Issued at timestamp
  - `jti`: Unique token ID

### Refresh Token
- **Lifetime**: 30 days
- **Used to**: Obtain new access tokens

---

## Python Example

```python
import requests

# Step 1: Create demo user
create_response = requests.post(
    "https://api.trilux.dev/auth/create-demo-user/",
    json={
        "email": "demo@example.com",
        "organization_name": "Test Org",
        "organization_email": "test@org.com",
        "organization_phone": "5551234567",
        "organization_address": "123 Main St"
    },
    verify=False
)

demo_data = create_response.json()
uuid = demo_data['uuid']
print(f"Created demo user with UUID: {uuid}")

# Step 2: Login with UUID
login_response = requests.get(
    f"https://api.trilux.dev/auth/uuid-login/?uuid={uuid}",
    verify=False
)

token_data = login_response.json()
access_token = token_data['access']
print(f"Access Token: {access_token}")

# Step 3: Use token
headers = {
    "Authorization": f"Bearer {access_token}",
    "Content-Type": "application/json"
}

api_response = requests.get(
    "https://api.trilux.dev/api/project/",
    headers=headers,
    verify=False
)

print(api_response.json())
```

---

## JavaScript/Fetch Example

```javascript
// Step 1: Create demo user
const createResponse = await fetch('https://api.trilux.dev/auth/create-demo-user/', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'demo@example.com',
    organization_name: 'Test Org',
    organization_email: 'test@org.com',
    organization_phone: '5551234567',
    organization_address: '123 Main St'
  })
});

const demoData = await createResponse.json();
const uuid = demoData.uuid;
console.log(`Created demo user with UUID: ${uuid}`);

// Step 2: Login with UUID
const loginResponse = await fetch(`https://api.trilux.dev/auth/uuid-login/?uuid=${uuid}`);
const tokenData = await loginResponse.json();
const accessToken = tokenData.access;
console.log(`Access Token: ${accessToken}`);

// Step 3: Use token
const apiResponse = await fetch('https://api.trilux.dev/api/project/', {
  headers: { 'Authorization': `Bearer ${accessToken}` }
});

const data = await apiResponse.json();
console.log(data);
```

---

## Security Considerations

1. **UUID Generation**: UUIDs are auto-generated using `uuid.uuid4()` ensuring uniqueness and randomness
2. **HTTPS Only**: Always use HTTPS in production
3. **Token Storage**: Store access tokens securely (httpOnly cookies for web)
4. **Activation Control**: Demo access accounts can be deactivated via `is_active` flag
5. **User Association**: Each UUID is linked to a specific user and organization
6. **Database Indexing**: UUID field is indexed for fast lookups

---

## Testing

### Create Demo User
```bash
UUID=$(uuidgen)
curl -X POST https://api.trilux.dev/auth/create-demo-user/ \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"demo-${UUID:0:8}@trilux.dev\", \"organization_name\": \"Demo Org ${UUID:0:8}\", \"organization_email\": \"org-${UUID:0:8}@trilux.dev\", \"organization_phone\": \"+1-555-0100\", \"organization_address\": \"123 Security Street\"}"
```

### Login with UUID
```bash
curl -X GET "https://api.trilux.dev/auth/uuid-login/?uuid=7f9c87db-97ed-4c70-b7d8-996f93b76a79" -k
```

### Test with Invalid UUID
```bash
curl -X GET "https://api.trilux.dev/auth/uuid-login/?uuid=invalid-uuid" -k
```

---

## Models

### DemoAccessAccount
```python
class DemoAccessAccount(models.Model):
    id              = models.AutoField(primary_key=True)
    uuid            = models.CharField(max_length=255, unique=True, db_index=True)
    user            = models.OneToOneField(User, on_delete=models.CASCADE, null=True, blank=True)
    organization    = models.ForeignKey(Organization, on_delete=models.CASCADE, null=True, blank=True)
    is_active       = models.BooleanField(default=True)
    created_at      = models.DateTimeField(auto_now_add=True)
    updated_at      = models.DateTimeField(auto_now=True)
```

---

## Version History

- **v1.0** (Feb 9, 2026): Initial release
  - Create demo users with organizations
  - UUID-based login with lifetime access tokens
  - Demo access account management
  - Database-backed UUID validation
