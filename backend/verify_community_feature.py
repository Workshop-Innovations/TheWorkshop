import requests
import json
import time

BASE_URL = "http://localhost:8001/api/v1"

def register_and_login():
    email = f"test_user_{int(time.time())}@example.com"
    password = "password123"
    
    # Register
    print(f"Registering {email}...")
    resp = requests.post(f"{BASE_URL}/auth/register", json={"email": email, "password": password})
    if resp.status_code != 201:
        print(f"Registration failed: {resp.text}")
        return None
    
    # Login
    print("Logging in...")
    resp = requests.post(f"{BASE_URL}/auth/login", json={"email": email, "password": password})
    if resp.status_code != 200:
        print(f"Login failed: {resp.text}")
        return None
    
    return resp.json()["access_token"]

def verify_community(token):
    headers = {"Authorization": f"Bearer {token}"}
    
    # Get Channels
    print("Fetching channels...")
    resp = requests.get(f"{BASE_URL}/community/channels", headers=headers)
    if resp.status_code != 200:
        print(f"Failed to fetch channels: {resp.text}")
        return
    
    channels = resp.json()
    print(f"Found {len(channels)} channels.")
    for c in channels:
        print(f" - {c['name']} (slug: {c['slug']})")
        
    if not channels:
        print("No channels found!")
        return

    target_channel = channels[0]
    slug = target_channel['slug']
    
    # Send Message
    print(f"Sending message to {slug}...")
    msg_content = "Hello World via Script!"
    resp = requests.post(
        f"{BASE_URL}/community/channels/{slug}/messages", 
        headers=headers, 
        json={"content": msg_content}
    )
    if resp.status_code != 200:
        print(f"Failed to send message: {resp.text}")
        return
    
    msg_data = resp.json()
    print(f"Message sent: {msg_data['id']}")
    
    # Get Messages
    print(f"Fetching messages from {slug}...")
    resp = requests.get(f"{BASE_URL}/community/channels/{slug}/messages", headers=headers)
    if resp.status_code != 200:
        print(f"Failed to fetch messages: {resp.text}")
        return
        
    messages = resp.json()
    print(f"Found {len(messages)} messages.")
    found = False
    for m in messages:
        if m['content'] == msg_content:
            found = True
            print("Verified message content persistence.")
            break
            
    if not found:
        print("Message not found in history!")
        
    print("Verification Complete!")

if __name__ == "__main__":
    try:
        token = register_and_login()
        if token:
            verify_community(token)
    except Exception as e:
        print(f"An error occurred: {e}")
