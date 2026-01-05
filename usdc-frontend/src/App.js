import React, { useState, useEffect } from 'react';

const API_BASE = 'http://localhost:8000';

// Custom hook for API calls
const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const call = async (endpoint, options = {}) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        headers: { 'Content-Type': 'application/json' },
        ...options,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'API Error');
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { call, loading, error, setError };
};

// Format currency
const formatUSD = (amount) => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

// Format date
const formatDate = (iso) => {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Generate idempotency key
const generateIdempotencyKey = () => `txn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Icons
const Icons = {
  Wallet: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
      <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
      <path d="M18 12a2 2 0 0 0 0 4h4v-4h-4z" />
    </svg>
  ),
  Mint: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 8v8M8 12h8" />
    </svg>
  ),
  Burn: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
    </svg>
  ),
  Send: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
    </svg>
  ),
  History: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  Supply: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  ),
  Check: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  Copy: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  ),
  Circle: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="12" r="10" />
    </svg>
  ),
};

// Toast notification component
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div style={{
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      padding: '16px 24px',
      background: type === 'success' ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
      color: 'white',
      borderRadius: '12px',
      boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      animation: 'slideIn 0.3s ease',
      zIndex: 1000,
      fontFamily: "'DM Sans', sans-serif",
      fontWeight: 500,
    }}>
      {type === 'success' && <Icons.Check />}
      {message}
    </div>
  );
};

// Wallet Card Component
const WalletCard = ({ wallet, isSelected, onClick, onCopy }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(wallet.wallet_id);
    setCopied(true);
    onCopy();
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      onClick={onClick}
      style={{
        background: isSelected 
          ? 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)' 
          : 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
        borderRadius: '16px',
        padding: '24px',
        cursor: 'pointer',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: isSelected ? 'scale(1.02)' : 'scale(1)',
        boxShadow: isSelected 
          ? '0 20px 40px rgba(37, 99, 235, 0.3)' 
          : '0 4px 20px rgba(0,0,0,0.2)',
        border: `1px solid ${isSelected ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.05)'}`,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
        <div style={{ 
          background: 'rgba(255,255,255,0.1)', 
          borderRadius: '10px', 
          padding: '10px',
          backdropFilter: 'blur(10px)',
        }}>
          <Icons.Wallet />
        </div>
        <button
          onClick={handleCopy}
          style={{
            background: 'rgba(255,255,255,0.1)',
            border: 'none',
            borderRadius: '8px',
            padding: '8px 12px',
            color: 'white',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12px',
            transition: 'all 0.2s',
          }}
        >
          {copied ? <Icons.Check /> : <Icons.Copy />}
          {copied ? 'Copied!' : 'Copy ID'}
        </button>
      </div>
      
      <div style={{ marginBottom: '8px', opacity: 0.7, fontSize: '14px', letterSpacing: '0.5px' }}>
        {wallet.owner_name}
      </div>
      
      <div style={{ 
        fontSize: '32px', 
        fontWeight: 700, 
        fontFamily: "'Space Mono', monospace",
        letterSpacing: '-1px',
      }}>
        ${formatUSD(wallet.balance)}
      </div>
      
      <div style={{ 
        marginTop: '16px', 
        fontSize: '12px', 
        opacity: 0.5, 
        fontFamily: "'Space Mono', monospace",
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}>
        {wallet.wallet_id.substring(0, 20)}...
      </div>
    </div>
  );
};

// Action Button Component
const ActionButton = ({ icon: Icon, label, onClick, variant = 'default', disabled }) => {
  const variants = {
    mint: { bg: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', hover: '#059669' },
    burn: { bg: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)', hover: '#ea580c' },
    transfer: { bg: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)', hover: '#7c3aed' },
    default: { bg: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', hover: '#2563eb' },
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        background: disabled ? '#374151' : variants[variant].bg,
        border: 'none',
        borderRadius: '12px',
        padding: '16px 24px',
        color: 'white',
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        fontSize: '15px',
        fontWeight: 600,
        fontFamily: "'DM Sans', sans-serif",
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        opacity: disabled ? 0.5 : 1,
        boxShadow: disabled ? 'none' : '0 4px 15px rgba(0,0,0,0.2)',
      }}
    >
      <Icon />
      {label}
    </button>
  );
};

