#!/usr/bin/env python3
"""
Comprehensive backend API test for Futbot League
Tests all endpoints with SIWE-style authentication flow
"""
import requests
import json
from eth_account import Account
from eth_account.messages import encode_defunct

# Backend URL from frontend/.env
BASE_URL = "https://head-ball-battle.preview.emergentagent.com/api"
DOMAIN = "test.local"

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    END = '\033[0m'

def log_success(msg):
    print(f"{Colors.GREEN}✓ {msg}{Colors.END}")

def log_error(msg):
    print(f"{Colors.RED}✗ {msg}{Colors.END}")

def log_info(msg):
    print(f"{Colors.BLUE}ℹ {msg}{Colors.END}")

def log_warning(msg):
    print(f"{Colors.YELLOW}⚠ {msg}{Colors.END}")

class TestResults:
    def __init__(self):
        self.passed = []
        self.failed = []
        self.warnings = []
    
    def add_pass(self, test_name):
        self.passed.append(test_name)
        log_success(test_name)
    
    def add_fail(self, test_name, details):
        self.failed.append((test_name, details))
        log_error(f"{test_name}: {details}")
    
    def add_warning(self, test_name, details):
        self.warnings.append((test_name, details))
        log_warning(f"{test_name}: {details}")
    
    def summary(self):
        print("\n" + "="*80)
        print(f"TEST SUMMARY: {len(self.passed)} passed, {len(self.failed)} failed, {len(self.warnings)} warnings")
        print("="*80)
        if self.failed:
            print(f"\n{Colors.RED}FAILED TESTS:{Colors.END}")
            for name, details in self.failed:
                print(f"  ✗ {name}")
                print(f"    {details}")
        if self.warnings:
            print(f"\n{Colors.YELLOW}WARNINGS:{Colors.END}")
            for name, details in self.warnings:
                print(f"  ⚠ {name}")
                print(f"    {details}")
        if self.passed:
            print(f"\n{Colors.GREEN}PASSED TESTS:{Colors.END}")
            for name in self.passed:
                print(f"  ✓ {name}")

results = TestResults()

