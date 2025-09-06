import { 
  makeRandomPrivKey,
  privateKeyToPublic,
  getAddressFromPrivateKey,
  publicKeyToHex,
  privateKeyToHex,
} from '@stacks/transactions';
import { PrivateKey } from '@stacks/common';
import { StacksNetwork } from '@stacks/network';
import { ToolResult } from '../types/index';

export interface KeyInfo {
  privateKey: string;
  publicKey: string;
  address: string;
  network: 'mainnet' | 'testnet';
}

export interface ImportKeyParams {
  privateKeyHex: string;
  network: 'mainnet' | 'testnet';
}

export interface GenerateKeyParams {
  network: 'mainnet' | 'testnet';
  entropy?: string; // Optional entropy for deterministic generation
}

export class StacksKeyManagementTool {
  private network: StacksNetwork;

  constructor(network: StacksNetwork) {
    this.network = network;
  }

  async generateRandomKey(params: GenerateKeyParams): Promise<ToolResult<KeyInfo>> {
    try {
      const { network } = params;
      
      // Generate a random private key
      const privateKeyHex = makeRandomPrivKey();
      
      // Get the public key
      const publicKey = privateKeyToPublic(privateKeyHex);
      
      // Get the address for the specified network
      const address = getAddressFromPrivateKey(
        privateKeyHex,
        network
      );

      const keyInfo: KeyInfo = {
        privateKey: privateKeyHex,
        publicKey: publicKeyToHex(publicKey),
        address,
        network,
      };

      return {
        success: true,
        data: keyInfo,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate key',
      };
    }
  }

  async importPrivateKey(params: ImportKeyParams): Promise<ToolResult<KeyInfo>> {
    try {
      const { privateKeyHex, network } = params;
      
      // Validate the private key format
      if (!this.isValidPrivateKey(privateKeyHex)) {
        throw new Error('Invalid private key format');
      }

      // Get the public key from private key
      const publicKey = privateKeyToPublic(privateKeyHex);
      
      // Get the address for the specified network
      const address = getAddressFromPrivateKey(privateKeyHex, network);

      const keyInfo: KeyInfo = {
        privateKey: privateKeyHex,
        publicKey: publicKeyToHex(publicKey),
        address,
        network,
      };

      return {
        success: true,
        data: keyInfo,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to import private key',
      };
    }
  }

  async getPublicKeyFromPrivate(privateKeyHex: string): Promise<ToolResult<string>> {
    try {
      if (!this.isValidPrivateKey(privateKeyHex)) {
        throw new Error('Invalid private key format');
      }

      const publicKey = privateKeyToPublic(privateKeyHex);
      
      return {
        success: true,
        data: publicKeyToHex(publicKey),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get public key',
      };
    }
  }

  async getAddressFromPrivate(privateKeyHex: string, network: 'mainnet' | 'testnet'): Promise<ToolResult<string>> {
    try {
      if (!this.isValidPrivateKey(privateKeyHex)) {
        throw new Error('Invalid private key format');
      }

      const address = getAddressFromPrivateKey(privateKeyHex, network);
      
      return {
        success: true,
        data: address,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get address',
      };
    }
  }

  async validatePrivateKey(privateKeyHex: string): Promise<ToolResult<boolean>> {
    try {
      const isValid = this.isValidPrivateKey(privateKeyHex);
      
      if (isValid) {
        // Additional validation: try to derive public key
        privateKeyToPublic(privateKeyHex);
      }

      return {
        success: true,
        data: isValid,
      };
    } catch (error) {
      return {
        success: true,
        data: false,
      };
    }
  }

  async validateAddress(address: string): Promise<ToolResult<{ valid: boolean; network?: 'mainnet' | 'testnet' }>> {
    try {
      // Stacks addresses are 40 characters long and start with 'S' (mainnet) or 'ST' (testnet)
      const isValidFormat = /^S[0-9A-Z]{39}$/.test(address) || /^ST[0-9A-Z]{38}$/.test(address);
      
      if (!isValidFormat) {
        return {
          success: true,
          data: { valid: false },
        };
      }

      // Determine network based on prefix
      const network = address.startsWith('ST') ? 'testnet' : 'mainnet';

      return {
        success: true,
        data: {
          valid: true,
          network,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Address validation failed',
      };
    }
  }

  async generateMultipleKeys(count: number, network: 'mainnet' | 'testnet'): Promise<ToolResult<KeyInfo[]>> {
    try {
      if (count <= 0 || count > 100) {
        throw new Error('Count must be between 1 and 100');
      }

      const keys: KeyInfo[] = [];
      
      for (let i = 0; i < count; i++) {
        const result = await this.generateRandomKey({ network });
        if (result.success && result.data) {
          keys.push(result.data);
        } else {
          throw new Error(`Failed to generate key ${i + 1}: ${result.error}`);
        }
      }

      return {
        success: true,
        data: keys,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate multiple keys',
      };
    }
  }

  async deriveChildKeys(masterPrivateKey: string, network: 'mainnet' | 'testnet', count: number = 5): Promise<ToolResult<KeyInfo[]>> {
    try {
      if (!this.isValidPrivateKey(masterPrivateKey)) {
        throw new Error('Invalid master private key');
      }

      if (count <= 0 || count > 50) {
        throw new Error('Count must be between 1 and 50');
      }

      const keys: KeyInfo[] = [];
      
      // Simple derivation by adding incremental values to the master key
      // Note: This is a simplified approach. In production, use proper HD wallet derivation
      const masterKeyBigInt = BigInt('0x' + masterPrivateKey);
      
      for (let i = 0; i < count; i++) {
        const childKeyBigInt = (masterKeyBigInt + BigInt(i + 1)) % BigInt('0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141');
        const childKeyHex = childKeyBigInt.toString(16).padStart(64, '0');
        
        const result = await this.importPrivateKey({ privateKeyHex: childKeyHex, network });
        if (result.success && result.data) {
          keys.push(result.data);
        }
      }

      return {
        success: true,
        data: keys,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to derive child keys',
      };
    }
  }

  private isValidPrivateKey(privateKeyHex: string): boolean {
    // Remove '0x' prefix if present
    const cleanKey = privateKeyHex.startsWith('0x') ? privateKeyHex.slice(2) : privateKeyHex;
    
    // Check if it's a valid 64-character hex string
    if (!/^[0-9a-fA-F]{64}$/.test(cleanKey)) {
      return false;
    }

    // Check if the key is within the valid range for secp256k1
    const keyBigInt = BigInt('0x' + cleanKey);
    const maxKey = BigInt('0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141');
    
    return keyBigInt > BigInt(0) && keyBigInt < maxKey;
  }

  private getNetworkVersion(): 'mainnet' | 'testnet' {
    return this.network.chainId === 1 ? 'mainnet' : 'testnet';
  }
}
