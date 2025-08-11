import React, { useState, useEffect } from 'react';

const ErrorPanel = ({ errors, onDismiss, className = '' }) => {
  const [visibleErrors, setVisibleErrors] = useState([]);

  useEffect(() => {
    if (errors && errors.length > 0) {
      setVisibleErrors(errors);
    }
  }, [errors]);

  const handleDismiss = (errorId) => {
    if (onDismiss) {
      onDismiss(errorId);
    }
    setVisibleErrors(prev => prev.filter(error => error.id !== errorId));
  };

  const getErrorIcon = (type, severity) => {
    // First check severity for success messages
    if (severity === 'success') {
      return '✅';
    }
    
    switch (type) {
      case 'wallet':
        return '👛';
      case 'network':
        return '🌐';
      case 'contract':
        return '📄';
      case 'transaction':
        return '💸';
      case 'validation':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return '❌';
    }
  };

  const getErrorClass = (severity) => {
    switch (severity) {
      case 'warning':
        return 'warning';
      case 'info':
        return 'info';
      case 'success':
        return 'success';
      default:
        return 'error';
    }
  };

  const getActionButton = (error) => {
    switch (error.type) {
      case 'wallet':
        return (
          <button 
            className="error-action-btn"
            onClick={() => window.location.reload()}
          >
            Reconnect Wallet
          </button>
        );
      case 'network':
        return (
          <button 
            className="error-action-btn"
            onClick={() => {
              if (window.ethereum) {
                window.ethereum.request({
                  method: 'wallet_switchEthereumChain',
                  params: [{ chainId: '0x51ea' }], // Fluent Testnet
                });
              }
            }}
          >
            Switch Network
          </button>
        );
      case 'contract':
        return (
          <button 
            className="error-action-btn"
            onClick={() => window.location.reload()}
          >
            Refresh App
          </button>
        );
      default:
        return null;
    }
  };

  if (!visibleErrors || visibleErrors.length === 0) {
    return null;
  }

  return (
    <div className={`error-panel ${className}`}>
      {visibleErrors.map((error) => (
        <div 
          key={error.id} 
          className={`error-item ${getErrorClass(error.severity)}`}
        >
          <div className="error-content">
            <div className="error-header">
              <span className="error-icon">
                {getErrorIcon(error.type, error.severity)}
              </span>
              <div className="error-text">
                <div className="error-title">
                  {error.title || 'Error'}
                </div>
                <div className="error-message">
                  {error.message}
                </div>
              </div>
            </div>

            {error.details && (
              <div className="error-details">
                <details>
                  <summary>More details</summary>
                  <pre>{JSON.stringify(error.details, null, 2)}</pre>
                </details>
              </div>
            )}

            <div className="error-actions">
              {getActionButton(error)}
              
              <button 
                className="error-dismiss-btn"
                onClick={() => handleDismiss(error.id)}
                title="Dismiss"
              >
                ✖️
              </button>
            </div>
          </div>

          {error.autoRemove !== false && (
            <div className="error-timer">
              <div className="timer-bar"></div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

// Hook for managing errors
export const useErrors = () => {
  const [errors, setErrors] = useState([]);

  const addError = (errorData) => {
    const error = {
      id: Date.now() + Math.random(),
      timestamp: new Date(),
      severity: 'error',
      autoRemove: true,
      ...errorData
    };

    setErrors(prev => [...prev, error]);

    // Auto-remove after 10 seconds unless disabled
    if (error.autoRemove !== false) {
      setTimeout(() => {
        setErrors(prev => prev.filter(e => e.id !== error.id));
      }, 10000);
    }

    return error.id;
  };

  const removeError = (errorId) => {
    setErrors(prev => prev.filter(error => error.id !== errorId));
  };

  const clearErrors = () => {
    setErrors([]);
  };

  // Common error helpers
  const addWalletError = (message, details = null) => {
    return addError({
      type: 'wallet',
      title: 'Wallet Error',
      message,
      details,
      severity: 'error'
    });
  };

  const addNetworkError = (message, details = null) => {
    return addError({
      type: 'network',
      title: 'Network Error',
      message,
      details,
      severity: 'error'
    });
  };

  const addContractError = (message, details = null) => {
    return addError({
      type: 'contract',
      title: 'Contract Error',
      message,
      details,
      severity: 'error'
    });
  };

  const addTransactionError = (message, details = null) => {
    return addError({
      type: 'transaction',
      title: 'Transaction Error',
      message,
      details,
      severity: 'error'
    });
  };

  const addValidationError = (message, details = null) => {
    return addError({
      type: 'validation',
      title: 'Validation Error',
      message,
      details,
      severity: 'warning'
    });
  };

  const addSuccess = (message, title = 'Success') => {
    return addError({
      type: 'success',
      title,
      message,
      severity: 'success'
    });
  };

  const addInfo = (message, title = 'Information') => {
    return addError({
      type: 'info',
      title,
      message,
      severity: 'info'
    });
  };

  return {
    errors,
    addError,
    removeError,
    clearErrors,
    addWalletError,
    addNetworkError,
    addContractError,
    addTransactionError,
    addValidationError,
    addSuccess,
    addInfo
  };
};

export default ErrorPanel;