def test_auth_flow():
    """Test complete SIWE-style authentication flow"""
    print("\n" + "="*80)
    print("TESTING AUTH FLOW (SIWE-style)")
    print("="*80)
    
    # Step 1: Create account
    log_info("Step 1: Creating test account with eth_account")
    acct = Account.create()
    address = acct.address
    log_info(f"Created account: {address}")
    
    # Step 2: GET nonce
    log_info(f"Step 2: GET /api/auth/nonce?address={address}&domain={DOMAIN}")
    try:
        resp = requests.get(f"{BASE_URL}/auth/nonce", params={"address": address, "domain": DOMAIN})
        if resp.status_code != 200:
            results.add_fail("GET /api/auth/nonce", f"Status {resp.status_code}: {resp.text}")
            return None, None
        
        data = resp.json()
        if 'nonce' not in data or 'message' not in data:
            results.add_fail("GET /api/auth/nonce", f"Missing nonce or message in response: {data}")
            return None, None
        
        nonce = data['nonce']
        message = data['message']
        results.add_pass("GET /api/auth/nonce - returns nonce and message")
        log_info(f"Nonce: {nonce}")
        log_info(f"Message preview: {message[:100]}...")
    except Exception as e:
        results.add_fail("GET /api/auth/nonce", f"Exception: {str(e)}")
        return None, None
    
    # Step 3: Sign message
    log_info("Step 3: Signing message with eth_account")
    try:
        sig = acct.sign_message(encode_defunct(text=message))
        signature = sig.signature.hex()
        if not signature.startswith('0x'):
            signature = '0x' + signature
        log_info(f"Signature: {signature[:20]}...")
    except Exception as e:
        results.add_fail("Sign message", f"Exception: {str(e)}")
        return None, None
    
    # Step 4: POST verify
    log_info("Step 4: POST /api/auth/verify")
    try:
        resp = requests.post(f"{BASE_URL}/auth/verify", json={
            "address": address,
            "message": message,
            "signature": signature
        })
        if resp.status_code != 200:
            results.add_fail("POST /api/auth/verify", f"Status {resp.status_code}: {resp.text}")
            return None, None
        
        data = resp.json()
        if 'token' not in data or 'user' not in data:
            results.add_fail("POST /api/auth/verify", f"Missing token or user: {data}")
            return None, None
        
        token = data['token']
        user = data['user']
        
        # Verify user structure
        if user.get('username') is not None:
            results.add_fail("POST /api/auth/verify", f"New user should have username=null, got: {user.get('username')}")
        elif user.get('points') != 0:
            results.add_fail("POST /api/auth/verify", f"New user should have points=0, got: {user.get('points')}")
        else:
            results.add_pass("POST /api/auth/verify - returns token and user with username=null, points=0")
        
        log_info(f"Token: {token[:20]}...")
        log_info(f"User: {user}")
    except Exception as e:
        results.add_fail("POST /api/auth/verify", f"Exception: {str(e)}")
        return None, None
    
    # Step 5: Test nonce replay protection
    log_info("Step 5: Testing nonce replay protection (should fail)")
    try:
        resp = requests.post(f"{BASE_URL}/auth/verify", json={
            "address": address,
            "message": message,
            "signature": signature
        })
        if resp.status_code == 401:
            results.add_pass("Nonce replay protection - correctly rejects reused nonce")
        else:
            results.add_fail("Nonce replay protection", f"Expected 401, got {resp.status_code}: {resp.text}")
    except Exception as e:
        results.add_fail("Nonce replay protection", f"Exception: {str(e)}")
    
    # Step 6: Test wrong signature
    log_info("Step 6: Testing wrong signature (should fail)")
    try:
        # Get new nonce
        resp = requests.get(f"{BASE_URL}/auth/nonce", params={"address": address, "domain": DOMAIN})
        new_message = resp.json()['message']
        
        # Use wrong signature
        wrong_sig = "0x" + "00" * 65
        resp = requests.post(f"{BASE_URL}/auth/verify", json={
            "address": address,
            "message": new_message,
            "signature": wrong_sig
        })
        if resp.status_code == 401:
            results.add_pass("Wrong signature - correctly rejects invalid signature")
        else:
            results.add_fail("Wrong signature", f"Expected 401, got {resp.status_code}: {resp.text}")
    except Exception as e:
        results.add_fail("Wrong signature", f"Exception: {str(e)}")
    
    # Step 7: Test mismatched address
    log_info("Step 7: Testing mismatched address (should fail)")
    try:
        # Create another account
        acct2 = Account.create()
        
        # Get nonce for acct2
        resp = requests.get(f"{BASE_URL}/auth/nonce", params={"address": acct2.address, "domain": DOMAIN})
        msg2 = resp.json()['message']
        
        # Sign with acct but submit as acct2
        sig2 = acct.sign_message(encode_defunct(text=msg2))
        signature2 = sig2.signature.hex()
        if not signature2.startswith('0x'):
            signature2 = '0x' + signature2
        
        resp = requests.post(f"{BASE_URL}/auth/verify", json={
            "address": acct2.address,
            "message": msg2,
            "signature": signature2
        })
        if resp.status_code == 401:
            results.add_pass("Mismatched address - correctly rejects signer mismatch")
        else:
            results.add_fail("Mismatched address", f"Expected 401, got {resp.status_code}: {resp.text}")
    except Exception as e:
        results.add_fail("Mismatched address", f"Exception: {str(e)}")
    
    return token, address

def test_me_endpoint(token):
    """Test GET /api/me"""
    print("\n" + "="*80)
    print("TESTING /api/me ENDPOINT")
    print("="*80)
    
    # Test with token
    log_info("GET /api/me with Bearer token")
    try:
        resp = requests.get(f"{BASE_URL}/me", headers={"Authorization": f"Bearer {token}"})
        if resp.status_code != 200:
            results.add_fail("GET /api/me with token", f"Status {resp.status_code}: {resp.text}")
        else:
            user = resp.json()
            results.add_pass("GET /api/me with token - returns user")
            log_info(f"User: {user}")
    except Exception as e:
        results.add_fail("GET /api/me with token", f"Exception: {str(e)}")
    
    # Test without token
    log_info("GET /api/me without token (should fail)")
    try:
        resp = requests.get(f"{BASE_URL}/me")
        if resp.status_code == 401:
            results.add_pass("GET /api/me without token - correctly returns 401")
        else:
            results.add_fail("GET /api/me without token", f"Expected 401, got {resp.status_code}: {resp.text}")
    except Exception as e:
        results.add_fail("GET /api/me without token", f"Exception: {str(e)}")

