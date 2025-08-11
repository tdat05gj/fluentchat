import React, { useState, useEffect } from 'react';
import './App.css';

// Components
import KeyRegistration from './components/KeyRegistration';
import ChatRoom from './components/ChatRoom';
import ErrorPanel, { useErrors } from './components/ErrorPanel';

// Utils
import walletManager from './utils/wallet';
import contractManager from './utils/contract';

function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [hasPublicKey, setHasPublicKey] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showRegistration, setShowRegistration] = useState(false);
  const [contract, setContract] = useState(null);

  const {
    errors,
    removeError,
    addWalletError,
    addNetworkError,
    addContractError,
    addSuccess,
    addInfo
  } = useErrors();

  useEffect(() => {
    checkConnection();
  }, []);

  useEffect(() => {
    if (isConnected && currentUser && contract) {
      checkPublicKeyRegistration();
    }
  }, [isConnected, currentUser, contract]);

  // Auto-clear wallet errors when connected
  useEffect(() => {
    if (isConnected) {
      // Clear wallet errors after successful connection
      setTimeout(() => {
        errors.forEach(error => {
          if (error.type === 'wallet') {
            removeError(error.id);
          }
        });
      }, 2000); // Clear after 2 seconds
    }
  }, [isConnected, errors, removeError]);

  const checkConnection = async () => {
    try {
      setIsLoading(true);
      
      // Check if Web3 wallet is installed
      if (!window.ethereum) {
        addWalletError('Web3 wallet (like MetaMask) is required to use this dApp.');
        return;
      }

      // Check if already connected (for page refresh)
      const isAlreadyConnected = await walletManager.checkExistingConnection();
      if (isAlreadyConnected) {
        setCurrentUser(walletManager.account);
        setIsConnected(true);
        
        // Initialize contract
        const contractInstance = await contractManager.initializeContract(
          walletManager.provider, 
          walletManager.signer
        );
        setContract(contractInstance);
        
        return;
      }

    } catch (error) {
      console.error('Error checking connection:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWalletConnection = async () => {
    try {
      setIsLoading(true);

      // Connect wallet
      const { account, provider, signer } = await walletManager.connectWallet();
      setCurrentUser(account);
      setIsConnected(true);

      // Clear any existing wallet errors
      errors.forEach(error => {
        if (error.type === 'wallet') {
          removeError(error.id);
        }
      });

      // Initialize contract
      const contractInstance = await contractManager.initializeContract(provider, signer);
      setContract(contractInstance);

    } catch (error) {
      console.error('Wallet connection error:', error);
      
      if (error.message.includes('MetaMask')) {
        addWalletError('MetaMask is required to use this dApp.');
      } else if (error.message.includes('User rejected')) {
        addWalletError('Connection request was rejected. Please try again.');
      } else if (error.message.includes('Contract not deployed')) {
        addContractError('Smart contract not found.');
      } else {
        addWalletError('Failed to connect wallet. Please try again.');
      }
      
      // Reset state on error
      setIsConnected(false);
      setCurrentUser(null);
      setContract(null);
    } finally {
      setIsLoading(false);
    }
  };

  const checkPublicKeyRegistration = async () => {
    try {
      const hasKey = await contractManager.hasPublicKey(currentUser);
      setHasPublicKey(hasKey);
      
      if (!hasKey) {
        setShowRegistration(true);
        addInfo('Please register your public key to start messaging.', 'Registration Required');
      } else {
        setShowRegistration(false);
      }
    } catch (error) {
      console.error('Error checking public key:', error);
      addContractError('Failed to check registration status');
    }
  };

  const handleKeyRegistration = async (publicKey) => {
    try {
      setIsLoading(true);
      addInfo('Registering your public key...', 'Registration');

      const result = await contractManager.registerPublicKey(publicKey);
      
      setHasPublicKey(true);
      setShowRegistration(false);
      
      addSuccess('Public key registered successfully! You can now start messaging.', 'Registration Complete');
      
    } catch (error) {
      console.error('Public key registration error:', error);
      
      if (error.message.includes('already registered')) {
        addContractError('Public key is already registered.');
        setHasPublicKey(true);
        setShowRegistration(false);
      } else if (error.message.includes('rejected')) {
        addWalletError('Transaction was rejected. Please try again.');
      } else {
        addContractError(error.message || 'Failed to register public key');
      }
      
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    walletManager.disconnect();
    contractManager.removeAllListeners();
    
    setIsConnected(false);
    setCurrentUser(null);
    setHasPublicKey(false);
    setShowRegistration(false);
    setContract(null);
    
    addInfo('Wallet disconnected successfully.', 'Disconnected');
  };

  const formatAddress = (address) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="App">
      {/* Only show errors if not connected successfully */}
      {(!isConnected || errors.filter(e => e.type !== 'wallet').length > 0) && (
        <ErrorPanel 
          errors={isConnected ? errors.filter(e => e.type !== 'wallet') : errors} 
          onDismiss={removeError} 
          className="app-errors" 
        />
      )}
      
      <header className="app-header">
        <div className="header-content">
          <div className="app-title">
            <h1>💬 Fluent Messenger</h1>
            <span className="app-subtitle">Decentralized messaging on Fluent Network</span>
          </div>
          
          <div className="header-info">
            <div className="network-badge">
              <span className="network-indicator"></span>
              Fluent Testnet
            </div>
            
            {currentUser && (
              <div className="user-badge">
                <span className="user-avatar">
                  {formatAddress(currentUser).slice(0, 2)}
                </span>
                <span className="user-address">
                  {formatAddress(currentUser)}
                </span>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="app-main">
        {!isConnected ? (
          <div className="welcome-screen">
            <div className="welcome-content">
              <div className="welcome-hero">
                <h2>🚀 Welcome to Fluent Messenger</h2>
                <p>A decentralized messaging application built on the Fluent blockchain network.</p>
                
                <div className="features-grid">
                  <div className="feature-card">
                    <div className="feature-icon">🔒</div>
                    <h3>Secure & Private</h3>
                    <p>Messages are encrypted and stored on the blockchain</p>
                  </div>
                  
                  <div className="feature-card">
                    <div className="feature-icon">⚡</div>
                    <h3>Real-Time</h3>
                    <p>Instant synchronization across all devices</p>
                  </div>
                  
                  <div className="feature-card">
                    <div className="feature-icon">🌐</div>
                    <h3>Decentralized</h3>
                    <p>No central servers, powered by blockchain</p>
                  </div>
                  
                  <div className="feature-card">
                    <div className="feature-icon">💎</div>
                    <h3>Permanent</h3>
                    <p>Your messages are stored permanently on-chain</p>
                  </div>
                </div>

                <button 
                  className="connect-wallet-btn"
                  onClick={handleWalletConnection}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span>
                      <span className="spinner"></span>
                      Connecting...
                    </span>
                  ) : (
                    <span>
                      🔗 Connect Wallet
                    </span>
                  )}
                </button>

                <div className="connection-requirements">
                  <h4>📋 Requirements:</h4>
                  <ul>
                    <li>✓ Web3 wallet extension (MetaMask, etc.) installed</li>
                    <li>✓ Connected to Fluent Testnet (Chain ID: 20994)</li>
                    <li>✓ Small amount of ETH for gas fees</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        ) : showRegistration ? (
          <KeyRegistration 
            onRegister={handleKeyRegistration}
            isLoading={isLoading}
            currentUser={currentUser}
          />
        ) : hasPublicKey ? (
          <ChatRoom 
            contractManager={contractManager}
            walletManager={walletManager}
            currentUser={currentUser}
            onLogout={handleLogout}
          />
        ) : (
          <div className="loading-screen">
            <div className="loading-content">
              <div className="spinner large"></div>
              <h3>Loading your account...</h3>
              <p>Please wait while we check your registration status.</p>
            </div>
          </div>
        )}
      </main>

      <footer className="app-footer">
        <div className="footer-content">
          <div className="footer-links">
            <a href="https://fluent.xyz" target="_blank" rel="noopener noreferrer">
              About Fluent
            </a>
            <a href="https://testnet.fluentscan.xyz" target="_blank" rel="noopener noreferrer">
              Explorer
            </a>
            <a href="https://docs.fluent.xyz" target="_blank" rel="noopener noreferrer">
              Documentation
            </a>
            <a href="https://testnet.gblend.xyz/" target="_blank" rel="noopener noreferrer" className="faucet-link">
              🚰 Faucet
            </a>
          </div>
          
          <div className="footer-info">
            <span>Built with ❤️ for Fluent Network</span>
            {contract && (
              <span>
                Contract: <a 
                  href={contractManager.getExplorerUrl()} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="contract-link"
                >
                  {contractManager.getContractAddress()?.slice(0, 8)}...
                </a>
              </span>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
