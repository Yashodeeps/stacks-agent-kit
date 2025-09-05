import {
  privateKeyToHex,
  privateKeyToPublic,
  publicKeyToAddress,
  AddressVersion,
  makeRandomPrivKey,
} from '@stacks/transactions';
import { PrivateKeyInfo, KeyInitializationParams } from '../types/index';

// Utility functions for Stacks operations
export const StacksUtils = {
  formatSTX: (microSTX: string): string => {
    const stx = BigInt(microSTX) / BigInt(1000000);
    const remainder = BigInt(microSTX) % BigInt(1000000);
    return `${stx}.${remainder.toString().padStart(6, '0')}`;
  },
  
  parseSTX: (stx: string): string => {
    const [whole, decimal = '0'] = stx.split('.');
    const paddedDecimal = decimal.padEnd(6, '0').slice(0, 6);
    return `${whole}${paddedDecimal}`;
  },
  
  isValidAddress: (address: string): boolean => {
    return /^[SM][0-9A-Z]{40}$/.test(address);
  },

  // Private key utilities
  generatePrivateKey: (): string => {
    const privKey = makeRandomPrivKey();
    return privateKeyToHex(privKey);
  },

  validatePrivateKey: (privateKey: string): boolean => {
    try {
      // Check if it's a valid hex string
      if (!/^[0-9a-fA-F]{64}$/.test(privateKey)) {
        return false;
      }
      
      // Try to convert to buffer and derive public key
      const privKeyBuffer = Buffer.from(privateKey, 'hex');
      privateKeyToPublic(privKeyBuffer);
      return true;
    } catch {
      return false;
    }
  },

  deriveAddressFromPrivateKey: (privateKey: string, network: 'mainnet' | 'testnet'): string => {
    try {
      const privKeyBuffer = Buffer.from(privateKey, 'hex');
      const pubKey = privateKeyToPublic(privKeyBuffer);
      const addressVersion = network === 'mainnet' 
        ? AddressVersion.MainnetSingleSig 
        : AddressVersion.TestnetSingleSig;
      return publicKeyToAddress(addressVersion, pubKey);
    } catch (error) {
      throw new Error(`Failed to derive address from private key: ${error}`);
    }
  },

  initializePrivateKey: (params: KeyInitializationParams): PrivateKeyInfo => {
    const { privateKey, network } = params;
    
    let finalPrivateKey: string;
    
    if (privateKey) {
      if (!StacksUtils.validatePrivateKey(privateKey)) {
        throw new Error('Invalid private key format');
      }
      finalPrivateKey = privateKey;
    } else {
      finalPrivateKey = StacksUtils.generatePrivateKey();
    }

    const privKeyBuffer = Buffer.from(finalPrivateKey, 'hex');
    const publicKey = privateKeyToHex(privateKeyToPublic(privKeyBuffer));
    const address = StacksUtils.deriveAddressFromPrivateKey(finalPrivateKey, network);

    return {
      privateKey: finalPrivateKey,
      publicKey,
      address,
      network,
    };
  },
};