def test_username(token):
    """Test PUT /api/me/username"""
    print("\n" + "="*80)
    print("TESTING /api/me/username ENDPOINT")
    print("="*80)
    
    import random
    username = f"tester_{random.randint(1000, 9999)}"
    
    # Test valid username
    log_info(f"PUT /api/me/username with valid username: {username}")
    try:
        resp = requests.put(f"{BASE_URL}/me/username", 
                           headers={"Authorization": f"Bearer {token}"},
                           json={"username": username})
        if resp.status_code != 200:
            results.add_fail("PUT /api/me/username (valid)", f"Status {resp.status_code}: {resp.text}")
            return None
        
        user = resp.json()
        if user.get('username') != username:
            results.add_fail("PUT /api/me/username (valid)", f"Expected username={username}, got {user.get('username')}")
            return None
        
        results.add_pass(f"PUT /api/me/username - sets username to {username}")
        log_info(f"User: {user}")
    except Exception as e:
        results.add_fail("PUT /api/me/username (valid)", f"Exception: {str(e)}")
        return None
    
    # Test invalid username (too short)
    log_info("PUT /api/me/username with invalid username 'ab' (should fail)")
    try:
        resp = requests.put(f"{BASE_URL}/me/username",
                           headers={"Authorization": f"Bearer {token}"},
                           json={"username": "ab"})
        if resp.status_code == 400:
            results.add_pass("PUT /api/me/username (too short) - correctly returns 400")
        else:
            results.add_fail("PUT /api/me/username (too short)", f"Expected 400, got {resp.status_code}: {resp.text}")
    except Exception as e:
        results.add_fail("PUT /api/me/username (too short)", f"Exception: {str(e)}")
    
    # Test invalid username (bad characters)
    log_info("PUT /api/me/username with invalid username 'bad name!' (should fail)")
    try:
        resp = requests.put(f"{BASE_URL}/me/username",
                           headers={"Authorization": f"Bearer {token}"},
                           json={"username": "bad name!"})
        if resp.status_code == 400:
            results.add_pass("PUT /api/me/username (bad chars) - correctly returns 400")
        else:
            results.add_fail("PUT /api/me/username (bad chars)", f"Expected 400, got {resp.status_code}: {resp.text}")
    except Exception as e:
        results.add_fail("PUT /api/me/username (bad chars)", f"Exception: {str(e)}")
    
    return username

def test_username_uniqueness(username):
    """Test username uniqueness (case-insensitive)"""
    print("\n" + "="*80)
    print("TESTING USERNAME UNIQUENESS")
    print("="*80)
    
    # Create second account
    log_info("Creating second account to test username uniqueness")
    try:
        acct2 = Account.create()
        address2 = acct2.address
        
        # Get nonce and sign
        resp = requests.get(f"{BASE_URL}/auth/nonce", params={"address": address2, "domain": DOMAIN})
        data = resp.json()
        message2 = data['message']
        sig2 = acct2.sign_message(encode_defunct(text=message2))
        signature2 = sig2.signature.hex()
        if not signature2.startswith('0x'):
            signature2 = '0x' + signature2
        
        # Verify
        resp = requests.post(f"{BASE_URL}/auth/verify", json={
            "address": address2,
            "message": message2,
            "signature": signature2
        })
        token2 = resp.json()['token']
        
        # Try to use same username (case-insensitive)
        log_info(f"Trying to set username to {username.upper()} (should fail)")
        resp = requests.put(f"{BASE_URL}/me/username",
                           headers={"Authorization": f"Bearer {token2}"},
                           json={"username": username.upper()})
        if resp.status_code == 409:
            results.add_pass("Username uniqueness - correctly rejects duplicate (case-insensitive)")
        else:
            results.add_fail("Username uniqueness", f"Expected 409, got {resp.status_code}: {resp.text}")
    except Exception as e:
        results.add_fail("Username uniqueness", f"Exception: {str(e)}")

