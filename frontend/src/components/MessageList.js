import React, { useEffect, useRef, useState } from 'react';

const MessageList = ({ messages, currentUser, selectedContact, isLoading }) => {
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const [wasNearBottom, setWasNearBottom] = useState(true);
  const [prevMessageCount, setPrevMessageCount] = useState(0);
  const [prevSelectedContact, setPrevSelectedContact] = useState(null);

  useEffect(() => {
    // When contact changes, scroll to bottom of new conversation
    if (selectedContact !== prevSelectedContact) {
      setPrevSelectedContact(selectedContact);
      setPrevMessageCount(messages.length);
      setWasNearBottom(true); // Reset to allow auto-scroll for new messages
      
      // Scroll to bottom of the new conversation
      if (selectedContact && messages.length > 0) {
        setTimeout(() => {
          scrollToBottom();
        }, 200); // Increased delay for better DOM readiness
      } else if (selectedContact) {
        // Even for empty conversations, scroll to bottom area
        setTimeout(() => {
          scrollToBottom();
        }, 200);
      }
      return;
    }
    
    // Only scroll if we have more messages than before AND user was near bottom
    const hasNewMessages = messages.length > prevMessageCount;
    
    if (hasNewMessages && wasNearBottom) {
      scrollToBottom();
    }
    
    setPrevMessageCount(messages.length);
  }, [messages, selectedContact, wasNearBottom, prevMessageCount, prevSelectedContact]);

  const scrollToBottom = () => {
    // Force scroll to bottom using multiple methods
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
    
    // Backup method using container scroll
    if (messagesContainerRef.current) {
      const container = messagesContainerRef.current;
      setTimeout(() => {
        container.scrollTop = container.scrollHeight;
      }, 50);
    }
  };

  const handleScroll = () => {
    if (!messagesContainerRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const isNearBottom = scrollTop + clientHeight >= scrollHeight - 100;
    setWasNearBottom(isNearBottom);
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.abs(now - date) / 36e5;

    if (diffInHours < 1) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 24) {
      return date.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else if (diffInHours < 168) { // Within a week
      return date.toLocaleDateString([], { 
        weekday: 'short', 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else {
      return date.toLocaleDateString([], { 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit', 
        minute: '2-digit' 
      });
    }
  };

  const formatAddress = (address) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const groupMessagesByDate = (messages) => {
    const groups = {};
    
    messages.forEach(message => {
      const date = new Date(message.timestamp);
      const dateKey = date.toDateString();
      
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      
      groups[dateKey].push(message);
    });
    
    return groups;
  };

  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isYesterday = (date) => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return date.toDateString() === yesterday.toDateString();
  };

  const formatDateHeader = (dateString) => {
    const date = new Date(dateString);
    
    if (isToday(date)) {
      return 'Today';
    } else if (isYesterday(date)) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString([], { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    }
  };

  if (isLoading) {
    return (
      <div className="message-list loading">
        <div className="loading-messages">
          <div className="spinner"></div>
          <p>Loading messages...</p>
        </div>
      </div>
    );
  }

  if (!selectedContact) {
    return (
      <div className="message-list empty">
        <div className="no-conversation">
          <div className="no-conversation-icon">💬</div>
          <h3>Welcome to Fluent Messaging</h3>
          <p>Select a contact from the sidebar to start a conversation</p>
          <div className="features-list">
            <div className="feature">
              <span className="feature-icon">🔒</span>
              <span>End-to-end encrypted on blockchain</span>
            </div>
            <div className="feature">
              <span className="feature-icon">⚡</span>
              <span>Real-time synchronization</span>
            </div>
            <div className="feature">
              <span className="feature-icon">🌐</span>
              <span>Decentralized on Fluent Network</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!messages || messages.length === 0) {
    return (
      <div className="message-list empty">
        <div className="no-messages">
          <div className="no-messages-icon">📝</div>
          <h4>No messages yet</h4>
          <p>Start the conversation with <strong>{formatAddress(selectedContact)}</strong></p>
          <small>Messages are stored securely on the blockchain</small>
        </div>
      </div>
    );
  }

  const messageGroups = groupMessagesByDate(messages);
  const sortedDates = Object.keys(messageGroups).sort((a, b) => new Date(a) - new Date(b));

  return (
    <div className="message-list" ref={messagesContainerRef} onScroll={handleScroll}>
      <div className="messages-container">
        {sortedDates.map(dateString => (
          <div key={dateString} className="message-group">
            <div className="date-header">
              <span className="date-label">{formatDateHeader(dateString)}</span>
            </div>
            
            {messageGroups[dateString].map((message, index) => {
              const isOwnMessage = message.sender.toLowerCase() === currentUser.toLowerCase();
              const prevMessage = index > 0 ? messageGroups[dateString][index - 1] : null;
              const showAvatar = !prevMessage || prevMessage.sender !== message.sender;
              
              return (
                <div
                  key={`${message.timestamp}-${index}`}
                  className={`message ${isOwnMessage ? 'sent' : 'received'} ${showAvatar ? 'show-avatar' : ''}`}
                >
                  {!isOwnMessage && showAvatar && (
                    <div className="message-avatar">
                      <div className="avatar">
                        {formatAddress(message.sender).slice(0, 2)}
                      </div>
                    </div>
                  )}
                  
                  <div className="message-content">
                    {!isOwnMessage && showAvatar && (
                      <div className="message-sender">
                        {formatAddress(message.sender)}
                      </div>
                    )}
                    
                    <div className="message-bubble">
                      <div className="message-text">
                        {message.message || message.content}
                      </div>
                      
                      <div className="message-meta">
                        <span className="message-time">
                          {formatTimestamp(message.timestamp)}
                        </span>
                        
                        {isOwnMessage && (
                          <div className="message-status">
                            <span className="status-icon" title="Sent on blockchain">
                              ✓
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
        
        <div ref={messagesEndRef} />
      </div>
      
      <div className="message-list-footer">
        <small>💎 Messages are stored on Fluent blockchain</small>
      </div>
    </div>
  );
};

export default MessageList;
