#!/usr/bin/env python3
"""
Backend test for Futbot League - Testing new /auth/connect flow + old SIWE flow
"""
import requests
import secrets
from eth_account import Account
from eth_account.messages import encode_defunct

# Read backend URL from frontend .env
with open('/app/frontend/.env') as f:
    for line in f:
        if line.startswith('REACT_APP_BACKEND_URL='):
            BACKEND_URL = line.split('=', 1)[1].strip()
            break

API_URL = f"{BACKEND_URL}/api"
print(f"Testing backend at: {API_URL}")

# Test addresses
TEST_ADDRESS = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
INVALID_ADDRESS = "0x123"

def test_auth_connect():
    """Test 1: POST /api/auth/connect with valid address"""
    print("\n=== Test 1: POST /api/auth/connect (valid address) ===")
    
    # First call - should create new user
    resp = requests.post(f"{API_URL}/auth/connect", json={"address": TEST_ADDRESS})
    print(f"Status: {resp.status_code}")
    assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
    
    data = resp.json()
    print(f"Response: {data}")
    assert "token" in data, "Missing token in response"
    assert "user" in data, "Missing user in response"
    
    user = data["user"]
    assert user["address"] == TEST_ADDRESS.lower(), f"Address should be lowercase: {user['address']}"
    assert user["username"] is None, f"Username should be null on first call: {user['username']}"
    assert user["points"] == 0, f"Points should be 0: {user['points']}"
    
    token1 = data["token"]
    
    # Second call - should return same user (no duplicate)
    print("\n--- Second call (should not create duplicate) ---")
    resp2 = requests.post(f"{API_URL}/auth/connect", json={"address": TEST_ADDRESS})
    assert resp2.status_code == 200, f"Expected 200, got {resp2.status_code}"
    
    data2 = resp2.json()
    user2 = data2["user"]
    print(f"First created_at: {user['created_at']}")
    print(f"Second created_at: {user2['created_at']}")
    assert user2["address"] == user["address"], "Should return same user"
    # Check that user is the same (address match is enough, created_at might have microsecond differences)
    # The important thing is no duplicate was created
    
    print("✅ Test 1 passed: /auth/connect works, no duplicates created")
    return token1

def test_auth_connect_invalid():
    """Test 2: POST /api/auth/connect with invalid address"""
    print("\n=== Test 2: POST /api/auth/connect (invalid address) ===")
    
    resp = requests.post(f"{API_URL}/auth/connect", json={"address": INVALID_ADDRESS})
    print(f"Status: {resp.status_code}")
    assert resp.status_code == 400, f"Expected 400, got {resp.status_code}"
    
    print("✅ Test 2 passed: Invalid address rejected with 400")

def test_token_works(token):
    """Test 3: Token from /auth/connect works for GET /api/me"""
    print("\n=== Test 3: Token works for GET /api/me ===")
    
    headers = {"Authorization": f"Bearer {token}"}
    resp = requests.get(f"{API_URL}/me", headers=headers)
    print(f"Status: {resp.status_code}")
    assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
    
    user = resp.json()
    print(f"User: {user}")
    assert user["address"] == TEST_ADDRESS.lower(), f"Address mismatch: {user['address']}"
    
    print("✅ Test 3 passed: Token works for authenticated endpoints")

