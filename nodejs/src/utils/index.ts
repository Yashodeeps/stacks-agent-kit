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
};
