"""
USDC Wallet API - A Simple Stablecoin Simulation
=================================================
This project simulates how Circle's backend infrastructure works:
- Mint/Burn tokens (like Circle does with USDC)
- Create wallets
- Transfer USDC between wallets
- Transaction history (audit trail)

Built for learning crypto/fintech backend concepts.
"""

from fastapi import FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware  # ADD THIS
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from database import Database
import uuid

app = FastAPI(
    title="USDC Wallet API",
    description="A simulation of Circle's stablecoin infrastructure",
    version="1.0.0"
)

# =============================================================================
# CORS CONFIGURATION - Allows frontend to communicate with API
# =============================================================================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins like ["http://localhost:3000"]
    allow_credentials=True,
    allow_methods=["*"],  # Allows GET, POST, PUT, DELETE, OPTIONS, etc.
    allow_headers=["*"],  # Allows all headers including Content-Type
)

# Initialize database
db = Database()

# =============================================================================
# PYDANTIC MODELS (Request/Response schemas)
# =============================================================================

class WalletCreate(BaseModel):
    """Request to create a new wallet"""
    owner_name: str = Field(..., min_length=1, max_length=100)
    
class WalletResponse(BaseModel):
    """Wallet details response"""
    wallet_id: str
    owner_name: str
    balance: float
    created_at: str

class MintRequest(BaseModel):
    """
    Mint = Create new USDC tokens
    In real Circle: This happens when someone deposits USD and gets USDC
    """
    wallet_id: str
    amount: float = Field(..., gt=0, description="Amount must be positive")

class BurnRequest(BaseModel):
    """
    Burn = Destroy USDC tokens
    In real Circle: This happens when someone redeems USDC for USD
    """
    wallet_id: str
    amount: float = Field(..., gt=0)

class TransferRequest(BaseModel):
    """
    Transfer USDC between wallets
    Includes idempotency_key to prevent duplicate transactions
    """
    from_wallet_id: str
    to_wallet_id: str
    amount: float = Field(..., gt=0)
    idempotency_key: str = Field(
        ..., 
        description="Unique key to prevent duplicate transfers (critical in fintech!)"
    )

class TransactionResponse(BaseModel):
    """Transaction record response"""
    transaction_id: str
    transaction_type: str  # MINT, BURN, TRANSFER
    from_wallet_id: Optional[str]
    to_wallet_id: Optional[str]
    amount: float
    timestamp: str
    idempotency_key: Optional[str]

# =============================================================================
# API ENDPOINTS
# =============================================================================

@app.get("/")
def root():
    """API Health Check"""
    return {
        "service": "USDC Wallet API",
        "status": "healthy",
        "description": "Simulating Circle's stablecoin infrastructure"
    }

# -----------------------------------------------------------------------------
# WALLET ENDPOINTS
# -----------------------------------------------------------------------------

@app.post("/wallets", response_model=WalletResponse, status_code=201)
def create_wallet(request: WalletCreate):
    """
    Create a new wallet
    
    In real Circle: Wallets are blockchain addresses (e.g., 0x123...abc)
    Here we simulate with UUIDs
    """
    wallet_id = str(uuid.uuid4())
    wallet = db.create_wallet(wallet_id, request.owner_name)
    return WalletResponse(
        wallet_id=wallet["wallet_id"],
        owner_name=wallet["owner_name"],
        balance=wallet["balance"],
        created_at=wallet["created_at"]
    )

@app.get("/wallets/{wallet_id}", response_model=WalletResponse)
def get_wallet(wallet_id: str):
    """Get wallet details and balance"""
    wallet = db.get_wallet(wallet_id)
    if not wallet:
        raise HTTPException(status_code=404, detail="Wallet not found")
    return WalletResponse(**wallet)

@app.get("/wallets/{wallet_id}/balance")
def get_balance(wallet_id: str):
    """
    Get wallet balance
    
    In real Circle: This would query the blockchain for token balance
    """
    wallet = db.get_wallet(wallet_id)
    if not wallet:
        raise HTTPException(status_code=404, detail="Wallet not found")
    return {
        "wallet_id": wallet_id,
        "balance": wallet["balance"],
        "currency": "USDC"
    }

# -----------------------------------------------------------------------------
# MINT & BURN ENDPOINTS (Circle's Core Operations)
# -----------------------------------------------------------------------------

@app.post("/mint", status_code=201)
def mint_tokens(request: MintRequest):
    """
    MINT: Create new USDC tokens
    
    How it works in real Circle:
    1. Customer sends USD to Circle's bank account
    2. Circle verifies the deposit
    3. Circle mints equivalent USDC to customer's wallet
    4. Total USDC supply increases
    
    This is how USDC enters circulation!
    """
    wallet = db.get_wallet(request.wallet_id)
    if not wallet:
        raise HTTPException(status_code=404, detail="Wallet not found")
    
    # Mint tokens (add to balance)
    new_balance = db.update_balance(request.wallet_id, request.amount)
    
    # Record transaction (audit trail - critical for compliance!)
    tx = db.record_transaction(
        tx_type="MINT",
        to_wallet_id=request.wallet_id,
        amount=request.amount
    )
    
    return {
        "message": f"Minted {request.amount} USDC",
        "transaction_id": tx["transaction_id"],
        "wallet_id": request.wallet_id,
        "new_balance": new_balance,
        "total_supply": db.get_total_supply()
    }

