"""
Test Script - Demonstrates the USDC Wallet API
==============================================
Run this after starting the server to see everything in action.

Usage:
1. Start server: python main.py
2. In another terminal: python test_api.py
"""

import requests
import uuid
import time

BASE_URL = "http://localhost:8000"

def print_header(text):
    print(f"\n{'='*60}")
    print(f"  {text}")
    print('='*60)

def print_response(response):
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")

def main():
    print_header("🪙 USDC Wallet API - Demo Script")
    
    # =========================================================================
    # 1. Create Wallets
    # =========================================================================
    print_header("1. Creating Wallets")
    
    # Create Alice's wallet
    print("\n📱 Creating Alice's wallet...")
    response = requests.post(f"{BASE_URL}/wallets", json={"owner_name": "Alice"})
    print_response(response)
    alice_wallet = response.json()["wallet_id"]
    
    # Create Bob's wallet
    print("\n📱 Creating Bob's wallet...")
    response = requests.post(f"{BASE_URL}/wallets", json={"owner_name": "Bob"})
    print_response(response)
    bob_wallet = response.json()["wallet_id"]
    
    print(f"\n✅ Alice's Wallet ID: {alice_wallet}")
    print(f"✅ Bob's Wallet ID: {bob_wallet}")
    
    # =========================================================================
    # 2. Check Initial Supply
    # =========================================================================
    print_header("2. Checking Initial Supply")
    
    response = requests.get(f"{BASE_URL}/supply")
    print_response(response)
    print("💡 Supply is 0 because no USDC has been minted yet!")
    
    # =========================================================================
    # 3. Mint USDC (Simulating USD deposit)
    # =========================================================================
    print_header("3. Minting USDC to Alice (Simulating $1000 USD deposit)")
    
    print("\n💰 Minting 1000 USDC to Alice...")
    response = requests.post(f"{BASE_URL}/mint", json={
        "wallet_id": alice_wallet,
        "amount": 1000
    })
    print_response(response)
    
    print("\n💰 Minting 500 USDC to Bob...")
    response = requests.post(f"{BASE_URL}/mint", json={
        "wallet_id": bob_wallet,
        "amount": 500
    })
    print_response(response)
    
    # Check supply after minting
    print("\n📊 Checking supply after minting...")
    response = requests.get(f"{BASE_URL}/supply")
    print_response(response)
    print("💡 Total supply = 1000 + 500 = 1500 USDC")
    
    # =========================================================================
    # 4. Check Balances
    # =========================================================================
    print_header("4. Checking Wallet Balances")
    
    print("\n👛 Alice's balance:")
    response = requests.get(f"{BASE_URL}/wallets/{alice_wallet}/balance")
    print_response(response)
    
    print("\n👛 Bob's balance:")
    response = requests.get(f"{BASE_URL}/wallets/{bob_wallet}/balance")
    print_response(response)
    
    # =========================================================================
    # 5. Transfer USDC
    # =========================================================================
    print_header("5. Transferring 250 USDC from Alice to Bob")
    
    idempotency_key = f"transfer-{uuid.uuid4()}"
    
    print(f"\n🔑 Idempotency Key: {idempotency_key}")
    print("\n💸 Executing transfer...")
    response = requests.post(f"{BASE_URL}/transfers", json={
        "from_wallet_id": alice_wallet,
        "to_wallet_id": bob_wallet,
        "amount": 250,
        "idempotency_key": idempotency_key
    })
    print_response(response)
    
    # =========================================================================
    # 6. Demonstrate Idempotency (Critical Fintech Concept!)
    # =========================================================================
    print_header("6. Testing Idempotency (IMPORTANT!)")
    
    print("\n🔄 Sending the SAME transfer request again...")
    print("   (This simulates network retry or user double-click)")
    
    response = requests.post(f"{BASE_URL}/transfers", json={
        "from_wallet_id": alice_wallet,
        "to_wallet_id": bob_wallet,
        "amount": 250,
        "idempotency_key": idempotency_key  # Same key!
    })
    print_response(response)
    print("\n✅ Notice: 'idempotent: true' - Money was NOT sent twice!")
    print("💡 This is why idempotency is critical in financial systems!")
    
    # Check balances to confirm
    print("\n👛 Alice's balance (should be 750, not 500):")
    response = requests.get(f"{BASE_URL}/wallets/{alice_wallet}/balance")
    print_response(response)
    
    print("\n👛 Bob's balance (should be 750, not 1000):")
    response = requests.get(f"{BASE_URL}/wallets/{bob_wallet}/balance")
    print_response(response)
    
    # =========================================================================
    # 7. Burn USDC (Simulating USD withdrawal)
    # =========================================================================
    print_header("7. Burning 100 USDC from Bob (Simulating USD withdrawal)")
    
    print("\n🔥 Burning 100 USDC...")
    response = requests.post(f"{BASE_URL}/burn", json={
        "wallet_id": bob_wallet,
        "amount": 100
    })
    print_response(response)
    print("\n💡 Bob redeemed 100 USDC for $100 USD (simulation)")
    
    # =========================================================================
    # 8. Check Final State
    # =========================================================================
    print_header("8. Final State")
    
    print("\n📊 Total Supply:")
    response = requests.get(f"{BASE_URL}/supply")
    print_response(response)
    print("💡 1500 minted - 100 burned = 1400 USDC in circulation")
    
    print("\n👛 Final Balances:")
    print("   Alice:", requests.get(f"{BASE_URL}/wallets/{alice_wallet}/balance").json())
    print("   Bob:", requests.get(f"{BASE_URL}/wallets/{bob_wallet}/balance").json())
    
    # =========================================================================
    # 9. Transaction History (Audit Trail)
    # =========================================================================
    print_header("9. Transaction History (Audit Trail)")
    
    print("\n📜 Alice's transactions:")
    response = requests.get(f"{BASE_URL}/wallets/{alice_wallet}/transactions")
    for tx in response.json()["transactions"]:
        print(f"   {tx['transaction_type']}: {tx['amount']} USDC at {tx['timestamp']}")
    
    print("\n📜 All transactions:")
    response = requests.get(f"{BASE_URL}/transactions")
    for tx in response.json()["transactions"]:
        print(f"   [{tx['transaction_type']}] {tx['amount']} USDC")
    
    # =========================================================================
    # 10. Error Handling Demo
    # =========================================================================
    print_header("10. Error Handling Demo")
    
    print("\n❌ Trying to transfer more than available balance...")
    response = requests.post(f"{BASE_URL}/transfers", json={
        "from_wallet_id": alice_wallet,
        "to_wallet_id": bob_wallet,
        "amount": 10000,
        "idempotency_key": f"transfer-{uuid.uuid4()}"
    })
    print(f"Status: {response.status_code}")
    print(f"Error: {response.json()}")
    print("✅ Correctly rejected - insufficient balance!")
    
    print_header("🎉 Demo Complete!")
    print("""
Key Takeaways:
1. MINT creates new USDC (increases supply)
2. BURN destroys USDC (decreases supply)
3. TRANSFER moves USDC between wallets (supply unchanged)
4. IDEMPOTENCY prevents duplicate transactions
5. AUDIT TRAIL logs everything for compliance

Good luck with your Circle interview! 🚀
""")

if __name__ == "__main__":
    try:
        # Check if server is running
        requests.get(f"{BASE_URL}/")
        main()
    except requests.exceptions.ConnectionError:
        print("❌ Error: Server not running!")
        print("   Start the server first: python main.py")
        print("   Then run this script in another terminal.")