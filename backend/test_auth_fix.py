import requests
import uuid

BASE_URL = "http://localhost:8000"

def test_auth_flow():
    # 1. Register a new user
    email = f"test_{uuid.uuid4()}@example.com"
    password = "securepassword123"
    
    print(f"Registering user: {email}")
    reg_response = requests.post(f"{BASE_URL}/api/v1/auth/register", json={
        "email": email,
        "password": password
    })
    
    if reg_response.status_code != 201:
        print(f"Registration failed: {reg_response.text}")
        return
    
    print("Registration successful.")
    
    # 2. Login
    print("Logging in...")
    login_response = requests.post(f"{BASE_URL}/api/v1/auth/login", json={
        "email": email,
        "password": password
    })
    
    if login_response.status_code != 200:
        print(f"Login failed: {login_response.text}")
        return

    token = login_response.json()["access_token"]
    print("Login successful. Token received.")
    
    # 3. Access protected endpoint
    print("Accessing /api/v1/users/me...")
    headers = {"Authorization": f"Bearer {token}"}
    me_response = requests.get(f"{BASE_URL}/api/v1/users/me", headers=headers)
    
    if me_response.status_code == 200:
        user_data = me_response.json()
        print(f"Identity verified: {user_data['email']}")
        if user_data['email'] == email:
             print("SUCCESS: User identity matches.")
        else:
             print("FAILURE: User identity mismatch.")
    else:
        print(f"Failed to access protected route: {me_response.text}")

    # 4. Test invalid token
    print("Testing invalid token...")
    bad_headers = {"Authorization": "Bearer invalid_token"}
    fail_response = requests.get(f"{BASE_URL}/api/v1/users/me", headers=bad_headers)
    if fail_response.status_code == 401:
        print("SUCCESS: Invalid token rejected (401).")
    else:
        print(f"FAILURE: Invalid token not rejected properly. Status: {fail_response.status_code}")

if __name__ == "__main__":
    test_auth_flow()
