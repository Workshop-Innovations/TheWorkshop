import requests

BASE_URL = "http://127.0.0.1:8001/api/v1/flashcards"

def test_endpoints():
    print(f"Testing {BASE_URL}...")
    try:
        # Test GET /sets
        resp = requests.get(f"{BASE_URL}/sets")
        print(f"GET /sets: {resp.status_code}")
        
        # Test POST /generate
        resp = requests.post(f"{BASE_URL}/generate")
        print(f"POST /generate: {resp.status_code}")
        
    except Exception as e:
        print(f"Connection failed: {e}")

if __name__ == "__main__":
    test_endpoints()