def test_character(token):
    """Test PUT /api/me/character"""
    print("\n" + "="*80)
    print("TESTING /api/me/character ENDPOINT")
    print("="*80)
    
    # Test valid character
    log_info("PUT /api/me/character with valid character_id 'crown'")
    try:
        resp = requests.put(f"{BASE_URL}/me/character",
                           headers={"Authorization": f"Bearer {token}"},
                           json={"character_id": "crown"})
        if resp.status_code != 200:
            results.add_fail("PUT /api/me/character (valid)", f"Status {resp.status_code}: {resp.text}")
        else:
            user = resp.json()
            if user.get('character_id') != 'crown':
                results.add_fail("PUT /api/me/character (valid)", f"Expected character_id=crown, got {user.get('character_id')}")
            else:
                results.add_pass("PUT /api/me/character - sets character to crown")
    except Exception as e:
        results.add_fail("PUT /api/me/character (valid)", f"Exception: {str(e)}")
    
    # Test invalid character
    log_info("PUT /api/me/character with invalid character_id 'nope' (should fail)")
    try:
        resp = requests.put(f"{BASE_URL}/me/character",
                           headers={"Authorization": f"Bearer {token}"},
                           json={"character_id": "nope"})
        if resp.status_code == 400:
            results.add_pass("PUT /api/me/character (invalid) - correctly returns 400")
        else:
            results.add_fail("PUT /api/me/character (invalid)", f"Expected 400, got {resp.status_code}: {resp.text}")
    except Exception as e:
        results.add_fail("PUT /api/me/character (invalid)", f"Exception: {str(e)}")

def test_opponent():
    """Test GET /api/opponent"""
    print("\n" + "="*80)
    print("TESTING /api/opponent ENDPOINT")
    print("="*80)
    
    log_info("GET /api/opponent")
    try:
        resp = requests.get(f"{BASE_URL}/opponent")
        if resp.status_code != 200:
            results.add_fail("GET /api/opponent", f"Status {resp.status_code}: {resp.text}")
            return
        
        data = resp.json()
        if 'username' not in data or 'char_id' not in data:
            results.add_fail("GET /api/opponent", f"Missing username or char_id: {data}")
            return
        
        username = data['username']
        if 'bot' in username.lower():
            results.add_fail("GET /api/opponent", f"Username contains 'bot': {username}")
        else:
            results.add_pass(f"GET /api/opponent - returns human-like username: {username}")
        
        log_info(f"Opponent: {data}")
    except Exception as e:
        results.add_fail("GET /api/opponent", f"Exception: {str(e)}")

def test_league(token):
    """Test GET /api/league"""
    print("\n" + "="*80)
    print("TESTING /api/league ENDPOINT")
    print("="*80)
    
    log_info("GET /api/league (auto-create)")
    try:
        resp = requests.get(f"{BASE_URL}/league", headers={"Authorization": f"Bearer {token}"})
        if resp.status_code != 200:
            results.add_fail("GET /api/league", f"Status {resp.status_code}: {resp.text}")
            return None
        
        league = resp.json()
        
        # Verify structure
        errors = []
        if league.get('round') != 0:
            errors.append(f"Expected round=0, got {league.get('round')}")
        
        opponents = league.get('opponents', [])
        if len(opponents) != 5:
            errors.append(f"Expected 5 opponents, got {len(opponents)}")
        
        # Check unique usernames
        usernames = [o['username'] for o in opponents]
        if len(set(usernames)) != len(usernames):
            errors.append(f"Duplicate opponent usernames: {usernames}")
        
        if league.get('results') != []:
            errors.append(f"Expected empty results, got {league.get('results')}")
        
        if league.get('finished') != False:
            errors.append(f"Expected finished=false, got {league.get('finished')}")
        
        standings = league.get('standings', [])
        if len(standings) != 6:
            errors.append(f"Expected 6 standings rows, got {len(standings)}")
        
        if errors:
            results.add_fail("GET /api/league structure", "; ".join(errors))
        else:
            results.add_pass("GET /api/league - auto-creates league with round 0, 5 unique opponents, empty results, 6 standings")
        
        log_info(f"League: round={league.get('round')}, opponents={len(opponents)}, finished={league.get('finished')}")
        return league
    except Exception as e:
        results.add_fail("GET /api/league", f"Exception: {str(e)}")
        return None

