"""
Database Module - SQLite Storage for USDC Wallet API
=====================================================
Handles all database operations:
- Wallet management
- Transaction recording
- Balance updates
- Audit trail

In real Circle: This would be PostgreSQL + blockchain state
"""

import sqlite3
from datetime import datetime
from typing import Optional, Dict, List
import uuid
import threading

class Database:
    """
    Simple SQLite database for wallet and transaction storage
    
    Key Concepts Demonstrated:
    - Atomic transactions (critical for money movement)
    - Audit trail (every action is logged)
    - Idempotency key storage (prevent duplicates)
    """
    
    def __init__(self, db_path: str = "usdc_wallet.db"):
        self.db_path = db_path
        self.local = threading.local()
        self._init_db()
    
    def _get_conn(self) -> sqlite3.Connection:
        """Get thread-local database connection"""
        if not hasattr(self.local, 'conn'):
            self.local.conn = sqlite3.connect(self.db_path, check_same_thread=False)
            self.local.conn.row_factory = sqlite3.Row
        return self.local.conn
    
    def _init_db(self):
        """Initialize database tables"""
        conn = self._get_conn()
        cursor = conn.cursor()
        
        # Wallets table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS wallets (
                wallet_id TEXT PRIMARY KEY,
                owner_name TEXT NOT NULL,
                balance REAL DEFAULT 0.0,
                created_at TEXT NOT NULL
            )
        """)
        
        # Transactions table (audit trail)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS transactions (
                transaction_id TEXT PRIMARY KEY,
                transaction_type TEXT NOT NULL,
                from_wallet_id TEXT,
                to_wallet_id TEXT,
                amount REAL NOT NULL,
                timestamp TEXT NOT NULL,
                idempotency_key TEXT UNIQUE
            )
        """)
        
        # Index for faster idempotency lookups
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_idempotency 
            ON transactions(idempotency_key)
        """)
        
        conn.commit()
    
    # =========================================================================
    # WALLET OPERATIONS
    # =========================================================================
    
    def create_wallet(self, wallet_id: str, owner_name: str) -> Dict:
        """Create a new wallet with zero balance"""
        conn = self._get_conn()
        cursor = conn.cursor()
        
        created_at = datetime.utcnow().isoformat()
        
        cursor.execute(
            "INSERT INTO wallets (wallet_id, owner_name, balance, created_at) VALUES (?, ?, 0.0, ?)",
            (wallet_id, owner_name, created_at)
        )
        conn.commit()
        
        return {
            "wallet_id": wallet_id,
            "owner_name": owner_name,
            "balance": 0.0,
            "created_at": created_at
        }
    
    def get_wallet(self, wallet_id: str) -> Optional[Dict]:
        """Get wallet by ID"""
        conn = self._get_conn()
        cursor = conn.cursor()
        
        cursor.execute("SELECT * FROM wallets WHERE wallet_id = ?", (wallet_id,))
        row = cursor.fetchone()
        
        if row:
            return dict(row)
        return None
    
    def update_balance(self, wallet_id: str, amount_change: float) -> float:
        """
        Update wallet balance (atomic operation)
        
        amount_change: positive for credit, negative for debit
        Returns: new balance
        
        In real systems: This would use database transactions with locks
        to prevent race conditions (two transfers at same time)
        """
        conn = self._get_conn()
        cursor = conn.cursor()
        
        # Get current balance
        cursor.execute("SELECT balance FROM wallets WHERE wallet_id = ?", (wallet_id,))
        row = cursor.fetchone()
        
        if not row:
            raise ValueError(f"Wallet {wallet_id} not found")
        
        new_balance = row["balance"] + amount_change
        
        # Update balance
        cursor.execute(
            "UPDATE wallets SET balance = ? WHERE wallet_id = ?",
            (new_balance, wallet_id)
        )
        conn.commit()
        
        return new_balance
    
    # =========================================================================
    # TRANSACTION OPERATIONS (Audit Trail)
    # =========================================================================
    
    def record_transaction(
        self,
        tx_type: str,
        amount: float,
        from_wallet_id: Optional[str] = None,
        to_wallet_id: Optional[str] = None,
        idempotency_key: Optional[str] = None
    ) -> Dict:
        """
        Record a transaction in the audit trail
        
        Every financial operation must be logged for:
        - Compliance (regulators need to see everything)
        - Debugging (what happened and when)
        - Reconciliation (do balances match transactions?)
        """
        conn = self._get_conn()
        cursor = conn.cursor()
        
        transaction_id = str(uuid.uuid4())
        timestamp = datetime.utcnow().isoformat()
        
        cursor.execute(
            """INSERT INTO transactions 
               (transaction_id, transaction_type, from_wallet_id, to_wallet_id, amount, timestamp, idempotency_key) 
               VALUES (?, ?, ?, ?, ?, ?, ?)""",
            (transaction_id, tx_type, from_wallet_id, to_wallet_id, amount, timestamp, idempotency_key)
        )
        conn.commit()
        
        return {
            "transaction_id": transaction_id,
            "transaction_type": tx_type,
            "from_wallet_id": from_wallet_id,
            "to_wallet_id": to_wallet_id,
            "amount": amount,
            "timestamp": timestamp,
            "idempotency_key": idempotency_key
        }
    
    def get_transaction_by_idempotency_key(self, key: str) -> Optional[Dict]:
        """
        Check if a transaction with this idempotency key exists
        
        This is how we prevent duplicate transactions!
        """
        conn = self._get_conn()
        cursor = conn.cursor()
        
        cursor.execute(
            "SELECT * FROM transactions WHERE idempotency_key = ?",
            (key,)
        )
        row = cursor.fetchone()
        
        if row:
            return dict(row)
        return None
    
    def get_wallet_transactions(self, wallet_id: str) -> List[Dict]:
        """Get all transactions for a wallet"""
        conn = self._get_conn()
        cursor = conn.cursor()
        
        cursor.execute(
            """SELECT * FROM transactions 
               WHERE from_wallet_id = ? OR to_wallet_id = ?
               ORDER BY timestamp DESC""",
            (wallet_id, wallet_id)
        )
        
        return [dict(row) for row in cursor.fetchall()]
    
    def get_all_transactions(self, limit: int = 50) -> List[Dict]:
        """Get recent transactions"""
        conn = self._get_conn()
        cursor = conn.cursor()
        
        cursor.execute(
            "SELECT * FROM transactions ORDER BY timestamp DESC LIMIT ?",
            (limit,)
        )
        
        return [dict(row) for row in cursor.fetchall()]
    
    # =========================================================================
    # SUPPLY TRACKING
    # =========================================================================
    
    def get_total_supply(self) -> float:
        """
        Calculate total USDC in circulation
        
        Sum of all wallet balances = Total Supply
        
        In real Circle: This MUST equal USD reserves in their bank
        Any mismatch would break the 1:1 peg!
        """
        conn = self._get_conn()
        cursor = conn.cursor()
        
        cursor.execute("SELECT COALESCE(SUM(balance), 0.0) as total FROM wallets")
        row = cursor.fetchone()
        
        return row["total"]