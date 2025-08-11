// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract SecureMessaging {
    struct Message {
        address sender;
        address receiver;
        string encryptedContent;
        uint256 timestamp;
        bool isRead;
    }

    mapping(address => string) private userPublicKeys;
    mapping(address => bool) public hasPublicKey;
    mapping(bytes32 => Message[]) private conversations;
    mapping(address => uint256) private unreadCounts;
    
    Message[] private allMessages;
    
    bool public isPaused = false;
    address public owner;

    event MessageSent(
        address indexed sender, 
        address indexed receiver, 
        string encryptedContent, 
        uint256 timestamp,
        uint256 messageIndex
    );
    
    event PublicKeyRegistered(address indexed user, string publicKey);
    event MessageRead(address indexed user, uint256 messageIndex);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    modifier notPaused() {
        require(!isPaused, "Contract is paused");
        _;
    }

    modifier hasRegisteredKey() {
        require(hasPublicKey[msg.sender], "Public key not registered");
        _;
    }

    modifier validReceiver(address _receiver) {
        require(_receiver != address(0), "Invalid receiver address");
        require(_receiver != msg.sender, "Cannot send message to yourself");
        require(hasPublicKey[_receiver], "Receiver has not registered public key");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    // Public Key Management
    function registerPublicKey(string memory _publicKey) external notPaused {
        require(bytes(_publicKey).length > 0, "Public key cannot be empty");
        require(!hasPublicKey[msg.sender], "Public key already registered");
        
        userPublicKeys[msg.sender] = _publicKey;
        hasPublicKey[msg.sender] = true;
        
        emit PublicKeyRegistered(msg.sender, _publicKey);
    }

    function getPublicKey(address _userAddress) external view returns (string memory) {
        require(hasPublicKey[_userAddress], "User has not registered public key");
        return userPublicKeys[_userAddress];
    }

    // Message Management
    function sendMessage(
        address _receiver, 
        string memory _encryptedContent
    ) external notPaused hasRegisteredKey validReceiver(_receiver) {
        require(bytes(_encryptedContent).length > 0, "Message cannot be empty");
        
        Message memory newMessage = Message({
            sender: msg.sender,
            receiver: _receiver,
            encryptedContent: _encryptedContent,
            timestamp: block.timestamp,
            isRead: false
        });

        // Store in conversations mapping
        bytes32 conversationId = getConversationId(msg.sender, _receiver);
        conversations[conversationId].push(newMessage);
        
        // Store in global messages array
        allMessages.push(newMessage);
        
        // Update unread count for receiver
        unreadCounts[_receiver]++;
        
        emit MessageSent(
            msg.sender, 
            _receiver, 
            _encryptedContent, 
            block.timestamp,
            allMessages.length - 1
        );
    }

    function getMessages(
        address _sender, 
        address _receiver
    ) external view hasRegisteredKey returns (Message[] memory) {
        bytes32 conversationId = getConversationId(_sender, _receiver);
        return conversations[conversationId];
    }

    function getConversation(
        address _otherUser
    ) external view hasRegisteredKey returns (Message[] memory) {
        bytes32 conversationId = getConversationId(msg.sender, _otherUser);
        return conversations[conversationId];
    }

    function markMessageAsRead(uint256 _messageIndex) external hasRegisteredKey {
        require(_messageIndex < allMessages.length, "Invalid message index");
        
        Message storage message = allMessages[_messageIndex];
        require(message.receiver == msg.sender, "Not authorized to mark this message as read");
        require(!message.isRead, "Message already marked as read");
        
        message.isRead = true;
        
        if (unreadCounts[msg.sender] > 0) {
            unreadCounts[msg.sender]--;
        }
        
        emit MessageRead(msg.sender, _messageIndex);
    }

    function getUnreadMessageCount(address _user) external view returns (uint256) {
        return unreadCounts[_user];
    }

    function totalMessages() external view returns (uint256) {
        return allMessages.length;
    }

    function getConversationId(address _user1, address _user2) private pure returns (bytes32) {
        if (_user1 < _user2) {
            return keccak256(abi.encodePacked(_user1, _user2));
        } else {
            return keccak256(abi.encodePacked(_user2, _user1));
        }
    }

    // Get all unique contacts for a user (addresses they've communicated with)
    function getContacts() external view hasRegisteredKey returns (address[] memory) {
        address[] memory tempContacts = new address[](allMessages.length);
        uint256 contactCount = 0;
        
        for (uint256 i = 0; i < allMessages.length; i++) {
            address contact;
            if (allMessages[i].sender == msg.sender) {
                contact = allMessages[i].receiver;
            } else if (allMessages[i].receiver == msg.sender) {
                contact = allMessages[i].sender;
            } else {
                continue;
            }
            
            // Check if contact already exists in the array
            bool exists = false;
            for (uint256 j = 0; j < contactCount; j++) {
                if (tempContacts[j] == contact) {
                    exists = true;
                    break;
                }
            }
            
            if (!exists) {
                tempContacts[contactCount] = contact;
                contactCount++;
            }
        }
        
        // Create array with exact size
        address[] memory contacts = new address[](contactCount);
        for (uint256 i = 0; i < contactCount; i++) {
            contacts[i] = tempContacts[i];
        }
        
        return contacts;
    }

    // Emergency functions
    function pauseContract() external onlyOwner {
        isPaused = true;
    }

    function unpauseContract() external onlyOwner {
        isPaused = false;
    }

    function transferOwnership(address _newOwner) external onlyOwner {
        require(_newOwner != address(0), "Invalid new owner address");
        owner = _newOwner;
    }

    // Get last message in a conversation for contact list preview
    function getLastMessage(address _otherUser) external view hasRegisteredKey returns (
        address sender,
        string memory encryptedContent,
        uint256 timestamp,
        bool isRead
    ) {
        bytes32 conversationId = getConversationId(msg.sender, _otherUser);
        Message[] memory msgs = conversations[conversationId];
        
        require(msgs.length > 0, "No messages found");
        
        Message memory lastMsg = msgs[msgs.length - 1];
        return (lastMsg.sender, lastMsg.encryptedContent, lastMsg.timestamp, lastMsg.isRead);
    }
}
