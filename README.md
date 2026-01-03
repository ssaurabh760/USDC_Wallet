# 🪙 USDC Wallet API

A simple Python/FastAPI project that simulates how Circle's stablecoin infrastructure works. Built for learning crypto/fintech backend concepts.

## 🎯 What You'll Learn

1. **Mint/Burn Mechanics** - How stablecoins are created and destroyed
2. **Wallet Management** - Basic crypto wallet concepts
3. **Idempotency** - Critical fintech pattern to prevent duplicate transactions
4. **Audit Trail** - Why every transaction must be logged (compliance!)
5. **REST API Design** - Building financial APIs

---

## 🚀 Quick Start

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Run the server
python main.py

# 3. Open API docs
# Go to: http://localhost:8000/docs
```

---

## 📚 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/wallets` | Create a new wallet |
| GET | `/wallets/{id}` | Get wallet details |
| GET | `/wallets/{id}/balance` | Get wallet balance |
| POST | `/mint` | Mint (create) new USDC |
| POST | `/burn` | Burn (destroy) USDC |
| POST | `/transfers` | Transfer USDC between wallets |
| GET | `/wallets/{id}/transactions` | Get wallet transaction history |
| GET | `/supply` | Get total USDC supply |
| GET | `/transactions` | Get all transactions |

---

## 🧪 Test It Out (Copy-Paste Examples)

### 1. Create Two Wallets

```bash
# Alice's wallet
curl -X POST http://localhost:8000/wallets \
  -H "Content-Type: application/json" \
  -d '{"owner_name": "Alice"}'

# Bob's wallet
curl -X POST http://localhost:8000/wallets \
  -H "Content-Type: application/json" \
  -d '{"owner_name": "Bob"}'
```

### 2. Mint USDC to Alice (Simulating USD Deposit)

```bash
curl -X POST http://localhost:8000/mint \
  -H "Content-Type: application/json" \
  -d '{"wallet_id": "ALICE_WALLET_ID", "amount": 1000}'
```

### 3. Transfer from Alice to Bob

```bash
curl -X POST http://localhost:8000/transfers \
  -H "Content-Type: application/json" \
  -d '{
    "from_wallet_id": "ALICE_WALLET_ID",
    "to_wallet_id": "BOB_WALLET_ID",
    "amount": 250,
    "idempotency_key": "transfer-001"
  }'
```

### 4. Try Duplicate Transfer (Idempotency Demo!)

```bash
# Run the SAME request again - it won't execute twice!
curl -X POST http://localhost:8000/transfers \
  -H "Content-Type: application/json" \
  -d '{
    "from_wallet_id": "ALICE_WALLET_ID",
    "to_wallet_id": "BOB_WALLET_ID",
    "amount": 250,
    "idempotency_key": "transfer-001"
  }'
# Response will say "Duplicate request - returning existing transaction"
```

### 5. Burn USDC (Simulating USD Withdrawal)

```bash
curl -X POST http://localhost:8000/burn \
  -H "Content-Type: application/json" \
  -d '{"wallet_id": "BOB_WALLET_ID", "amount": 100}'
```

### 6. Check Total Supply

```bash
curl http://localhost:8000/supply
# Should show: minted - burned = current supply
```

---

## 🔑 Key Concepts Explained

### 1. Mint & Burn (How Stablecoins Work)

```
MINT (Create USDC):
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   Customer  │ ──▶  │   Circle    │ ──▶  │  Blockchain │
│  Sends USD  │      │  Bank Acct  │      │  Mint USDC  │
└─────────────┘      └─────────────┘      └─────────────┘

BURN (Destroy USDC):
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   Customer  │ ◀──  │   Circle    │ ◀──  │  Blockchain │
│ Receives USD│      │  Bank Acct  │      │  Burn USDC  │
└─────────────┘      └─────────────┘      └─────────────┘
```

**Why this matters:** This is how Circle maintains the 1:1 USD peg!
- Total USDC minted = Total USD in Circle's bank
- Audited monthly by Deloitte

### 2. Idempotency (Prevent Duplicate Transactions)

```python
# Without idempotency:
# User clicks "Send $100" → Network timeout → User clicks again
# Result: $200 sent! 😱

# With idempotency:
# User clicks "Send $100" → Network timeout → User clicks again
# Result: Only $100 sent (second request returns same result) ✅
```

**How it works:**
1. Client generates unique `idempotency_key` (e.g., UUID)
2. Server checks if key exists in database
3. If exists → return cached result (no re-execution)
4. If new → execute and store result with key

**Interview tip:** This is a VERY common fintech interview question!

### 3. Audit Trail (Compliance Requirement)

Every financial system needs immutable logs of:
- Who did what
- When they did it
- How much was involved

```sql
-- Our transactions table is the audit trail
SELECT * FROM transactions WHERE wallet_id = 'abc123';
```

**Why this matters:** Regulators (SEC, FinCEN) can request transaction history at any time.

---

## 🏗️ Project Structure

```
usdc-wallet-api/
├── main.py          # FastAPI app with all endpoints
├── database.py      # SQLite database operations
├── requirements.txt # Python dependencies
├── README.md        # This file
└── usdc_wallet.db   # SQLite database (created on first run)
```

---

## 🎓 How This Maps to Real Circle

| This Project | Real Circle |
|--------------|-------------|
| SQLite database | PostgreSQL + Blockchain state |
| UUID wallet IDs | Ethereum addresses (0x...) |
| `/mint` endpoint | Circle Mint API |
| `/transfers` endpoint | USDC smart contract transfer() |
| `/supply` endpoint | On-chain totalSupply() |
| Transaction table | Blockchain + internal ledger |

---

## 💡 Extensions (If You Have More Time)

1. **Add authentication** - JWT tokens for wallet access
2. **Add rate limiting** - Prevent API abuse
3. **Add webhooks** - Notify on transaction completion
4. **Multi-currency** - Support EURC alongside USDC
5. **Cross-chain simulation** - Simulate CCTP burn-and-mint

---

## 📖 Talking Points for Your Interview

When discussing this project, you can mention:

1. **"I built a simple wallet API to understand how stablecoins work"**
   - Mint/burn mechanics
   - 1:1 backing requirement

2. **"I implemented idempotency for the transfer endpoint"**
   - Critical for financial systems
   - Prevents duplicate transactions

3. **"Every transaction is logged for audit compliance"**
   - Immutable transaction history
   - Required for regulatory compliance

4. **"I understand the difference between this simulation and real blockchain"**
   - Real USDC uses smart contracts
   - Actual transfers are on-chain and irreversible

---

## 🔗 Resources

- [Circle Developer Docs](https://developers.circle.com)
- [USDC Smart Contract](https://etherscan.io/token/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48)
- [What is USDC?](https://www.circle.com/usdc)

---