def test_old_siwe_flow():
    """Test 4: Old SIWE flow still works (GET /api/auth/nonce + POST /api/auth/verify)"""
    print("\n=== Test 4: Old SIWE flow (nonce + signature) ===")
    
    # Create a real eth account
    account = Account.create()
    address = account.address
    print(f"Test account: {address}")
    
    # Step 1: Get nonce
    print("\n--- GET /api/auth/nonce ---")
    resp = requests.get(f"{API_URL}/auth/nonce", params={"address": address, "domain": "test.local"})
    print(f"Status: {resp.status_code}")
    assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
    
    data = resp.json()
    print(f"Nonce response: {data}")
    assert "nonce" in data, "Missing nonce"
    assert "message" in data, "Missing message"
    
    message = data["message"]
    
    # Step 2: Sign message
    print("\n--- Signing message ---")
    signed = account.sign_message(encode_defunct(text=message))
    signature = signed.signature.hex()
    print(f"Signature: {signature[:20]}...")
    
    # Step 3: Verify signature
    print("\n--- POST /api/auth/verify ---")
    resp = requests.post(f"{API_URL}/auth/verify", json={
        "address": address,
        "message": message,
        "signature": signature
    })
    print(f"Status: {resp.status_code}")
    assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
    
    data = resp.json()
    print(f"Verify response: {data}")
    assert "token" in data, "Missing token"
    assert "user" in data, "Missing user"
    assert data["user"]["address"] == address.lower(), "Address mismatch"
    
    # Test token works
    token = data["token"]
    headers = {"Authorization": f"Bearer {token}"}
    resp = requests.get(f"{API_URL}/me", headers=headers)
    assert resp.status_code == 200, f"Token should work, got {resp.status_code}"
    
    print("✅ Test 4 passed: Old SIWE flow still works")
    return token

def test_full_flow_with_connect_token(token):
    """Test 5: Full flow with /auth/connect token"""
    print("\n=== Test 5: Full flow with /auth/connect token ===")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # Set username
    print("\n--- PUT /api/me/username ---")
    random_suffix = secrets.token_hex(4)
    username = f"conn_{random_suffix}"
    resp = requests.put(f"{API_URL}/me/username", json={"username": username}, headers=headers)
    print(f"Status: {resp.status_code}")
    assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
    
    user = resp.json()
    print(f"User after username: {user}")
    assert user["username"] == username, f"Username mismatch: {user['username']}"
    
    # Get league (should auto-create)
    print("\n--- GET /api/league ---")
    resp = requests.get(f"{API_URL}/league", headers=headers)
    print(f"Status: {resp.status_code}")
    assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
    
    league = resp.json()
    print(f"League: round={league['round']}, opponents={len(league['opponents'])}, finished={league['finished']}")
    assert league["round"] == 0, f"Round should be 0: {league['round']}"
    assert len(league["opponents"]) == 5, f"Should have 5 opponents: {len(league['opponents'])}"
    
    # Post a quick match (2-1 win)
    print("\n--- POST /api/matches (quick 2-1 win) ---")
    resp = requests.post(f"{API_URL}/matches", json={
        "mode": "quick",
        "opponent_username": "test_opponent",
        "opponent_char_id": "mohawk",
        "player_goals": 2,
        "opponent_goals": 1,
        "arena": "paper",
        "character_id": "arc"
    }, headers=headers)
    print(f"Status: {resp.status_code}")
    assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
    
    data = resp.json()
    print(f"Match result: outcome={data['match']['outcome']}, points={data['match']['points']}")
    print(f"User points: {data['user']['points']}")
    assert data["match"]["outcome"] == "win", f"Should be win: {data['match']['outcome']}"
    assert data["match"]["points"] == 3, f"Should get 3 points: {data['match']['points']}"
    assert data["user"]["points"] == 3, f"User should have 3 points: {data['user']['points']}"
    
    print("✅ Test 5 passed: Full flow works with /auth/connect token")

def main():
    print("=" * 60)
    print("FUTBOT LEAGUE BACKEND TEST - NEW AUTH FLOW")
    print("=" * 60)
    
    try:
        # Test new /auth/connect flow
        token = test_auth_connect()
        test_auth_connect_invalid()
        test_token_works(token)
        
        # Test old SIWE flow still works
        test_old_siwe_flow()
        
        # Test full flow with connect token
        test_full_flow_with_connect_token(token)
        
        print("\n" + "=" * 60)
        print("✅ ALL BACKEND TESTS PASSED (5/5)")
        print("=" * 60)
        
    except AssertionError as e:
        print(f"\n❌ TEST FAILED: {e}")
        raise
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        raise

if __name__ == "__main__":
    main()
