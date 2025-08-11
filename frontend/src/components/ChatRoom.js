import React, { useState, useEffect, useCallback } from 'react';
import ContactList from './ContactList';
import MessageList from './MessageList';
import MessageSender from './MessageSender';
import ErrorPanel, { useErrors } from './ErrorPanel';

const ChatRoom = ({ 
  contractManager, 
  walletManager, 
  currentUser, 
  onLogout 
}) => {
  const [selectedContact, setSelectedContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [balance, setBalance] = useState('0');
  const [lastMessageCount, setLastMessageCount] = useState(0);
  const [pollInterval, setPollInterval] = useState(null);
  
  const { 
    errors, 
    removeError, 
    addContractError, 
    addTransactionError, 
    addSuccess,
    addNetworkError 
  } = useErrors();

  // Load initial data
  useEffect(() => {
    if (contractManager && currentUser) {
      loadContacts();
      loadBalance();
      setupEventListeners();
    }

    return () => {
      if (contractManager) {
        contractManager.removeMessageListeners();
      }
      // Clear polling interval
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [contractManager, currentUser]);

  // Load conversation when contact is selected
  useEffect(() => {
    if (selectedContact && contractManager) {
      loadConversation(selectedContact);
      startMessagePolling(selectedContact);
    } else {
      setMessages([]);
      stopMessagePolling();
    }
  }, [selectedContact, contractManager]);

  const startMessagePolling = (contact) => {
    // Clear existing interval
    if (pollInterval) {
      clearInterval(pollInterval);
    }

    // Start aggressive polling every 1 second for real-time feel
    const interval = setInterval(async () => {
      try {
        if (contact && contractManager) {
          const conversation = await contractManager.getConversation(contact);
          
          // Only update if message count changed and we're still on the same contact
          if (conversation.length !== lastMessageCount && selectedContact === contact) {
            const sortedMessages = conversation.sort((a, b) => a.timestamp - b.timestamp);
            setMessages(sortedMessages);
            setLastMessageCount(conversation.length);
            
            // Show notification if new messages received
            if (conversation.length > lastMessageCount) {
              const newMessagesCount = conversation.length - lastMessageCount;
              console.log(`Polled ${newMessagesCount} new messages`);
            }
          }
        }
      } catch (error) {
        console.error('Error polling messages:', error);
      }
    }, 1000); // Poll every 1 second for faster updates

    setPollInterval(interval);
  };

  const stopMessagePolling = () => {
    if (pollInterval) {
      clearInterval(pollInterval);
      setPollInterval(null);
    }
  };

  const loadBalance = async () => {
    try {
      if (walletManager) {
        const bal = await walletManager.getBalance();
        setBalance(bal);
      }
    } catch (error) {
      console.error('Error loading balance:', error);
    }
  };

  const loadContacts = async () => {
    try {
      setIsLoading(true);
      const contactsList = await contractManager.getContacts();
      setContacts(contactsList);
    } catch (error) {
      console.error('Error loading contacts:', error);
      addContractError('Failed to load contacts', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadConversation = async (contactAddress) => {
    try {
      setMessagesLoading(true);
      const conversation = await contractManager.getConversation(contactAddress);
      
      // Sort messages by timestamp
      const sortedMessages = conversation.sort((a, b) => a.timestamp - b.timestamp);
      setMessages(sortedMessages);
      setLastMessageCount(sortedMessages.length);
    } catch (error) {
      console.error('Error loading conversation:', error);
      addContractError('Failed to load conversation', error);
      setMessages([]);
      setLastMessageCount(0);
    } finally {
      setMessagesLoading(false);
    }
  };

  const setupEventListeners = () => {
    try {
      // Listen for new messages from blockchain events
      contractManager.listenForMessages((messageData) => {
        const { sender, receiver, message, timestamp } = messageData;
        
        // Check if this message is relevant to current user
        if (sender === currentUser || receiver === currentUser) {
          console.log('Received new message event:', messageData);
          
          const newMessage = {
            sender,
            receiver,
            message,
            timestamp,
            isRead: false
          };

          // Update messages if viewing the relevant conversation
          const relevantContact = sender === currentUser ? receiver : sender;
          
          if (selectedContact === relevantContact) {
            setMessages(prev => {
              // Avoid duplicate messages - check if message already exists
              const exists = prev.some(msg => 
                msg.sender === sender && 
                msg.receiver === receiver && 
                Math.abs(msg.timestamp - timestamp) < 10000 && // Within 10 seconds
                msg.message === message
              );
              
              if (!exists) {
                const updated = [...prev, newMessage].sort((a, b) => a.timestamp - b.timestamp);
                setLastMessageCount(updated.length);
                return updated;
              }
              return prev;
            });
          }

          // Update contacts list if new contact
          const contactAddress = sender === currentUser ? receiver : sender;
          if (!contacts.includes(contactAddress)) {
            setContacts(prev => [...prev, contactAddress]);
          }
          
          // Show notification for received messages only (not sent messages)
          if (sender !== currentUser) {
            addSuccess(`New message from ${sender.slice(0,6)}...${sender.slice(-4)}`, 'New Message');
          }
        }
      });

      // Listen for public key registrations (for contact updates)
      contractManager.setupPublicKeyListener((keyData) => {
        console.log('New public key registered:', keyData);
        loadContacts();
      });

    } catch (error) {
      console.error('Error setting up event listeners:', error);
      addNetworkError('Failed to set up real-time updates', error);
    }
  };

  const handleSendMessage = async (receiver, messageText) => {
    try {
      if (!messageText.trim()) {
        throw new Error('Message cannot be empty');
      }

      if (receiver === currentUser) {
        throw new Error('Cannot send message to yourself');
      }

      // Check if receiver has public key
      const hasKey = await contractManager.hasPublicKey(receiver);
      if (!hasKey) {
        throw new Error('Receiver has not registered a public key');
      }

      // Check wallet balance
      const currentBalance = parseFloat(await walletManager.getBalance());
      if (currentBalance < 0.001) { // Minimum balance check
        throw new Error('Insufficient balance for transaction fees');
      }

      const result = await contractManager.sendMessage(receiver, messageText);
      
      // Always add message immediately to UI for better UX
      const newMessage = {
        sender: currentUser,
        receiver: receiver,
        message: messageText,
        timestamp: Date.now(),
        isRead: false
      };
      
      setMessages(prev => {
        const updated = [...prev, newMessage].sort((a, b) => a.timestamp - b.timestamp);
        setLastMessageCount(updated.length);
        return updated;
      });
      
      // Update contacts if not exists
      if (!contacts.includes(receiver)) {
        setContacts(prev => [...prev, receiver]);
      }
      
      // Don't show success notification - message appears immediately in UI
      return result;
    } catch (error) {
      console.error('Error sending message:', error);
      addTransactionError(error.message || 'Failed to send message', error);
      throw error;
    }
  };

  const handleSelectContact = (contactAddress) => {
    setSelectedContact(contactAddress);
  };

  const handleAddContact = (contactAddress) => {
    if (!contacts.includes(contactAddress)) {
      setContacts(prev => [...prev, contactAddress]);
      setSelectedContact(contactAddress);
    }
  };

  const formatAddress = (address) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatBalance = (balance) => {
    const num = parseFloat(balance);
    return num.toFixed(4);
  };

  return (
    <div className="chat-room">
      <ErrorPanel errors={errors} onDismiss={removeError} />
      
      <div className="chat-container">
        {/* Left Sidebar */}
        <div className="chat-sidebar">
          <div className="sidebar-header">
            <div className="user-info">
              <div className="user-avatar">
                {formatAddress(currentUser).slice(0, 2)}
              </div>
              <div className="user-details">
                <div className="user-address">
                  {formatAddress(currentUser)}
                </div>
                <div className="user-balance">
                  💰 {formatBalance(balance)} ETH
                  {parseFloat(balance) < 0.01 && (
                    <a 
                      href="https://testnet.gblend.xyz/" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="faucet-hint"
                      title="Get free testnet ETH"
                    >
                      🚰 Faucet
                    </a>
                  )}
                </div>
              </div>
            </div>
            
            <div className="sidebar-actions">
              <button 
                className="btn-icon"
                onClick={loadBalance}
                title="Refresh balance"
              >
                🔄
              </button>
              <button 
                className="btn-icon logout-btn"
                onClick={onLogout}
                title="Disconnect wallet"
              >
                🚪
              </button>
            </div>
          </div>

          <ContactList
            contacts={contacts}
            selectedContact={selectedContact}
            onSelectContact={handleSelectContact}
            currentUser={currentUser}
            contractManager={contractManager}
            onAddContact={handleAddContact}
          />
        </div>

        {/* Main Chat Area */}
        <div className="chat-main">
          {selectedContact && (
            <div className="chat-header">
              <button 
                className="btn-back"
                onClick={() => setSelectedContact(null)}
                title="Back to welcome screen"
              >
                ← Back
              </button>
              <div className="chat-contact-info">
                <div className="contact-avatar">
                  {selectedContact.slice(0, 2)}
                </div>
                <div className="contact-address">
                  {formatAddress(selectedContact)}
                </div>
              </div>
            </div>
          )}
          
          <MessageList
            messages={messages}
            currentUser={currentUser}
            selectedContact={selectedContact}
            isLoading={messagesLoading}
          />
          
          <MessageSender
            onSendMessage={handleSendMessage}
            selectedContact={selectedContact}
            disabled={isLoading || !contractManager}
            isLoading={messagesLoading}
          />
        </div>
      </div>

      {/* Network Status Bar */}
      <div className="network-status">
        <div className="status-item">
          <span className="status-indicator active"></span>
          <span>Fluent Testnet</span>
        </div>
        <div className="status-item">
          <span>Contract: {contractManager.getContractAddress()?.slice(0, 8)}...</span>
        </div>
        <div className="status-item">
          <span>💬 {messages.length} messages</span>
        </div>
        <div className="status-item">
          <span>👥 {contacts.length} contacts</span>
        </div>
      </div>
    </div>
  );
};

export default ChatRoom;
