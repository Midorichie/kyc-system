Kyc-user test suite
import { Clarinet, Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v0.31.0/index.ts';
import { assertEquals } from 'https://deno.land/std@0.90.0/testing/asserts.ts';

Clarinet.test({
  name: "Ensure data keys can be registered",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    
    // Register a data key
    let block = chain.mineBlock([
      Tx.contractCall('kyc-user', 'register-data-key', 
        [types.utf8("kyc-verification"), types.utf8("Basic KYC verification data")], 
        deployer.address)
    ]);
    
    // Assert success
    assertEquals(block.receipts[0].result.expectOk(), true);
    
    // Check if data key is valid
    let isValid = chain.callReadOnlyFn(
      'kyc-user', 'is-valid-data-key', [types.utf8("kyc-verification")], deployer.address
    );
    assertEquals(isValid.result.expectBool(), true);
  },
});

Clarinet.test({
  name: "Ensure users can store data and manage consent",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const user1 = accounts.get('wallet_1')!;
    const verifier = accounts.get('wallet_2')!;
    
    // Register a data key
    chain.mineBlock([
      Tx.contractCall('kyc-user', 'register-data-key', 
        [types.utf8("kyc-verification"), types.utf8("Basic KYC verification data")], 
        deployer.address)
    ]);
    
    // Store user data
    const dataHash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
    
    let block1 = chain.mineBlock([
      Tx.contractCall('kyc-user', 'store-data', 
        [types.utf8("kyc-verification"), types.buff(Buffer.from(dataHash.slice(2), 'hex'))], 
        user1.address)
    ]);
    
    // Assert success
    assertEquals(block1.receipts[0].result.expectOk(), true);
    
    // Check consent before granting
    let consentBefore = chain.callReadOnlyFn(
      'kyc-user', 'has-consent', 
      [types.principal(user1.address), types.utf8("kyc-verification"), types.principal(verifier.address)], 
      deployer.address
    );
    assertEquals(consentBefore.result.expectBool(), false);
    
    // Grant consent
    let block2 = chain.mineBlock([
      Tx.contractCall('kyc-user', 'grant-consent', 
        [types.utf8("kyc-verification"), types.principal(verifier.address)], 
        user1.address)
    ]);
    
    // Assert success
    assertEquals(block2.receipts[0].result.expectOk(), true);
    
    // Check consent after granting
    let consentAfter = chain.callReadOnlyFn(
      'kyc-user', 'has-consent', 
      [types.principal(user1.address), types.utf8("kyc-verification"), types.principal(verifier.address)], 
      deployer.address
    );
    assertEquals(consentAfter.result.expectBool(), true);
    
    // Revoke consent
    let block3 = chain.mineBlock([
      Tx.contractCall('kyc-user', 'revoke-consent', 
        [types.utf8("kyc-verification"), types.principal(verifier.address)], 
        user1.address)
    ]);
    
    // Assert success
    assertEquals(block3.receipts[0].result.expectOk(), true);
    
    // Check consent after revoking
    let consentRevoked = chain.callReadOnlyFn(
      'kyc-user', 'has-consent', 
      [types.principal(user1.address), types.utf8("kyc-verification"), types.principal(verifier.address)], 
      deployer.address
    );
    assertEquals(consentRevoked.result.expectBool(), false);
  },
});

Clarinet.test({
  name: "Ensure data keys can be deactivated",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const user1 = accounts.get('wallet_1')!;
    
    // Register a data key
    chain.mineBlock([
      Tx.contractCall('kyc-user', 'register-data-key', 
        [types.utf8("temporary-key"), types.utf8("Temporary data key")], 
        deployer.address)
    ]);
    
    // Check if data key is valid
    let isValidBefore = chain.callReadOnlyFn(
      'kyc-user', 'is-valid-data-key', [types.utf8("temporary-key")], deployer.address
    );
    assertEquals(isValidBefore.result.expectBool(), true);
    
    // Deactivate data key
    let block = chain.mineBlock([
      Tx.contractCall('kyc-user', 'deactivate-data-key', 
        [types.utf8("temporary-key")], 
        deployer.address)
    ]);
    
    // Assert success
    assertEquals(block.receipts[0].result.expectOk(), true);
    
    // Check if data key is no longer valid
    let isValidAfter = chain.callReadOnlyFn(
      'kyc-user', 'is-valid-data-key', [types.utf8("temporary-key")], deployer.address
    );
    assertEquals(isValidAfter.result.expectBool(), false);
    
    // Attempt to store data with deactivated key
    const dataHash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
    
    let block2 = chain.mineBlock([
      Tx.contractCall('kyc-user', 'store-data', 
        [types.utf8("temporary-key"), types.buff(Buffer.from(dataHash.slice(2), 'hex'))], 
        user1.address)
    ]);
    
    // Should fail with error code 203 (err-invalid-data-key)
    assertEquals(block2.receipts[0].result.expectErr(), 'u203');
  },
});
