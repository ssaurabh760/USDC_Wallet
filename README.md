# 🪙 USDC Wallet API

A simple Python/FastAPI project that simulates how Circle's stablecoin infrastructure works. Built for learning crypto/fintech backend concepts.

**Now with a React frontend dashboard!**

---

## 🎯 What You'll Learn

1. **Mint/Burn Mechanics** - How stablecoins are created and destroyed
2. **Wallet Management** - Basic crypto wallet concepts
3. **Idempotency** - Critical fintech pattern to prevent duplicate transactions
4. **Audit Trail** - Why every transaction must be logged (compliance!)
5. **REST API Design** - Building financial APIs

---

## 🚀 Quick Start

### Backend (API Server)

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Run the server
python main.py

# 3. Open API docs
# Go to: http://localhost:8000/docs
```

### Frontend (React Dashboard)

```bash
# Option 1: Using Create React App
npx create-react-app usdc-frontend
cd usdc-frontend

# Replace src/App.js with usdc-wallet-frontend.jsx content
# Then run:
npm start

# Option 2: Using Vite (faster)
npm create vite@latest usdc-frontend -- --template react
cd usdc-frontend
npm install

# Replace src/App.jsx with usdc-wallet-frontend.jsx content
# Then run:
npm run dev
```

The frontend will be available at `http://localhost:3000` (CRA) or `http://localhost:5173` (Vite).

---

## 🖥️ Frontend Features

| Feature | Description |
|---------|-------------|
| **Wallet Management** | Create wallets, view balances, copy wallet IDs |
| **Mint USDC** | Simulate depositing USD and receiving USDC |
| **Burn USDC** | Simulate redeeming USDC for USD |
| **Transfer** | Send USDC between wallets with idempotency |
| **Transaction History** | Real-time audit trail per wallet |
| **Total Supply Tracker** | Shows circulating USDC (minted - burned) |

### Frontend Screenshot

```
┌─────────────────────────────────────────────────────────────────┐
│  🔵 USDC Wallet                          Total Supply: $1,500   │
│     STABLECOIN SIMULATOR                                        │
├─────────────────────────────────────────────────────────────────┤
│  [New Wallet] [Mint USDC] [Burn USDC] [Transfer]                │
├─────────────────────────────────────────────────────────────────┤
│  WALLETS (2)                    │  ALICE'S TRANSACTIONS         │
│                                 │                               │
│  ┌─────────────────────┐        │  ↓ Minted    +$1,000.00      │
│  │ 👛 Alice            │        │    Jan 4, 10:30 AM           │
│  │    $750.00          │        │                               │
│  │    Selected ✓       │        │  → Transfer  -$250.00        │
│  └─────────────────────┘        │    Jan 4, 10:32 AM           │
│                                 │                               │
│  ┌─────────────────────┐        │                               │
│  │ 👛 Bob              │        │                               │
│  │    $750.00          │        │                               │
│  └─────────────────────┘        │                               │
└─────────────────────────────────────────────────────────────────┘
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

### 4. CORS (Cross-Origin Resource Sharing)

The API includes CORS middleware to allow the frontend (running on a different port) to communicate with the backend:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**Why this matters:** Browsers block cross-origin requests by default for security. CORS headers tell the browser it's safe to allow requests from the frontend origin.

---

## 🏗️ Project Structure

```
usdc-wallet-api/
├── main.py                    # FastAPI app with all endpoints
├── database.py                # SQLite database operations
├── requirements.txt           # Python dependencies
├── README.md                  # This file
├── usdc_wallet.db             # SQLite database (created on first run)
├── test.py                    # API test script
└── usdc-wallet-frontend.jsx   # React frontend dashboard
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
| React frontend | Circle's developer dashboard |

---

## 💡 Extensions (If You Have More Time)

1. **Add authentication** - JWT tokens for wallet access
2. **Add rate limiting** - Prevent API abuse
3. **Add webhooks** - Notify on transaction completion
4. **Multi-currency** - Support EURC alongside USDC
5. **Cross-chain simulation** - Simulate CCTP burn-and-mint
6. **Real-time updates** - WebSocket for live transaction feeds
7. **Mobile app** - React Native version of the dashboard

---

## 📖 Talking Points for Your Interview

When discussing this project, you can mention:

1. **"I built a full-stack wallet application to understand how stablecoins work"**
   - Mint/burn mechanics
   - 1:1 backing requirement
   - React frontend with real-time updates

2. **"I implemented idempotency for the transfer endpoint"**
   - Critical for financial systems
   - Prevents duplicate transactions
   - Frontend generates unique keys per transaction

3. **"Every transaction is logged for audit compliance"**
   - Immutable transaction history
   - Required for regulatory compliance
   - Visible in the transaction history UI

4. **"I understand the difference between this simulation and real blockchain"**
   - Real USDC uses smart contracts
   - Actual transfers are on-chain and irreversible

5. **"I handled CORS for secure frontend-backend communication"**
   - Understanding of browser security model
   - Production-ready API configuration

---

## 🔗 Resources

- [Circle Developer Docs](https://developers.circle.com)
- [USDC Smart Contract](https://etherscan.io/token/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48)
- [What is USDC?](https://www.circle.com/usdc)
- [FastAPI CORS Documentation](https://fastapi.tiangolo.com/tutorial/cors/)

---

## 🛠️ Troubleshooting

### "Failed to fetch" error in frontend
Make sure the backend is running with CORS enabled. Check that `main.py` includes the `CORSMiddleware` configuration.

### "OPTIONS 405 Method Not Allowed"
Your backend doesn't have CORS configured. Update `main.py` to include the CORS middleware.

### Frontend not connecting to backend
1. Verify backend is running: `curl http://localhost:8000/`
2. Check frontend is pointing to correct URL (`http://localhost:8000`)
3. Ensure no firewall is blocking the connection

---