def test_matches(token, league):
    """Test POST /api/matches"""
    print("\n" + "="*80)
    print("TESTING /api/matches ENDPOINT")
    print("="*80)
    
    if not league or not league.get('opponents'):
        log_error("Cannot test matches without league")
        return
    
    opponent = league['opponents'][4]  # Use 5th opponent
    
    # Test league match (win)
    log_info(f"POST /api/matches (league win: 3-1 vs {opponent['username']})")
    try:
        resp = requests.post(f"{BASE_URL}/matches",
                            headers={"Authorization": f"Bearer {token}"},
                            json={
                                "mode": "league",
                                "opponent_username": opponent['username'],
                                "opponent_char_id": "mohawk",
                                "player_goals": 3,
                                "opponent_goals": 1,
                                "arena": "paper",
                                "character_id": "crown"
                            })
        if resp.status_code != 200:
            results.add_fail("POST /api/matches (league win)", f"Status {resp.status_code}: {resp.text}")
            return
        
        data = resp.json()
        match = data.get('match')
        user = data.get('user')
        league_data = data.get('league')
        
        errors = []
        if match.get('outcome') != 'win':
            errors.append(f"Expected outcome=win, got {match.get('outcome')}")
        if match.get('points') != 3:
            errors.append(f"Expected match points=3, got {match.get('points')}")
        if user.get('points') != 3:
            errors.append(f"Expected user points=3, got {user.get('points')}")
        if user.get('wins') != 1:
            errors.append(f"Expected wins=1, got {user.get('wins')}")
        if league_data.get('round') != 1:
            errors.append(f"Expected league round=1, got {league_data.get('round')}")
        
        results_list = league_data.get('results', [])
        if len(results_list) != 1:
            errors.append(f"Expected 1 round in results, got {len(results_list)}")
        elif len(results_list[0]) != 3:
            errors.append(f"Expected 3 fixtures in round 0, got {len(results_list[0])}")
        else:
            first_fixture = results_list[0][0]
            if first_fixture.get('hs') != 3 or first_fixture.get('as') != 1:
                errors.append(f"Expected first fixture hs=3 as=1, got hs={first_fixture.get('hs')} as={first_fixture.get('as')}")
        
        if errors:
            results.add_fail("POST /api/matches (league win)", "; ".join(errors))
        else:
            results.add_pass("POST /api/matches (league win) - outcome=win, points=3, user.points=3, wins=1, league.round=1, 3 fixtures")
        
        log_info(f"Match: {match}")
        log_info(f"User: points={user.get('points')}, wins={user.get('wins')}")
    except Exception as e:
        results.add_fail("POST /api/matches (league win)", f"Exception: {str(e)}")
    
    # Test quick match (draw)
    log_info("POST /api/matches (quick draw: 2-2)")
    try:
        resp = requests.post(f"{BASE_URL}/matches",
                            headers={"Authorization": f"Bearer {token}"},
                            json={
                                "mode": "quick",
                                "opponent_username": "test_opponent",
                                "opponent_char_id": "arc",
                                "player_goals": 2,
                                "opponent_goals": 2,
                                "arena": "paper",
                                "character_id": "crown"
                            })
        if resp.status_code != 200:
            results.add_fail("POST /api/matches (quick draw)", f"Status {resp.status_code}: {resp.text}")
            return
        
        data = resp.json()
        user = data.get('user')
        
        errors = []
        if user.get('points') != 4:  # 3 from win + 1 from draw
            errors.append(f"Expected user points=4, got {user.get('points')}")
        if user.get('draws') != 1:
            errors.append(f"Expected draws=1, got {user.get('draws')}")
        
        if errors:
            results.add_fail("POST /api/matches (quick draw)", "; ".join(errors))
        else:
            results.add_pass("POST /api/matches (quick draw) - user.points=4, draws=1")
        
        log_info(f"User: points={user.get('points')}, draws={user.get('draws')}")
    except Exception as e:
        results.add_fail("POST /api/matches (quick draw)", f"Exception: {str(e)}")
    
    # Test quick match (loss)
    log_info("POST /api/matches (quick loss: 0-2)")
    try:
        resp = requests.post(f"{BASE_URL}/matches",
                            headers={"Authorization": f"Bearer {token}"},
                            json={
                                "mode": "quick",
                                "opponent_username": "test_opponent2",
                                "opponent_char_id": "mohawk",
                                "player_goals": 0,
                                "opponent_goals": 2,
                                "arena": "inverted",
                                "character_id": "crown"
                            })
        if resp.status_code != 200:
            results.add_fail("POST /api/matches (quick loss)", f"Status {resp.status_code}: {resp.text}")
            return
        
        data = resp.json()
        user = data.get('user')
        
        errors = []
        if user.get('points') != 4:  # Should stay at 4
            errors.append(f"Expected user points=4 (unchanged), got {user.get('points')}")
        if user.get('losses') != 1:
            errors.append(f"Expected losses=1, got {user.get('losses')}")
        
        if errors:
            results.add_fail("POST /api/matches (quick loss)", "; ".join(errors))
        else:
            results.add_pass("POST /api/matches (quick loss) - points unchanged at 4, losses=1")
        
        log_info(f"User: points={user.get('points')}, losses={user.get('losses')}")
    except Exception as e:
        results.add_fail("POST /api/matches (quick loss)", f"Exception: {str(e)}")

