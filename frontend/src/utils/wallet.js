import { ethers } from 'ethers';

// Official Fluent testnet configuration
const FLUENT_TESTNET_CONFIG = {
  chainId: '0x51EA', // 20994 in hex
  chainName: 'Fluent Testnet',
  nativeCurrency: {
    name: 'ETH',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: ['https://rpc.testnet.fluent.xyz'],
  blockExplorerUrls: ['https://testnet.fluentscan.xyz/'],
};

class WalletManager {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.account = null;
    this.isConnected = false;
    this.pendingRequests = new Set();
  }

  async checkMetaMask() {
    // Check if ethereum object exists
    if (typeof window === 'undefined') {
      throw new Error('This application requires a browser environment.');
    }

    // Wait for MetaMask to inject properly
    let attempts = 0;
    while (attempts < 50) { // Try for up to 5 seconds
      if (window.ethereum && window.ethereum.isMetaMask) {
        return true;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }

    // Final check for any ethereum provider
    if (window.ethereum) {
      console.warn('Ethereum provider found but not confirmed as MetaMask');
      return true;
    }

    throw new Error('MetaMask is required to use this dApp.');
  }

  // Check if already connected (for page refresh)
  async checkExistingConnection() {
    try {
      if (!window.ethereum) return false;
      
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      if (accounts.length > 0) {
        this.provider = new ethers.BrowserProvider(window.ethereum);
        this.signer = await this.provider.getSigner();
        this.account = accounts[0];
        this.isConnected = true;
        
        console.log('Existing wallet connection restored:', this.account);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error checking existing connection:', error);
      return false;
    }
  }

  async connectWallet(skipNetworkSwitch = false) {
    try {
      await this.checkMetaMask();

      // Safely access ethereum object with error handling
      const ethereum = window.ethereum;
      if (!ethereum) {
        throw new Error('Ethereum provider not found');
      }

      // Prevent multiple simultaneous requests
      if (this.pendingRequests.has('connect')) {
        throw new Error('Connection request in progress, please wait...');
      }

      this.pendingRequests.add('connect');

      try {
        // Request account access
        const accounts = await ethereum.request({
          method: 'eth_requestAccounts',
        });

        if (accounts.length === 0) {
          throw new Error('No accounts found. Please connect your wallet.');
        }

        this.provider = new ethers.BrowserProvider(ethereum);
        this.signer = await this.provider.getSigner();
        this.account = accounts[0];
        this.isConnected = true;

        // Only check network if not explicitly skipped
        if (!skipNetworkSwitch) {
          // Try to switch to Fluent testnet (completely optional)
          try {
            console.log('Attempting to check/switch network...');
            await this.switchToFluentTestnet();
            console.log('Network check/switch completed');
          } catch (networkError) {
            console.log('Network switch skipped:', networkError.message);
            // Silently continue - network switch is completely optional during connection
          }
        } else {
          console.log('Network switch skipped by request');
        }
      } finally {
        this.pendingRequests.delete('connect');
      }

      // Listen for account changes (remove existing listeners first)
      if (this.accountChangeListener) {
        ethereum.removeListener('accountsChanged', this.accountChangeListener);
      }
      
      this.accountChangeListener = (accounts) => {
        if (accounts.length === 0) {
          this.disconnect();
        } else {
          this.account = accounts[0];
          window.location.reload(); // Reload to refresh the app state
        }
      };
      
      ethereum.on('accountsChanged', this.accountChangeListener);

      // Listen for network changes (remove existing listeners first)
      if (this.chainChangeListener) {
        ethereum.removeListener('chainChanged', this.chainChangeListener);
      }
      
      this.chainChangeListener = (chainId) => {
        console.log('Network changed to:', chainId);
        window.location.reload(); // Reload to refresh the app state
      };
      
      ethereum.on('chainChanged', this.chainChangeListener);

      return {
        account: this.account,
        provider: this.provider,
        signer: this.signer,
      };
    } catch (error) {
      console.error('Error connecting wallet:', error);
      throw error;
    }
  }

  async checkNetwork() {
    try {
      const ethereum = window.ethereum;
      if (!ethereum) {
        return {
          isCorrect: false,
          error: 'Ethereum provider not available'
        };
      }

      const chainId = await ethereum.request({ method: 'eth_chainId' });
      const isFluentNetwork = chainId.toLowerCase() === '0x51ea';
      
      if (!isFluentNetwork) {
        console.warn('Not on Fluent testnet. Current chain ID:', chainId);
        return {
          isCorrect: false,
          currentChainId: chainId,
          expectedChainId: '0x51ea'
        };
      }
      
      return {
        isCorrect: true,
        currentChainId: chainId,
        expectedChainId: '0x51ea'
      };
    } catch (error) {
      console.error('Error checking network:', error);
      return {
        isCorrect: false,
        error: error.message
      };
    }
  }

  async switchToFluentTestnet() {
    const requestKey = 'switchNetwork';
    
    // Prevent duplicate requests
    if (this.pendingRequests.has(requestKey)) {
      console.log('Network switch already in progress, waiting...');
      return;
    }

    try {
      this.pendingRequests.add(requestKey);
      
      // Safely get ethereum object
      const ethereum = window.ethereum;
      if (!ethereum) {
        throw new Error('Ethereum provider not available');
      }
      
      // First check current network with multiple format checks
      const currentChainId = await ethereum.request({ method: 'eth_chainId' });
      console.log('Current chain ID (raw):', currentChainId);
      
      // Convert to number for comparison
      const currentChainIdNum = parseInt(currentChainId, 16);
      const fluentChainIdNum = parseInt(FLUENT_TESTNET_CONFIG.chainId, 16); // 20994
      
      console.log('Current chain ID (decimal):', currentChainIdNum);
      console.log('Fluent chain ID (decimal):', fluentChainIdNum);
      
      // If already on Fluent testnet, return immediately
      if (currentChainIdNum === fluentChainIdNum) {
        console.log('Already on Fluent testnet - no action needed');
        return;
      }

      // Try to switch to existing network first
      try {
        await ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: FLUENT_TESTNET_CONFIG.chainId }],
        });
        console.log('Successfully switched to Fluent testnet');
        return;
      } catch (switchError) {
        console.log('Switch failed:', switchError.code, switchError.message);
        
        // Only add network if it doesn't exist (error 4902)
        if (switchError.code === 4902) {
          console.log('Network not found, attempting to add...');
          await ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [FLUENT_TESTNET_CONFIG],
          });
          console.log('Successfully added and switched to Fluent testnet');
          return;
        } else if (switchError.code === -32002) {
          // Request already pending - just wait and return
          console.log('Request already pending - continuing without network switch');
          return;
        } else {
          throw switchError;
        }
      }
    } catch (error) {
      console.error('Failed to switch to Fluent testnet:', error);
      
      // Handle different error cases
      if (error.code === 4001) {
        console.log('User rejected network switch - continuing with current network');
        return; // Don't throw error, just continue
      } else if (error.code === -32002) {
        console.log('Request already pending - continuing');
        return; // Don't throw error, just continue
      } else {
        // Don't throw error for network issues, just log and continue
        console.log('Network switch not completed, but wallet connection successful');
        return; // Allow connection to proceed
      }
    } finally {
      this.pendingRequests.delete(requestKey);
    }
  }

  async checkNetwork() {
    if (!this.provider) return false;

    try {
      const network = await this.provider.getNetwork();
      const chainId = Number(network.chainId);
      console.log('Current chain ID:', chainId);
      
      // Accept multiple potential Fluent chain IDs
      const validFluentIds = [20994, 84531, 421613];
      const isValid = validFluentIds.includes(chainId);
      console.log('Is valid Fluent network:', isValid);
      
      return isValid;
    } catch (error) {
      console.error('Error checking network:', error);
      return false;
    }
  }

  async getBalance() {
    if (!this.provider || !this.account) return '0';

    try {
      const balance = await this.provider.getBalance(this.account);
      return ethers.formatEther(balance);
    } catch (error) {
      console.error('Error getting balance:', error);
      return '0';
    }
  }

  disconnect() {
    // Clean up event listeners
    if (window.ethereum) {
      if (this.accountChangeListener) {
        window.ethereum.removeListener('accountsChanged', this.accountChangeListener);
        this.accountChangeListener = null;
      }
      if (this.chainChangeListener) {
        window.ethereum.removeListener('chainChanged', this.chainChangeListener);
        this.chainChangeListener = null;
      }
    }

    // Reset state
    this.provider = null;
    this.signer = null;
    this.account = null;
    this.isConnected = false;
    this.pendingRequests.clear();
    
    console.log('Wallet disconnected');
  }

  formatAddress(address) {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  async isConnectedAndOnCorrectNetwork() {
    if (!this.isConnected || !this.provider) return false;
    return await this.checkNetwork();
  }
}

export default new WalletManager();
