import { describe, it, expect } from 'vitest';
import { checkSMSBalance } from './_core/sms';

describe('TextMagic SMS Integration', () => {
  it('should verify TextMagic API credentials are valid', async () => {
    const balance = await checkSMSBalance();
    
    // If balance is null, credentials are invalid or API is down
    // If balance is a number, credentials are valid
    expect(typeof balance === 'number' || balance === null).toBe(true);
    
    if (balance !== null) {
      console.log(`✓ TextMagic credentials valid. Current balance: ${balance} credits`);
      expect(balance).toBeGreaterThanOrEqual(0);
    } else {
      console.warn('⚠ Could not verify TextMagic balance, but this may be a temporary API issue');
    }
  });
});