def test_league_completion(token, league):
    """Test playing through all league rounds"""
    print("\n" + "="*80)
    print("TESTING LEAGUE COMPLETION")
    print("="*80)
    
    if not league or not league.get('opponents'):
        log_error("Cannot test league completion without league")
        return
    
    # Play rounds 2-5 (we already played round 1)
    log_info("Playing league rounds 2-5")
    try:
        for round_num in range(2, 6):
            opponent = league['opponents'][round_num % 5]
            resp = requests.post(f"{BASE_URL}/matches",
                                headers={"Authorization": f"Bearer {token}"},
                                json={
                                    "mode": "league",
                                    "opponent_username": opponent['username'],
                                    "opponent_char_id": opponent['char_id'],
                                    "player_goals": 2,
                                    "opponent_goals": 1,
                                    "arena": "paper",
                                    "character_id": "crown"
                                })
            if resp.status_code != 200:
                results.add_fail(f"POST /api/matches (round {round_num})", f"Status {resp.status_code}: {resp.text}")
                return
            
            data = resp.json()
            league_data = data.get('league')
            log_info(f"Round {round_num}: league.round={league_data.get('round')}, finished={league_data.get('finished')}")
        
        # Check if league is finished
        resp = requests.get(f"{BASE_URL}/league", headers={"Authorization": f"Bearer {token}"})
        league_data = resp.json()
        
        if league_data.get('round') != 5:
            results.add_fail("League completion", f"Expected round=5, got {league_data.get('round')}")
        elif league_data.get('finished') != True:
            results.add_fail("League completion", f"Expected finished=true, got {league_data.get('finished')}")
        else:
            results.add_pass("League completion - round=5, finished=true")
        
        # Test posting another match when finished
        log_info("Testing POST /api/matches when league is finished")
        opponent = league['opponents'][0]
        resp = requests.post(f"{BASE_URL}/matches",
                            headers={"Authorization": f"Bearer {token}"},
                            json={
                                "mode": "league",
                                "opponent_username": opponent['username'],
                                "opponent_char_id": opponent['char_id'],
                                "player_goals": 1,
                                "opponent_goals": 1,
                                "arena": "paper",
                                "character_id": "crown"
                            })
        if resp.status_code != 200:
            results.add_fail("POST /api/matches (finished league)", f"Status {resp.status_code}: {resp.text}")
        else:
            data = resp.json()
            league_data = data.get('league')
            if league_data.get('finished') != True:
                results.add_fail("POST /api/matches (finished league)", f"League should stay finished, got {league_data.get('finished')}")
            else:
                results.add_pass("POST /api/matches (finished league) - match saved, league stays finished")
    except Exception as e:
        results.add_fail("League completion", f"Exception: {str(e)}")