// Modal Component
const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.8)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      animation: 'fadeIn 0.2s ease',
    }}>
      <div style={{
        background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)',
        borderRadius: '24px',
        padding: '32px',
        width: '100%',
        maxWidth: '440px',
        margin: '20px',
        boxShadow: '0 25px 80px rgba(0,0,0,0.5)',
        border: '1px solid rgba(255,255,255,0.1)',
        animation: 'slideUp 0.3s ease',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 700 }}>{title}</h2>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              borderRadius: '10px',
              width: '36px',
              height: '36px',
              color: 'white',
              cursor: 'pointer',
              fontSize: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

// Input Component
const Input = ({ label, ...props }) => (
  <div style={{ marginBottom: '20px' }}>
    <label style={{ 
      display: 'block', 
      marginBottom: '8px', 
      fontSize: '14px', 
      fontWeight: 500,
      opacity: 0.8,
    }}>
      {label}
    </label>
    <input
      {...props}
      style={{
        width: '100%',
        padding: '14px 16px',
        background: 'rgba(0,0,0,0.3)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '12px',
        color: 'white',
        fontSize: '16px',
        fontFamily: "'Space Mono', monospace",
        outline: 'none',
        transition: 'border-color 0.2s',
        boxSizing: 'border-box',
      }}
    />
  </div>
);

// Select Component
const Select = ({ label, options, ...props }) => (
  <div style={{ marginBottom: '20px' }}>
    <label style={{ 
      display: 'block', 
      marginBottom: '8px', 
      fontSize: '14px', 
      fontWeight: 500,
      opacity: 0.8,
    }}>
      {label}
    </label>
    <select
      {...props}
      style={{
        width: '100%',
        padding: '14px 16px',
        background: 'rgba(0,0,0,0.3)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '12px',
        color: 'white',
        fontSize: '16px',
        fontFamily: "'DM Sans', sans-serif",
        outline: 'none',
        cursor: 'pointer',
        boxSizing: 'border-box',
      }}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value} style={{ background: '#1e293b' }}>
          {opt.label}
        </option>
      ))}
    </select>
  </div>
);

// Transaction Item Component
const TransactionItem = ({ tx }) => {
  const typeConfig = {
    MINT: { color: '#10b981', icon: '↓', label: 'Minted' },
    BURN: { color: '#f97316', icon: '↑', label: 'Burned' },
    TRANSFER: { color: '#8b5cf6', icon: '→', label: 'Transfer' },
  };

  const config = typeConfig[tx.transaction_type] || typeConfig.TRANSFER;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '16px 20px',
      background: 'rgba(0,0,0,0.2)',
      borderRadius: '12px',
      marginBottom: '10px',
      border: '1px solid rgba(255,255,255,0.05)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '10px',
          background: `${config.color}20`,
          color: config.color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '20px',
          fontWeight: 'bold',
        }}>
          {config.icon}
        </div>
        <div>
          <div style={{ fontWeight: 600, marginBottom: '4px' }}>{config.label}</div>
          <div style={{ fontSize: '12px', opacity: 0.5, fontFamily: "'Space Mono', monospace" }}>
            {formatDate(tx.timestamp)}
          </div>
        </div>
      </div>
      <div style={{ 
        textAlign: 'right',
        fontFamily: "'Space Mono', monospace",
        fontWeight: 600,
        color: config.color,
      }}>
        {tx.transaction_type === 'BURN' ? '-' : '+'}${formatUSD(tx.amount)}
      </div>
    </div>
  );
};

