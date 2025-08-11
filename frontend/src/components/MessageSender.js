import React, { useState, useRef, useEffect } from 'react';

const MessageSender = ({ onSendMessage, selectedContact, disabled, isLoading }) => {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');
  const textareaRef = useRef(null);

  useEffect(() => {
    // Clear message when switching contacts
    setMessage('');
    setError('');
  }, [selectedContact]);

  useEffect(() => {
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [message]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!message.trim() || !selectedContact || isSending || disabled) {
      return;
    }

    setError('');
    setIsSending(true);

    try {
      await onSendMessage(selectedContact, message.trim());
      setMessage('');
      
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setError(error.message || 'Failed to send message');
    }

    setIsSending(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const formatAddress = (address) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const canSend = !disabled && !isLoading && !isSending && message.trim() && selectedContact;

  return (
    <div className="message-sender">
      {selectedContact && (
        <div className="chat-header">
          <div className="contact-info">
            <div className="contact-avatar">
              {formatAddress(selectedContact).slice(0, 2)}
            </div>
            <div className="contact-details">
              <div className="contact-name">
                {formatAddress(selectedContact)}
              </div>
              <div className="contact-status">
                <span className="status-indicator active"></span>
                <span>On Fluent Network</span>
              </div>
            </div>
          </div>
          
          <div className="chat-actions">
            <button 
              className="btn-icon" 
              title="View on Explorer"
              onClick={() => window.open(`https://testnet.fluentscan.xyz/address/${selectedContact}`, '_blank')}
            >
              🔍
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="error-bar">
          <span className="error-icon">⚠️</span>
          <span className="error-text">{error}</span>
          <button 
            className="error-close"
            onClick={() => setError('')}
          >
            ✖️
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="message-input-form">
        <div className="message-input-container">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={
              selectedContact 
                ? "Type a message..." 
                : "Select a contact to start messaging"
            }
            disabled={disabled || isLoading || isSending || !selectedContact}
            className="message-input"
            rows={1}
            maxLength={1000}
          />
          
          <div className="input-actions">
            <div className="character-count">
              <span className={message.length > 900 ? 'warning' : ''}>
                {message.length}/1000
              </span>
            </div>
            
            <button
              type="submit"
              className={`send-button ${canSend ? 'active' : 'disabled'}`}
              disabled={!canSend}
              title={
                !selectedContact 
                  ? "Select a contact first"
                  : !message.trim()
                  ? "Type a message"
                  : isSending
                  ? "Sending..."
                  : "Send message"
              }
            >
              {isSending ? (
                <div className="sending-animation">
                  <div className="spinner small"></div>
                </div>
              ) : (
                <span className="send-icon">📤</span>
              )}
            </button>
          </div>
        </div>

        {message.trim() && (
          <div className="message-preview">
            <small>
              💰 <strong>Gas required:</strong> Sending this message will require a small gas fee
            </small>
          </div>
        )}
      </form>

      {!selectedContact && (
        <div className="no-contact-selected">
          <div className="no-contact-message">
            <span className="icon">👈</span>
            <span>Select a contact from the sidebar to start messaging</span>
          </div>
        </div>
      )}

      {disabled && selectedContact && (
        <div className="sender-disabled">
          <div className="disabled-message">
            <span className="icon">🔐</span>
            <span>Please connect your wallet to send messages</span>
          </div>
        </div>
      )}

      {isLoading && selectedContact && (
        <div className="sender-loading">
          <div className="loading-message">
            <div className="spinner small"></div>
            <span>Loading conversation...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageSender;
