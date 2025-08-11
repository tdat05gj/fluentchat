import React, { useState, useEffect } from 'react';

const KeyRegistration = ({ onRegister, isLoading, currentUser }) => {
  const [publicKey, setPublicKey] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Automatically set the wallet address as public key
  useEffect(() => {
    if (currentUser) {
      setPublicKey(currentUser);
    }
  }, [currentUser]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Use wallet address as public key
    const keyToRegister = currentUser || publicKey.trim();
    
    if (!keyToRegister) {
      setError('Wallet address not found. Please reconnect your wallet.');
      return;
    }

    setIsSubmitting(true);
    
    try {
      await onRegister(keyToRegister);
    } catch (error) {
      setError(error.message || 'Failed to register public key');
    }
    
    setIsSubmitting(false);
  };

  const useWalletAddress = () => {
    if (currentUser) {
      setPublicKey(currentUser);
    }
  };

  return (
    <div className="key-registration-overlay">
      <div className="key-registration-modal">
        <div className="modal-header">
          <h2>🔐 Register Wallet Address</h2>
          <p>Your wallet address will be used as a public key for secure messaging on the blockchain.</p>
        </div>
        
        <form onSubmit={handleSubmit} className="registration-form">
          <div className="form-group">
            <label htmlFor="publicKey">Your Wallet Address (Public Key):</label>
            <textarea
              id="publicKey"
              value={publicKey}
              onChange={(e) => setPublicKey(e.target.value)}
              placeholder="Wallet address will appear here..."
              rows={3}
              disabled={isSubmitting}
              className={error ? 'error' : ''}
              readOnly
            />
            <small className="help-text">
              This is your wallet address, which will be used as a unique identifier for messaging.
            </small>
          </div>

          {error && (
            <div className="error-message">
              <span>⚠️ {error}</span>
            </div>
          )}

          <div className="form-actions">
            <button
              type="button"
              onClick={useWalletAddress}
              className="btn-secondary"
              disabled={isSubmitting}
            >
              Use Wallet Address
            </button>
            
            <button
              type="submit"
              className="btn-primary"
              disabled={isSubmitting || !publicKey.trim()}
            >
              {isSubmitting ? (
                <span>
                  <span className="spinner"></span>
                  Registering...
                </span>
              ) : (
                'Register Wallet Address'
              )}
            </button>
          </div>
        </form>

        <div className="registration-info">
          <h3>📋 What happens next?</h3>
          <ul>
            <li>✅ Your public key will be stored on the Fluent blockchain</li>
            <li>🔒 This enables secure messaging with other users</li>
            <li>💸 A small gas fee will be required for the transaction</li>
            <li>⏱️ The registration process may take a few moments</li>
          </ul>
          
          <div className="faucet-info">
            <h4>💰 Need testnet ETH?</h4>
            <p>If you don't have enough ETH for gas fees, get free testnet ETH from the faucet:</p>
            <a 
              href="https://testnet.gblend.xyz/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="faucet-link"
            >
              🚰 Get Free Testnet ETH
            </a>
          </div>
        </div>

        {isLoading && (
          <div className="loading-overlay">
            <div className="loading-spinner">
              <div className="spinner large"></div>
              <p>Connecting to blockchain...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default KeyRegistration;