@app.post("/burn", status_code=201)
def burn_tokens(request: BurnRequest):
    """
    BURN: Destroy USDC tokens
    
    How it works in real Circle:
    1. Customer requests to redeem USDC for USD
    2. Circle burns (destroys) the USDC
    3. Circle sends USD to customer's bank account
    4. Total USDC supply decreases
    
    This maintains the 1:1 peg with USD!
    """
    wallet = db.get_wallet(request.wallet_id)
    if not wallet:
        raise HTTPException(status_code=404, detail="Wallet not found")
    
    if wallet["balance"] < request.amount:
        raise HTTPException(
            status_code=400, 
            detail=f"Insufficient balance. Available: {wallet['balance']} USDC"
        )
    
    # Burn tokens (subtract from balance)
    new_balance = db.update_balance(request.wallet_id, -request.amount)
    
    # Record transaction
    tx = db.record_transaction(
        tx_type="BURN",
        from_wallet_id=request.wallet_id,
        amount=request.amount
    )
    
    return {
        "message": f"Burned {request.amount} USDC",
        "transaction_id": tx["transaction_id"],
        "wallet_id": request.wallet_id,
        "new_balance": new_balance,
        "total_supply": db.get_total_supply()
    }

# -----------------------------------------------------------------------------
# TRANSFER ENDPOINT (With Idempotency - Critical for Fintech!)
# -----------------------------------------------------------------------------

@app.post("/transfers", status_code=201)
def transfer(request: TransferRequest):
    """
    TRANSFER: Move USDC between wallets
    
    Key Fintech Concept: IDEMPOTENCY
    ================================
    The idempotency_key ensures that if a request is sent twice 
    (network retry, user double-click, etc.), it only executes once.
    
    Without idempotency: User could accidentally send money twice!
    With idempotency: Duplicate requests return the same result safely.
    
    This is CRITICAL in financial systems and a common interview topic.
    """
    # Check for duplicate request (idempotency)
    existing_tx = db.get_transaction_by_idempotency_key(request.idempotency_key)
    if existing_tx:
        return {
            "message": "Duplicate request - returning existing transaction",
            "transaction_id": existing_tx["transaction_id"],
            "idempotent": True
        }
    
    # Validate wallets exist
    from_wallet = db.get_wallet(request.from_wallet_id)
    to_wallet = db.get_wallet(request.to_wallet_id)
    
    if not from_wallet:
        raise HTTPException(status_code=404, detail="Source wallet not found")
    if not to_wallet:
        raise HTTPException(status_code=404, detail="Destination wallet not found")
    if request.from_wallet_id == request.to_wallet_id:
        raise HTTPException(status_code=400, detail="Cannot transfer to same wallet")
    
    # Check sufficient balance
    if from_wallet["balance"] < request.amount:
        raise HTTPException(
            status_code=400,
            detail=f"Insufficient balance. Available: {from_wallet['balance']} USDC"
        )
    
    # Execute transfer (debit + credit)
    db.update_balance(request.from_wallet_id, -request.amount)
    db.update_balance(request.to_wallet_id, request.amount)
    
    # Record transaction with idempotency key
    tx = db.record_transaction(
        tx_type="TRANSFER",
        from_wallet_id=request.from_wallet_id,
        to_wallet_id=request.to_wallet_id,
        amount=request.amount,
        idempotency_key=request.idempotency_key
    )
    
    return {
        "message": f"Transferred {request.amount} USDC",
        "transaction_id": tx["transaction_id"],
        "from_wallet_id": request.from_wallet_id,
        "to_wallet_id": request.to_wallet_id,
        "amount": request.amount
    }

# -----------------------------------------------------------------------------
# TRANSACTION HISTORY & STATS
# -----------------------------------------------------------------------------

@app.get("/wallets/{wallet_id}/transactions")
def get_wallet_transactions(wallet_id: str):
    """
    Get transaction history for a wallet
    
    In real Circle: This is the audit trail required for compliance
    Every transaction is immutable and traceable
    """
    wallet = db.get_wallet(wallet_id)
    if not wallet:
        raise HTTPException(status_code=404, detail="Wallet not found")
    
    transactions = db.get_wallet_transactions(wallet_id)
    return {
        "wallet_id": wallet_id,
        "transaction_count": len(transactions),
        "transactions": transactions
    }

@app.get("/supply")
def get_total_supply():
    """
    Get total USDC in circulation
    
    In real Circle: This must ALWAYS equal the USD reserves in their bank
    This is how the 1:1 peg is maintained and verified
    """
    return {
        "total_supply": db.get_total_supply(),
        "currency": "USDC",
        "note": "In real Circle, this equals USD reserves (audited monthly)"
    }

@app.get("/transactions")
def get_all_transactions(limit: int = 50):
    """Get recent transactions (audit log)"""
    transactions = db.get_all_transactions(limit)
    return {
        "count": len(transactions),
        "transactions": transactions
    }

# =============================================================================
# RUN THE SERVER
# =============================================================================

if __name__ == "__main__":
    import uvicorn
    print("\n🚀 Starting USDC Wallet API...")
    print("📖 API Docs: http://localhost:8000/docs")
    print("📖 ReDoc: http://localhost:8000/redoc\n")
    uvicorn.run(app, host="0.0.0.0", port=8000)