// Main App Component
export default function USDCWalletDashboard() {
  const [wallets, setWallets] = useState([]);
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [totalSupply, setTotalSupply] = useState(0);
  const [toast, setToast] = useState(null);
  
  // Modal states
  const [showCreateWallet, setShowCreateWallet] = useState(false);
  const [showMint, setShowMint] = useState(false);
  const [showBurn, setShowBurn] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  
  // Form states
  const [newWalletName, setNewWalletName] = useState('');
  const [mintAmount, setMintAmount] = useState('');
  const [burnAmount, setBurnAmount] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferTo, setTransferTo] = useState('');

  const api = useApi();

  // Load initial data
  useEffect(() => {
    loadSupply();
    loadAllTransactions();
  }, []);

  const loadSupply = async () => {
    try {
      const data = await api.call('/supply');
      setTotalSupply(data.total_supply);
    } catch (err) {
      console.error('Failed to load supply:', err);
    }
  };

  const loadAllTransactions = async () => {
    try {
      const data = await api.call('/transactions?limit=20');
      setTransactions(data.transactions);
    } catch (err) {
      console.error('Failed to load transactions:', err);
    }
  };

  const loadWalletTransactions = async (walletId) => {
    try {
      const data = await api.call(`/wallets/${walletId}/transactions`);
      setTransactions(data.transactions);
    } catch (err) {
      console.error('Failed to load wallet transactions:', err);
    }
  };

  const refreshWallet = async (walletId) => {
    try {
      const data = await api.call(`/wallets/${walletId}`);
      setWallets(prev => prev.map(w => w.wallet_id === walletId ? data : w));
      if (selectedWallet?.wallet_id === walletId) {
        setSelectedWallet(data);
      }
    } catch (err) {
      console.error('Failed to refresh wallet:', err);
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  // Actions
  const createWallet = async () => {
    if (!newWalletName.trim()) return;
    try {
      const wallet = await api.call('/wallets', {
        method: 'POST',
        body: JSON.stringify({ owner_name: newWalletName }),
      });
      setWallets(prev => [...prev, wallet]);
      setSelectedWallet(wallet);
      setNewWalletName('');
      setShowCreateWallet(false);
      showToast(`Wallet created for ${wallet.owner_name}`);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const mintTokens = async () => {
    if (!selectedWallet || !mintAmount) return;
    try {
      await api.call('/mint', {
        method: 'POST',
        body: JSON.stringify({
          wallet_id: selectedWallet.wallet_id,
          amount: parseFloat(mintAmount),
        }),
      });
      await refreshWallet(selectedWallet.wallet_id);
      await loadSupply();
      await loadWalletTransactions(selectedWallet.wallet_id);
      setMintAmount('');
      setShowMint(false);
      showToast(`Minted $${formatUSD(mintAmount)} USDC`);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const burnTokens = async () => {
    if (!selectedWallet || !burnAmount) return;
    try {
      await api.call('/burn', {
        method: 'POST',
        body: JSON.stringify({
          wallet_id: selectedWallet.wallet_id,
          amount: parseFloat(burnAmount),
        }),
      });
      await refreshWallet(selectedWallet.wallet_id);
      await loadSupply();
      await loadWalletTransactions(selectedWallet.wallet_id);
      setBurnAmount('');
      setShowBurn(false);
      showToast(`Burned $${formatUSD(burnAmount)} USDC`);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const transferTokens = async () => {
    if (!selectedWallet || !transferTo || !transferAmount) return;
    try {
      const result = await api.call('/transfers', {
        method: 'POST',
        body: JSON.stringify({
          from_wallet_id: selectedWallet.wallet_id,
          to_wallet_id: transferTo,
          amount: parseFloat(transferAmount),
          idempotency_key: generateIdempotencyKey(),
        }),
      });
      await refreshWallet(selectedWallet.wallet_id);
      await refreshWallet(transferTo);
      await loadWalletTransactions(selectedWallet.wallet_id);
      setTransferAmount('');
      setTransferTo('');
      setShowTransfer(false);
      
      if (result.idempotent) {
        showToast('Duplicate request detected - no transfer made', 'error');
      } else {
        showToast(`Transferred $${formatUSD(transferAmount)} USDC`);
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const selectWallet = (wallet) => {
    setSelectedWallet(wallet);
    loadWalletTransactions(wallet.wallet_id);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #020617 50%, #0f172a 100%)',
      color: 'white',
      fontFamily: "'DM Sans', sans-serif",
      padding: '0',
      margin: '0',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap');
        
        * { box-sizing: border-box; }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: rgba(0,0,0,0.2); border-radius: 4px; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
        
        button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0,0,0,0.3);
        }
        
        input:focus, select:focus {
          border-color: #3b82f6 !important;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
        }
      `}</style>

      {/* Header */}
      <header style={{
        padding: '24px 40px',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'rgba(0,0,0,0.2)',
        backdropFilter: 'blur(20px)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ 
            color: '#3b82f6', 
            display: 'flex', 
            alignItems: 'center',
            filter: 'drop-shadow(0 0 10px rgba(59, 130, 246, 0.5))',
          }}>
            <Icons.Circle />
          </div>
          <div>
            <div style={{ 
              fontSize: '22px', 
              fontWeight: 700, 
              letterSpacing: '-0.5px',
              background: 'linear-gradient(135deg, #fff 0%, #94a3b8 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              USDC Wallet
            </div>
            <div style={{ fontSize: '12px', opacity: 0.5, letterSpacing: '1px' }}>
              STABLECOIN SIMULATOR
            </div>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '12px',
            padding: '12px 20px',
          }}>
            <div style={{ fontSize: '11px', opacity: 0.7, marginBottom: '2px', letterSpacing: '0.5px' }}>
              TOTAL SUPPLY
            </div>
            <div style={{ 
              fontSize: '20px', 
              fontWeight: 700, 
              color: '#10b981',
              fontFamily: "'Space Mono', monospace",
            }}>
              ${formatUSD(totalSupply)}
            </div>
          </div>
        </div>
      </header>

      <main style={{ padding: '40px', maxWidth: '1400px', margin: '0 auto' }}>
        {/* Action Buttons */}
        <div style={{ 
          display: 'flex', 
          gap: '12px', 
          marginBottom: '40px',
          flexWrap: 'wrap',
        }}>
          <ActionButton 
            icon={Icons.Wallet} 
            label="New Wallet" 
            onClick={() => setShowCreateWallet(true)} 
          />
          <ActionButton 
            icon={Icons.Mint} 
            label="Mint USDC" 
            variant="mint"
            onClick={() => setShowMint(true)}
            disabled={!selectedWallet}
          />
          <ActionButton 
            icon={Icons.Burn} 
            label="Burn USDC" 
            variant="burn"
            onClick={() => setShowBurn(true)}
            disabled={!selectedWallet}
          />
          <ActionButton 
            icon={Icons.Send} 
            label="Transfer" 
            variant="transfer"
            onClick={() => setShowTransfer(true)}
            disabled={!selectedWallet || wallets.length < 2}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
          {/* Wallets Section */}
          <section>
            <h2 style={{ 
              fontSize: '14px', 
              fontWeight: 600, 
              opacity: 0.5, 
              marginBottom: '20px',
              letterSpacing: '1px',
            }}>
              WALLETS ({wallets.length})
            </h2>
            
            {wallets.length === 0 ? (
              <div style={{
                background: 'rgba(255,255,255,0.02)',
                border: '2px dashed rgba(255,255,255,0.1)',
                borderRadius: '16px',
                padding: '60px 40px',
                textAlign: 'center',
              }}>
                <div style={{ opacity: 0.3, marginBottom: '16px' }}>
                  <Icons.Wallet />
                </div>
                <div style={{ opacity: 0.5, marginBottom: '20px' }}>
                  No wallets yet. Create one to get started!
                </div>
                <button
                  onClick={() => setShowCreateWallet(true)}
                  style={{
                    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '12px 24px',
                    color: 'white',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '14px',
                  }}
                >
                  Create Wallet
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {wallets.map((wallet) => (
                  <WalletCard
                    key={wallet.wallet_id}
                    wallet={wallet}
                    isSelected={selectedWallet?.wallet_id === wallet.wallet_id}
                    onClick={() => selectWallet(wallet)}
                    onCopy={() => showToast('Wallet ID copied!')}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Transactions Section */}
          <section>
            <h2 style={{ 
              fontSize: '14px', 
              fontWeight: 600, 
              opacity: 0.5, 
              marginBottom: '20px',
              letterSpacing: '1px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              <Icons.History />
              {selectedWallet ? `${selectedWallet.owner_name.toUpperCase()}'S TRANSACTIONS` : 'RECENT TRANSACTIONS'}
            </h2>
            
            <div style={{
              background: 'rgba(0,0,0,0.2)',
              borderRadius: '20px',
              padding: '20px',
              border: '1px solid rgba(255,255,255,0.05)',
              maxHeight: '500px',
              overflowY: 'auto',
            }}>
              {transactions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', opacity: 0.4 }}>
                  No transactions yet
                </div>
              ) : (
                transactions.map((tx) => (
                  <TransactionItem key={tx.transaction_id} tx={tx} />
                ))
              )}
            </div>
          </section>
        </div>
      </main>

      {/* Create Wallet Modal */}
      <Modal isOpen={showCreateWallet} onClose={() => setShowCreateWallet(false)} title="Create New Wallet">
        <Input
          label="Owner Name"
          placeholder="Enter wallet owner name"
          value={newWalletName}
          onChange={(e) => setNewWalletName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && createWallet()}
        />
        <button
          onClick={createWallet}
          disabled={!newWalletName.trim() || api.loading}
          style={{
            width: '100%',
            padding: '16px',
            background: api.loading ? '#374151' : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
            border: 'none',
            borderRadius: '12px',
            color: 'white',
            fontSize: '16px',
            fontWeight: 600,
            cursor: api.loading ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
          }}
        >
          {api.loading ? 'Creating...' : 'Create Wallet'}
        </button>
      </Modal>

      {/* Mint Modal */}
      <Modal isOpen={showMint} onClose={() => setShowMint(false)} title="Mint USDC">
        <div style={{ 
          background: 'rgba(16, 185, 129, 0.1)', 
          borderRadius: '12px', 
          padding: '16px',
          marginBottom: '20px',
          border: '1px solid rgba(16, 185, 129, 0.2)',
        }}>
          <div style={{ fontSize: '13px', opacity: 0.7, marginBottom: '4px' }}>Minting to</div>
          <div style={{ fontWeight: 600 }}>{selectedWallet?.owner_name}</div>
        </div>
        <Input
          label="Amount (USDC)"
          type="number"
          placeholder="0.00"
          value={mintAmount}
          onChange={(e) => setMintAmount(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && mintTokens()}
        />
        <button
          onClick={mintTokens}
          disabled={!mintAmount || api.loading}
          style={{
            width: '100%',
            padding: '16px',
            background: api.loading ? '#374151' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            border: 'none',
            borderRadius: '12px',
            color: 'white',
            fontSize: '16px',
            fontWeight: 600,
            cursor: api.loading ? 'not-allowed' : 'pointer',
          }}
        >
          {api.loading ? 'Minting...' : `Mint $${formatUSD(mintAmount || 0)} USDC`}
        </button>
      </Modal>

      {/* Burn Modal */}
      <Modal isOpen={showBurn} onClose={() => setShowBurn(false)} title="Burn USDC">
        <div style={{ 
          background: 'rgba(249, 115, 22, 0.1)', 
          borderRadius: '12px', 
          padding: '16px',
          marginBottom: '20px',
          border: '1px solid rgba(249, 115, 22, 0.2)',
        }}>
          <div style={{ fontSize: '13px', opacity: 0.7, marginBottom: '4px' }}>Burning from</div>
          <div style={{ fontWeight: 600 }}>{selectedWallet?.owner_name}</div>
          <div style={{ fontSize: '13px', opacity: 0.7, marginTop: '8px' }}>
            Available: ${formatUSD(selectedWallet?.balance || 0)}
          </div>
        </div>
        <Input
          label="Amount (USDC)"
          type="number"
          placeholder="0.00"
          value={burnAmount}
          onChange={(e) => setBurnAmount(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && burnTokens()}
        />
        <button
          onClick={burnTokens}
          disabled={!burnAmount || api.loading}
          style={{
            width: '100%',
            padding: '16px',
            background: api.loading ? '#374151' : 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
            border: 'none',
            borderRadius: '12px',
            color: 'white',
            fontSize: '16px',
            fontWeight: 600,
            cursor: api.loading ? 'not-allowed' : 'pointer',
          }}
        >
          {api.loading ? 'Burning...' : `Burn $${formatUSD(burnAmount || 0)} USDC`}
        </button>
      </Modal>

      {/* Transfer Modal */}
      <Modal isOpen={showTransfer} onClose={() => setShowTransfer(false)} title="Transfer USDC">
        <div style={{ 
          background: 'rgba(139, 92, 246, 0.1)', 
          borderRadius: '12px', 
          padding: '16px',
          marginBottom: '20px',
          border: '1px solid rgba(139, 92, 246, 0.2)',
        }}>
          <div style={{ fontSize: '13px', opacity: 0.7, marginBottom: '4px' }}>Sending from</div>
          <div style={{ fontWeight: 600 }}>{selectedWallet?.owner_name}</div>
          <div style={{ fontSize: '13px', opacity: 0.7, marginTop: '8px' }}>
            Available: ${formatUSD(selectedWallet?.balance || 0)}
          </div>
        </div>
        <Select
          label="To Wallet"
          value={transferTo}
          onChange={(e) => setTransferTo(e.target.value)}
          options={[
            { value: '', label: 'Select recipient...' },
            ...wallets
              .filter(w => w.wallet_id !== selectedWallet?.wallet_id)
              .map(w => ({ value: w.wallet_id, label: w.owner_name }))
          ]}
        />
        <Input
          label="Amount (USDC)"
          type="number"
          placeholder="0.00"
          value={transferAmount}
          onChange={(e) => setTransferAmount(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && transferTokens()}
        />
        <button
          onClick={transferTokens}
          disabled={!transferTo || !transferAmount || api.loading}
          style={{
            width: '100%',
            padding: '16px',
            background: api.loading ? '#374151' : 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
            border: 'none',
            borderRadius: '12px',
            color: 'white',
            fontSize: '16px',
            fontWeight: 600,
            cursor: api.loading ? 'not-allowed' : 'pointer',
          }}
        >
          {api.loading ? 'Transferring...' : `Transfer $${formatUSD(transferAmount || 0)} USDC`}
        </button>
      </Modal>

      {/* Toast */}
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}
    </div>
  );
}