def test_league_reset(token):
    """Test POST /api/league/reset"""
    print("\n" + "="*80)
    print("TESTING /api/league/reset ENDPOINT")
    print("="*80)
    
    log_info("POST /api/league/reset")
    try:
        resp = requests.post(f"{BASE_URL}/league/reset", headers={"Authorization": f"Bearer {token}"})
        if resp.status_code != 200:
            results.add_fail("POST /api/league/reset", f"Status {resp.status_code}: {resp.text}")
            return
        
        league = resp.json()
        
        errors = []
        if league.get('round') != 0:
            errors.append(f"Expected round=0, got {league.get('round')}")
        if league.get('results') != []:
            errors.append(f"Expected empty results, got {league.get('results')}")
        if len(league.get('opponents', [])) != 5:
            errors.append(f"Expected 5 opponents, got {len(league.get('opponents', []))}")
        
        if errors:
            results.add_fail("POST /api/league/reset", "; ".join(errors))
        else:
            results.add_pass("POST /api/league/reset - new league with round=0, empty results, 5 opponents")
        
        log_info(f"New league: round={league.get('round')}, opponents={len(league.get('opponents', []))}")
    except Exception as e:
        results.add_fail("POST /api/league/reset", f"Exception: {str(e)}")

def test_matches_me(token):
    """Test GET /api/matches/me"""
    print("\n" + "="*80)
    print("TESTING /api/matches/me ENDPOINT")
    print("="*80)
    
    log_info("GET /api/matches/me")
    try:
        resp = requests.get(f"{BASE_URL}/matches/me", headers={"Authorization": f"Bearer {token}"})
        if resp.status_code != 200:
            results.add_fail("GET /api/matches/me", f"Status {resp.status_code}: {resp.text}")
            return
        
        matches = resp.json()
        
        if not isinstance(matches, list):
            results.add_fail("GET /api/matches/me", f"Expected list, got {type(matches)}")
        elif len(matches) == 0:
            results.add_warning("GET /api/matches/me", "No matches found (expected some from previous tests)")
        else:
            # Check if sorted by most recent first
            if len(matches) > 1:
                first_time = matches[0].get('played_at', '')
                last_time = matches[-1].get('played_at', '')
                if first_time < last_time:
                    results.add_fail("GET /api/matches/me", f"Matches not sorted by most recent first")
                else:
                    results.add_pass(f"GET /api/matches/me - returns {len(matches)} matches (most recent first)")
            else:
                results.add_pass(f"GET /api/matches/me - returns {len(matches)} match")
            
            log_info(f"Found {len(matches)} matches")
            log_info(f"First match: {matches[0]}")
    except Exception as e:
        results.add_fail("GET /api/matches/me", f"Exception: {str(e)}")

def test_leaderboard(token):
    """Test GET /api/leaderboard"""
    print("\n" + "="*80)
    print("TESTING /api/leaderboard ENDPOINT")
    print("="*80)
    
    log_info("GET /api/leaderboard")
    try:
        resp = requests.get(f"{BASE_URL}/leaderboard")
        if resp.status_code != 200:
            results.add_fail("GET /api/leaderboard", f"Status {resp.status_code}: {resp.text}")
            return
        
        leaderboard = resp.json()
        
        if not isinstance(leaderboard, list):
            results.add_fail("GET /api/leaderboard", f"Expected list, got {type(leaderboard)}")
            return
        
        if len(leaderboard) == 0:
            results.add_warning("GET /api/leaderboard", "Empty leaderboard (expected at least our test user)")
            return
        
        # Find our test user
        errors = []
        found_user = False
        for entry in leaderboard:
            if 'rank' not in entry:
                errors.append("Missing rank field")
            if 'address' not in entry:
                errors.append("Missing address field")
            elif not (entry['address'].startswith('0x') and '...' in entry['address']):
                errors.append(f"Address not masked: {entry['address']}")
            if 'points' not in entry:
                errors.append("Missing points field")
            
            # Check if it's our user (has username starting with tester_)
            if entry.get('username', '').startswith('tester_'):
                found_user = True
                log_info(f"Found test user in leaderboard: rank={entry.get('rank')}, username={entry.get('username')}, points={entry.get('points')}")
        
        # Check sorting (by points desc)
        if len(leaderboard) > 1:
            for i in range(len(leaderboard) - 1):
                if leaderboard[i]['points'] < leaderboard[i+1]['points']:
                    errors.append(f"Not sorted by points desc: {leaderboard[i]['points']} < {leaderboard[i+1]['points']}")
                    break
        
        if errors:
            results.add_fail("GET /api/leaderboard", "; ".join(errors))
        elif not found_user:
            results.add_warning("GET /api/leaderboard", "Test user not found in leaderboard")
        else:
            results.add_pass("GET /api/leaderboard - returns sorted array with rank, masked address, points")
        
        log_info(f"Leaderboard has {len(leaderboard)} entries")
    except Exception as e:
        results.add_fail("GET /api/leaderboard", f"Exception: {str(e)}")

