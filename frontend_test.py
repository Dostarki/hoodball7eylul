#!/usr/bin/env python3
"""
Frontend test for Futbot League - Testing auto-login after wallet connect
"""
import asyncio
import secrets
from playwright.async_api import async_playwright

# Read frontend URL from .env
with open('/app/frontend/.env') as f:
    for line in f:
        if line.startswith('REACT_APP_BACKEND_URL='):
            BACKEND_URL = line.split('=', 1)[1].strip()
            break

# Frontend is at the root of the backend URL
FRONTEND_URL = BACKEND_URL.replace('/api', '')
print(f"Testing frontend at: {FRONTEND_URL}")

# Use a different address than backend test to ensure fresh user
TEST_ADDRESS = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"

async def test_auto_login_flow():
    """Test frontend auto-login after wallet connect (no signature required)"""
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        
        # Create fresh context (clear localStorage)
        context = await browser.new_context()
        
        # Inject mock EIP-1193 provider before page load
        await context.add_init_script("""
            // Track if personal_sign was called (it should NOT be)
            window.personalSignCalled = false;
            
            // Mock EIP-1193 provider
            window.ethereum = {
                isMetaMask: true,
                request: async ({ method, params }) => {
                    console.log('[Mock Provider] request:', method, params);
                    
                    if (method === 'eth_requestAccounts' || method === 'eth_accounts') {
                        return ['0x70997970C51812dc3A010C7d01b50e0d17dc79C8'];
                    }
                    if (method === 'eth_chainId') {
                        return '0x1237'; // 4663 in hex
                    }
                    if (method === 'wallet_switchEthereumChain' || method === 'wallet_addEthereumChain') {
                        return null;
                    }
                    if (method === 'net_version') {
                        return '4663';
                    }
                    if (method === 'personal_sign') {
                        window.personalSignCalled = true;
                        throw new Error('personal_sign should not be called in new flow');
                    }
                    return null;
                },
                on: () => {},
                removeListener: () => {}
            };
            
            // EIP-6963 announcement
            window.dispatchEvent(new CustomEvent('eip6963:announceProvider', {
                detail: Object.freeze({
                    info: {
                        rdns: 'io.metamask',
                        uuid: crypto.randomUUID(),
                        name: 'MetaMask',
                        icon: 'data:image/svg+xml,<svg></svg>'
                    },
                    provider: window.ethereum
                })
            }));
        """)
        
        page = await context.new_page()
        
        # Enable console logging
        page.on("console", lambda msg: print(f"[Browser Console] {msg.type}: {msg.text}"))
        
        print("\n=== Test 1: Open home page (auto-login should happen) ===")
        await page.goto(FRONTEND_URL, wait_until="networkidle")
        await page.wait_for_timeout(2000)  # Wait for auto-login
        await page.screenshot(path="/app/test_screenshots/01_home.png")
        print("✅ Home page loaded")
        
        # Check if auto-login happened
        # The mock provider should trigger auto-login immediately
        # We should see either:
        # 1. Username dialog (if user has no username) - this means auto-login worked!
        # 2. User pill (if user already has username) - this also means auto-login worked!
        # 3. Connect button (if auto-login didn't work) - we need to click it
        
        print("\n--- Checking auto-login status ---")
        username_dialog = page.locator('[data-testid="username-dialog"]')
        user_pill = page.locator('[data-testid="nav-user-pill"]')
        connect_btn = page.locator('[data-testid="nav-connect-btn"]')
        
        dialog_visible = await username_dialog.is_visible()
        pill_visible = await user_pill.is_visible()
        btn_visible = await connect_btn.is_visible()
        
        if dialog_visible:
            print("✅ AUTO-LOGIN WORKED! Username dialog appeared immediately (user has no username)")
            await page.screenshot(path="/app/test_screenshots/02_auto_login_dialog.png")
        elif pill_visible:
            pill_text = await user_pill.inner_text()
            print(f"✅ AUTO-LOGIN WORKED! User pill appeared immediately: {pill_text}")
            await page.screenshot(path="/app/test_screenshots/02_auto_login_pill.png")
            # User already has username, test is essentially done
            # But we can still test navigation
        elif btn_visible:
            print("⚠️ Auto-login did not happen, need to manually connect")
            await page.screenshot(path="/app/test_screenshots/02_connect_btn.png")
            
            # Click connect button
            await connect_btn.click()
            await page.wait_for_timeout(1000)
            await page.screenshot(path="/app/test_screenshots/03_connect_modal.png")
            
            # Try to find and click MetaMask button
            print("\n--- Clicking MetaMask wallet option ---")
            metamask_clicked = False
            
            try:
                metamask_btn = page.get_by_role("button", name="MetaMask")
                await metamask_btn.click(timeout=3000)
                metamask_clicked = True
                print("✅ MetaMask button clicked")
            except:
                try:
                    metamask_btn = page.locator('button:has-text("MetaMask")').first
                    await metamask_btn.click(timeout=3000)
                    metamask_clicked = True
                    print("✅ MetaMask button clicked")
                except:
                    pass
            
            if not metamask_clicked:
                await page.screenshot(path="/app/test_screenshots/04_modal_error.png")
                raise Exception("Could not find MetaMask button")
            
            await page.wait_for_timeout(2000)
            await page.screenshot(path="/app/test_screenshots/04_after_connect.png")
        else:
            print("❌ Unexpected state: no dialog, pill, or connect button visible")
            await page.screenshot(path="/app/test_screenshots/02_error.png")
            raise Exception("Unexpected page state")
        
        print("\n=== Test 2: Verify auto-login completed (no signature required) ===")
        
        # At this point, we should have either username dialog or user pill
        # Re-check in case state changed
        await page.wait_for_timeout(1000)
        dialog_visible = await username_dialog.is_visible()
        pill_visible = await user_pill.is_visible()
        
        if not dialog_visible and not pill_visible:
            print("❌ Neither username dialog nor user pill visible after auto-login")
            await page.screenshot(path="/app/test_screenshots/05_error.png")
            raise Exception("Auto-login did not complete")
        
        if dialog_visible:
            print("✅ Username dialog is visible (user needs to set username)")
            await page.screenshot(path="/app/test_screenshots/05_username_dialog.png")
        else:
            print(f"✅ User pill is visible: {await user_pill.inner_text()}")
            await page.screenshot(path="/app/test_screenshots/05_user_pill.png")
        
        # Verify personal_sign was NOT called
        personal_sign_called = await page.evaluate("window.personalSignCalled")
        if personal_sign_called:
            print("❌ personal_sign was called (should not be in new flow)")
            raise Exception("personal_sign should not be called")
        else:
            print("✅ personal_sign was NOT called (correct)")
        
        
        print("\n=== Test 3: Set username (if dialog visible) ===")
        
        if dialog_visible:
            # Generate unique username
            random_suffix = secrets.token_hex(4)
            username = f"test_{random_suffix}"
            
            print(f"\n--- Setting username: {username} ---")
            username_input = username_dialog.locator('[data-testid="username-input"]')
            await username_input.fill(username)
            
            submit_btn = username_dialog.locator('[data-testid="username-submit"]')
            await submit_btn.click()
            
            # Wait for dialog to close and user pill to appear
            await page.wait_for_selector('[data-testid="nav-user-pill"]', timeout=5000)
            await page.screenshot(path="/app/test_screenshots/06_username_set.png")
            
            pill_text = await page.locator('[data-testid="nav-user-pill"]').inner_text()
            print(f"✅ Username set, user pill shows: {pill_text}")
            
            if username not in pill_text:
                print(f"❌ Username not in pill text: {pill_text}")
                raise Exception("Username not displayed correctly")
        else:
            print("⚠️ Skipping username setup (user already has username)")
            await page.screenshot(path="/app/test_screenshots/06_skip_username.png")
        
        
        print("\n=== Test 4: Navigate to /play?mode=quick (should load game) ===")
        
        await page.goto(f"{FRONTEND_URL}/play?mode=quick", wait_until="networkidle")
        await page.wait_for_timeout(2000)  # Wait for game to initialize
        await page.screenshot(path="/app/test_screenshots/07_game_page.png")
        
        # Check for game elements (not wallet gate)
        game_canvas = page.locator('[data-testid="game-canvas"]')
        scoreboard = page.locator('[data-testid="scoreboard"]')
        wallet_gate = page.locator('[data-testid="wallet-gate"]')
        
        canvas_visible = await game_canvas.is_visible()
        scoreboard_visible = await scoreboard.is_visible()
        gate_visible = await wallet_gate.is_visible()
        
        if gate_visible:
            print("❌ Wallet gate is visible (should not be)")
            raise Exception("Wallet gate should not be visible for logged-in user")
        
        if canvas_visible and scoreboard_visible:
            print("✅ Game loaded (canvas and scoreboard visible)")
            
            # Check opponent name
            opponent_name = page.locator('[data-testid="opponent-name"]')
            if await opponent_name.is_visible():
                name_text = await opponent_name.inner_text()
                print(f"✅ Opponent name: {name_text}")
                if name_text.startswith('@'):
                    print("✅ Opponent name starts with @ (correct)")
                else:
                    print("⚠️ Opponent name does not start with @")
        else:
            print("❌ Game did not load (canvas or scoreboard not visible)")
            raise Exception("Game did not load")
        
        
        print("\n=== Test 5: Reload page (user should stay logged in) ===")
        
        await page.reload(wait_until="networkidle")
        await page.wait_for_timeout(2000)
        await page.screenshot(path="/app/test_screenshots/08_after_reload.png")
        
        # Check if user pill is still visible
        user_pill = page.locator('[data-testid="nav-user-pill"]')
        if await user_pill.is_visible():
            pill_text = await user_pill.inner_text()
            print(f"✅ User stayed logged in after reload: {pill_text}")
        else:
            print("❌ User not logged in after reload")
            raise Exception("User should stay logged in after reload")
        
        await browser.close()
        
        print("\n" + "=" * 60)
        print("✅ ALL FRONTEND TESTS PASSED")
        print("=" * 60)

async def main():
    print("=" * 60)
    print("FUTBOT LEAGUE FRONTEND TEST - AUTO-LOGIN FLOW")
    print("=" * 60)
    
    # Create screenshots directory
    import os
    os.makedirs("/app/test_screenshots", exist_ok=True)
    
    try:
        await test_auto_login_flow()
    except Exception as e:
        print(f"\n❌ TEST FAILED: {e}")
        import traceback
        traceback.print_exc()
        raise

if __name__ == "__main__":
    asyncio.run(main())
