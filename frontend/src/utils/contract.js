import { ethers } from 'ethers';
import contractInfo from '../contractInfo.json';

class ContractManager {
  constructor() {
    this.contract = null;
    this.provider = null;
    this.signer = null;
  }

  async initializeContract(provider, signer) {
    try {
      this.provider = provider;
      this.signer = signer;

      if (!contractInfo.address || !contractInfo.abi) {
        throw new Error('Contract not deployed or ABI missing. Please deploy the contract first.');
      }

      this.contract = new ethers.Contract(
        contractInfo.address,
        contractInfo.abi,
        signer
      );

      return this.contract;
    } catch (error) {
      console.error('Error initializing contract:', error);
      throw error;
    }
  }

  getContract() {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }
    return this.contract;
  }

  // Public Key Management
  async registerPublicKey(publicKey) {
    try {
      const contract = this.getContract();
      const tx = await contract.registerPublicKey(publicKey);
      const receipt = await tx.wait();
      
      return {
        success: true,
        transactionHash: receipt.hash,
        gasUsed: receipt.gasUsed.toString()
      };
    } catch (error) {
      console.error('Error registering public key:', error);
      throw this.parseContractError(error);
    }
  }

  async hasPublicKey(address) {
    try {
      const contract = this.getContract();
      return await contract.hasPublicKey(address);
    } catch (error) {
      console.error('Error checking public key:', error);
      return false;
    }
  }

  async getPublicKey(address) {
    try {
      const contract = this.getContract();
      return await contract.getPublicKey(address);
    } catch (error) {
      console.error('Error getting public key:', error);
      throw this.parseContractError(error);
    }
  }

  // Message Management
  async sendMessage(receiver, messageText) {
    try {
      const contract = this.getContract();
      const encodedMessage = btoa(messageText); // Base64 encode
      
      const tx = await contract.sendMessage(receiver, encodedMessage);
      const receipt = await tx.wait();
      
      // Create message object for immediate UI update
      const newMessage = {
        sender: await this.signer.getAddress(),
        receiver: receiver,
        message: messageText, // Store original text, not encoded
        timestamp: Date.now() // Use current time in milliseconds
      };
      
      return {
        success: true,
        transactionHash: receipt.hash,
        gasUsed: receipt.gasUsed.toString(),
        message: newMessage // Include message for immediate UI update
      };
    } catch (error) {
      console.error('Error sending message:', error);
      throw this.parseContractError(error);
    }
  }

  async getConversation(otherUser) {
    try {
      const contract = this.getContract();
      const messages = await contract.getConversation(otherUser);
      
      return messages.map(msg => ({
        sender: msg.sender,
        receiver: msg.receiver,
        message: this.decodeMessage(msg.encryptedContent), // Use 'message' for consistency
        timestamp: Number(msg.timestamp) * 1000, // Convert to milliseconds
        isRead: msg.isRead
      }));
    } catch (error) {
      console.error('Error getting conversation:', error);
      return [];
    }
  }

  async getMessages(sender, receiver) {
    try {
      const contract = this.getContract();
      const messages = await contract.getMessages(sender, receiver);
      
      return messages.map(msg => ({
        sender: msg.sender,
        receiver: msg.receiver,
        message: this.decodeMessage(msg.encryptedContent), // Use 'message' for consistency
        timestamp: Number(msg.timestamp) * 1000,
        isRead: msg.isRead
      }));
    } catch (error) {
      console.error('Error getting messages:', error);
      return [];
    }
  }

  async markMessageAsRead(messageIndex) {
    try {
      const contract = this.getContract();
      const tx = await contract.markMessageAsRead(messageIndex);
      await tx.wait();
      return true;
    } catch (error) {
      console.error('Error marking message as read:', error);
      return false;
    }
  }

  async getContacts() {
    try {
      const contract = this.getContract();
      return await contract.getContacts();
    } catch (error) {
      console.error('Error getting contacts:', error);
      return [];
    }
  }

  async getLastMessage(otherUser) {
    try {
      const contract = this.getContract();
      const result = await contract.getLastMessage(otherUser);
      
      return {
        sender: result[0],
        content: this.decodeMessage(result[1]),
        timestamp: Number(result[2]) * 1000,
        isRead: result[3]
      };
    } catch (error) {
      console.error('Error getting last message:', error);
      return null;
    }
  }

  async getUnreadMessageCount(userAddress) {
    try {
      const contract = this.getContract();
      const count = await contract.getUnreadMessageCount(userAddress);
      return Number(count);
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }

  async getTotalMessages() {
    try {
      const contract = this.getContract();
      const total = await contract.totalMessages();
      return Number(total);
    } catch (error) {
      console.error('Error getting total messages:', error);
      return 0;
    }
  }

  // Event Listeners
  setupMessageListener(callback) {
    if (!this.contract) return null;

    try {
      const filter = this.contract.filters.MessageSent();
      
      this.contract.on(filter, (sender, receiver, encryptedContent, timestamp, messageIndex, event) => {
        const decodedContent = this.decodeMessage(encryptedContent);
        callback({
          sender,
          receiver,
          content: decodedContent,
          timestamp: Number(timestamp) * 1000,
          messageIndex: Number(messageIndex),
          transactionHash: event.log.transactionHash
        });
      });

      return filter;
    } catch (error) {
      console.error('Error setting up message listener:', error);
      return null;
    }
  }

  setupPublicKeyListener(callback) {
    if (!this.contract) return null;

    try {
      const filter = this.contract.filters.PublicKeyRegistered();
      
      this.contract.on(filter, (user, publicKey, event) => {
        callback({
          user,
          publicKey,
          transactionHash: event.log.transactionHash
        });
      });

      return filter;
    } catch (error) {
      console.error('Error setting up public key listener:', error);
      return null;
    }
  }

  removeAllListeners() {
    if (this.contract) {
      this.contract.removeAllListeners();
    }
  }

  // Event Listeners with faster detection
  listenForMessages(callback) {
    try {
      const contract = this.getContract();
      
      // Remove existing listeners
      contract.removeAllListeners('MessageSent');
      
      // Add new listener with immediate callback
      contract.on('MessageSent', (sender, receiver, message, timestamp, event) => {
        const messageObj = {
          sender: sender,
          receiver: receiver,
          message: this.decodeMessage(message),
          timestamp: Number(timestamp) * 1000, // Convert to milliseconds
          blockNumber: event.blockNumber,
          transactionHash: event.transactionHash
        };
        
        console.log('🚀 New message event received instantly:', messageObj);
        // Call immediately without delay
        callback(messageObj);
      });
      
      console.log('✅ Message event listener added with instant detection');
    } catch (error) {
      console.error('Error setting up message listener:', error);
    }
  }

  // Listen for past events too
  async listenForRecentMessages(callback, fromBlock = 'latest') {
    try {
      const contract = this.getContract();
      
      // Query recent events
      const filter = contract.filters.MessageSent();
      const events = await contract.queryFilter(filter, fromBlock);
      
      events.forEach(event => {
        const messageObj = {
          sender: event.args.sender,
          receiver: event.args.receiver, 
          message: this.decodeMessage(event.args.message),
          timestamp: Number(event.args.timestamp) * 1000,
          blockNumber: event.blockNumber,
          transactionHash: event.transactionHash
        };
        
        callback(messageObj);
      });
      
    } catch (error) {
      console.error('Error querying recent messages:', error);
    }
  }

  removeMessageListeners() {
    try {
      if (this.contract) {
        this.contract.removeAllListeners('MessageSent');
        console.log('Message event listeners removed');
      }
    } catch (error) {
      console.error('Error removing message listeners:', error);
    }
  }

  // Utility Methods
  decodeMessage(encodedMessage) {
    try {
      // Check if message is actually encoded
      if (!encodedMessage || typeof encodedMessage !== 'string') {
        return encodedMessage || '';
      }
      
      // Try to decode, if it fails, return original
      // Check if it looks like base64 (only contains valid base64 characters)
      const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
      if (base64Regex.test(encodedMessage) && encodedMessage.length % 4 === 0) {
        return atob(encodedMessage);
      } else {
        // Not base64 encoded, return as is
        return encodedMessage;
      }
    } catch (error) {
      console.warn('Failed to decode message, using original:', encodedMessage);
      return encodedMessage; // Return original if decode fails
    }
  }

  parseContractError(error) {
    // Extract meaningful error messages from contract errors
    if (error.reason) {
      return new Error(error.reason);
    }
    
    if (error.data && error.data.message) {
      return new Error(error.data.message);
    }
    
    if (error.message.includes('execution reverted')) {
      const match = error.message.match(/execution reverted: (.+)/);
      if (match) {
        return new Error(match[1]);
      }
      return new Error('Transaction reverted');
    }
    
    if (error.message.includes('user rejected transaction')) {
      return new Error('Transaction was rejected by user');
    }
    
    if (error.message.includes('insufficient funds')) {
      return new Error('Insufficient funds for transaction');
    }
    
    return error;
  }

  getContractAddress() {
    return contractInfo.address;
  }

  getExplorerUrl() {
    return contractInfo.explorerUrl || `https://testnet.fluentscan.xyz/address/${contractInfo.address}`;
  }
}

export default new ContractManager();
