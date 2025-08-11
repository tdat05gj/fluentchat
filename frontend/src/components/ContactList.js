import React, { useState, useEffect } from 'react';

const ContactList = ({ 
  contacts, 
  selectedContact, 
  onSelectContact, 
  currentUser, 
  contractManager,
  onAddContact 
}) => {
  const [contactsWithLastMessage, setContactsWithLastMessage] = useState([]);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [newContactAddress, setNewContactAddress] = useState('');
  const [showAddContact, setShowAddContact] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (contacts && contacts.length > 0) {
      loadContactsData();
    }
  }, [contacts, contractManager]);

  const loadContactsData = async () => {
    if (!contractManager || !contacts) return;

    setIsLoading(true);
    const contactsData = [];

    for (const contact of contacts) {
      try {
        // Get last message
        const lastMessage = await contractManager.getLastMessage(contact);
        
        // Get unread count (this would need to be implemented based on your logic)
        const unreadCount = await getUnreadCountForContact(contact);

        contactsData.push({
          address: contact,
          lastMessage,
          unreadCount,
          avatar: generateAvatar(contact)
        });
      } catch (error) {
        console.error(`Error loading data for contact ${contact}:`, error);
        contactsData.push({
          address: contact,
          lastMessage: null,
          unreadCount: 0,
          avatar: generateAvatar(contact)
        });
      }
    }

    setContactsWithLastMessage(contactsData);
    setIsLoading(false);
  };

  const getUnreadCountForContact = async (contactAddress) => {
    // This is a simplified implementation
    // In a real app, you'd need to track read/unread status per conversation
    try {
      return 0; // Placeholder - implement based on your message tracking logic
    } catch (error) {
      return 0;
    }
  };

  const generateAvatar = (address) => {
    // Generate a simple avatar based on address
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];
    const index = parseInt(address.slice(-2), 16) % colors.length;
    return {
      backgroundColor: colors[index],
      initials: address.slice(2, 4).toUpperCase()
    };
  };

  const formatAddress = (address) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    
    const now = new Date();
    const messageDate = new Date(timestamp);
    const diffInHours = Math.abs(now - messageDate) / 36e5;

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return messageDate.toLocaleDateString();
    }
  };

  const handleAddContact = async () => {
    if (!newContactAddress.trim()) return;

    const address = newContactAddress.trim();
    
    // Basic address validation
    if (!address.startsWith('0x') || address.length !== 42) {
      alert('Please enter a valid Ethereum address');
      return;
    }

    if (address.toLowerCase() === currentUser.toLowerCase()) {
      alert('Cannot add yourself as a contact');
      return;
    }

    try {
      // Check if user has registered public key
      const hasKey = await contractManager.hasPublicKey(address);
      if (!hasKey) {
        alert('This user has not registered a public key yet');
        return;
      }

      onAddContact(address);
      setNewContactAddress('');
      setShowAddContact(false);
    } catch (error) {
      console.error('Error adding contact:', error);
      alert('Failed to add contact: ' + error.message);
    }
  };

  return (
    <div className="contact-list">
      <div className="contact-list-header">
        <h3>💬 Conversations</h3>
        <button 
          className="btn-add-contact"
          onClick={() => setShowAddContact(!showAddContact)}
          title="Add new contact"
        >
          {showAddContact ? '✖️' : '➕'}
        </button>
      </div>

      {showAddContact && (
        <div className="add-contact-form">
          <input
            type="text"
            placeholder="Enter wallet address (0x...)"
            value={newContactAddress}
            onChange={(e) => setNewContactAddress(e.target.value)}
            className="add-contact-input"
          />
          <button 
            onClick={handleAddContact}
            className="btn-add"
            disabled={!newContactAddress.trim()}
          >
            Add
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="contact-loading">
          <div className="spinner"></div>
          <p>Loading contacts...</p>
        </div>
      ) : contactsWithLastMessage.length === 0 ? (
        <div className="no-contacts">
          <div className="no-contacts-icon">👥</div>
          <h4>No conversations yet</h4>
          <p>Add a contact to start messaging!</p>
          {!showAddContact && (
            <button 
              className="btn-primary"
              onClick={() => setShowAddContact(true)}
            >
              Add First Contact
            </button>
          )}
        </div>
      ) : (
        <div className="contacts">
          {contactsWithLastMessage.map((contact) => (
            <div
              key={contact.address}
              className={`contact-item ${selectedContact === contact.address ? 'active' : ''}`}
              onClick={() => onSelectContact(contact.address)}
            >
              <div className="contact-avatar" style={{ backgroundColor: contact.avatar.backgroundColor }}>
                {contact.avatar.initials}
              </div>
              
              <div className="contact-info">
                <div className="contact-name">
                  {formatAddress(contact.address)}
                </div>
                
                <div className="contact-last-message">
                  {contact.lastMessage ? (
                    <>
                      <span className={`message-preview ${contact.lastMessage.sender === currentUser ? 'sent' : 'received'}`}>
                        {contact.lastMessage.sender === currentUser ? 'You: ' : ''}
                        {contact.lastMessage.content.length > 30 
                          ? contact.lastMessage.content.substring(0, 30) + '...'
                          : contact.lastMessage.content
                        }
                      </span>
                      <span className="message-timestamp">
                        {formatTimestamp(contact.lastMessage.timestamp)}
                      </span>
                    </>
                  ) : (
                    <span className="no-messages">No messages yet</span>
                  )}
                </div>
              </div>

              {contact.unreadCount > 0 && (
                <div className="unread-badge">
                  {contact.unreadCount}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ContactList;
