import requests
import sys

BASE_URL = "http://localhost:8001/api/v1"

def verify():
    # 1. Register/Login
    email = "test_community@example.com"
    password = "password123"
    
    # Try login first
    print("Logging in...")
    resp = requests.post(f"{BASE_URL}/auth/login", json={"email": email, "password": password})
    if resp.status_code == 401:
        # Register if not exists
        print("Registering...")
        resp = requests.post(f"{BASE_URL}/auth/register", json={"email": email, "password": password})
        if resp.status_code != 201 and resp.status_code != 409:
            print(f"Registration failed: {resp.text}")
            return
        # Login again
        resp = requests.post(f"{BASE_URL}/auth/login", json={"email": email, "password": password})
    
    if resp.status_code != 200:
        print(f"Login failed: {resp.text}")
        return

    token = resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("Logged in successfully.")

    # 2. Get Channels
    print("Fetching channels...")
    resp = requests.get(f"{BASE_URL}/community/channels", headers=headers)
    if resp.status_code != 200:
        print(f"Failed to get channels: {resp.text}")
        return
    
    channels = resp.json()
    if not channels:
        print("No channels found.")
        return
    
    channel_id = channels[0]["id"]
    print(f"Using channel: {channels[0]['name']} ({channel_id})")

    # 3. Post Message
    print("Posting message...")
    resp = requests.post(f"{BASE_URL}/community/channels/{channel_id}/messages", 
                         headers=headers, 
                         json={"content": "Hello World"})
    if resp.status_code != 200:
        print(f"Failed to post message: {resp.text}")
        return
    
    msg = resp.json()
    msg_id = msg["id"]
    print(f"Message posted: {msg_id}")
    
    # 4. Vote Message
    print("Voting on message...")
    resp = requests.post(f"{BASE_URL}/community/channels/{channel_id}/messages/{msg_id}/vote?vote_value=1", 
                         headers=headers)
    if resp.status_code != 200:
        print(f"Failed to vote: {resp.text}")
        return
    
    vote_resp = resp.json()
    print(f"Vote response score: {vote_resp.get('score')}, user_vote: {vote_resp.get('user_vote')}")
    
    if vote_resp.get('score') == 1 and vote_resp.get('user_vote') == 1:
        print("VERIFICATION SUCCESS: Voting works!")
    else:
        print("VERIFICATION FAILED: Score or user_vote incorrect.")

if __name__ == "__main__":
    verify()