def test_validation():
    """Test input validation"""
    print("\n" + "="*80)
    print("TESTING INPUT VALIDATION")
    print("="*80)
    
    # Create a test account for validation tests
    log_info("Creating test account for validation tests")
    try:
        acct = Account.create()
        address = acct.address
        
        resp = requests.get(f"{BASE_URL}/auth/nonce", params={"address": address, "domain": DOMAIN})
        data = resp.json()
        message = data['message']
        sig = acct.sign_message(encode_defunct(text=message))
        signature = sig.signature.hex()
        if not signature.startswith('0x'):
            signature = '0x' + signature
        
        resp = requests.post(f"{BASE_URL}/auth/verify", json={
            "address": address,
            "message": message,
            "signature": signature
        })
        token = resp.json()['token']
    except Exception as e:
        results.add_fail("Validation test setup", f"Exception: {str(e)}")
        return
    
    # Test invalid mode
    log_info("POST /api/matches with invalid mode 'weird' (should return 422)")
    try:
        resp = requests.post(f"{BASE_URL}/matches",
                            headers={"Authorization": f"Bearer {token}"},
                            json={
                                "mode": "weird",
                                "opponent_username": "test",
                                "opponent_char_id": "arc",
                                "player_goals": 2,
                                "opponent_goals": 1,
                                "arena": "paper",
                                "character_id": "crown"
                            })
        if resp.status_code == 422:
            results.add_pass("Validation: invalid mode - correctly returns 422")
        else:
            results.add_fail("Validation: invalid mode", f"Expected 422, got {resp.status_code}: {resp.text}")
    except Exception as e:
        results.add_fail("Validation: invalid mode", f"Exception: {str(e)}")
    
    # Test negative goals
    log_info("POST /api/matches with player_goals=-1 (should return 422)")
    try:
        resp = requests.post(f"{BASE_URL}/matches",
                            headers={"Authorization": f"Bearer {token}"},
                            json={
                                "mode": "quick",
                                "opponent_username": "test",
                                "opponent_char_id": "arc",
                                "player_goals": -1,
                                "opponent_goals": 1,
                                "arena": "paper",
                                "character_id": "crown"
                            })
        if resp.status_code == 422:
            results.add_pass("Validation: negative goals - correctly returns 422")
        else:
            results.add_fail("Validation: negative goals", f"Expected 422, got {resp.status_code}: {resp.text}")
    except Exception as e:
        results.add_fail("Validation: negative goals", f"Exception: {str(e)}")

def main():
    print("\n" + "="*80)
    print("FUTBOT LEAGUE BACKEND API TEST SUITE")
    print(f"Testing: {BASE_URL}")
    print("="*80)
    
    # Run all tests
    token, address = test_auth_flow()
    
    if not token:
        log_error("Auth flow failed, cannot continue with other tests")
        results.summary()
        return
    
    test_me_endpoint(token)
    username = test_username(token)
    
    if username:
        test_username_uniqueness(username)
    
    test_character(token)
    test_opponent()
    league = test_league(token)
    
    if league:
        test_matches(token, league)
        test_league_completion(token, league)
    
    test_league_reset(token)
    test_matches_me(token)
    test_leaderboard(token)
    test_validation()
    
    # Print summary
    results.summary()
    
    # Exit with error code if any tests failed
    if results.failed:
        exit(1)
    else:
        exit(0)

if __name__ == "__main__":
    main()
