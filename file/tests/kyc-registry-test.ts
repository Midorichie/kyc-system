Kyc-registry test suite
import { Clarinet, Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v0.31.0/index.ts';
import { assertEquals } from 'https://deno.land/std@0.90.0/testing/asserts.ts';

Clarinet.test({
  name: "Ensure users can register successfully",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const user1 = accounts.get('wallet_1')!;
    
    let block = chain.mineBlock([
      Tx.contractCall('kyc-registry', 'register-user', [], user1.address)
    ]);
    
    // Assert transaction success
    assertEquals(block.receipts[0].result.expectOk(), true);
    
    // Check user is registered but not verified
    let isRegistered = chain.callReadOnlyFn(
      'kyc-registry', 'is-registered', [types.principal(user1.address)], deployer.address
    );
    assertEquals(isRegistered.result.expectBool(), true);
    
    let isVerified = chain.callReadOnlyFn(
      'kyc-registry', 'is-verified', [types.principal(user1.address)], deployer.address
    );
    assertEquals(isVerified.result.expectBool(), false);
  },
});

Clarinet.test({
  name: "Ensure users cannot register twice",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const user1 = accounts.get('wallet_1')!;
    
    // Register once
    let block1 = chain.mineBlock([
      Tx.contractCall('kyc-registry', 'register-user', [], user1.address)
    ]);
    assertEquals(block1.receipts[0].result.expectOk(), true);
    
    // Try to register again
    let block2 = chain.mineBlock([
      Tx.contractCall('kyc-registry', 'register-user', [], user1.address)
    ]);
    
    // Should fail with error code 101 (err-already-registered)
    assertEquals(block2.receipts[0].result.expectErr(), 'u101');
  },
});

Clarinet.test({
  name: "Ensure only contract owner can add verifiers",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const user1 = accounts.get('wallet_1')!;
    const verifier = accounts.get('wallet_2')!;
    
    // Try to add verifier from non-owner account
    let block1 = chain.mineBlock([
      Tx.contractCall('kyc-registry', 'add-verifier', 
        [types.principal(verifier.address), types.utf8("Test Verifier")], 
        user1.address)
    ]);
    
    // Should fail with error code 100 (err-not-authorized)
    assertEquals(block1.receipts[0].result.expectErr(), 'u100');
    
    // Add verifier from owner account
    let block2 = chain.mineBlock([
      Tx.contractCall('kyc-registry', 'add-verifier', 
        [types.principal(verifier.address), types.utf8("Test Verifier")], 
        deployer.address)
    ]);
    
    // Should succeed
    assertEquals(block2.receipts[0].result.expectOk(), true);
    
    // Verify the verifier status
    let isVerifier = chain.callReadOnlyFn(
      'kyc-registry', 'is-verifier', [types.principal(verifier.address)], deployer.address
    );
    assertEquals(isVerifier.result.expectBool(), true);
  },
});

Clarinet.test({
  name: "Ensure only approved verifiers can verify users",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const user1 = accounts.get('wallet_1')!;
    const verifier = accounts.get('wallet_2')!;
    const unauthorized = accounts.get('wallet_3')!;
    
    // Register user
    chain.mineBlock([
      Tx.contractCall('kyc-registry', 'register-user', [], user1.address)
    ]);
    
    // Add verifier
    chain.mineBlock([
      Tx.contractCall('kyc-registry', 'add-verifier', 
        [types.principal(verifier.address), types.utf8("Test Verifier")], 
        deployer.address)
    ]);
    
    // Try to verify from unauthorized account
    let block1 = chain.mineBlock([
      Tx.contractCall('kyc-registry', 'verify-user', 
        [types.principal(user1.address)], 
        unauthorized.address)
    ]);
    
    // Should fail with error code 100 (err-not-authorized)
    assertEquals(block1.receipts[0].result.expectErr(), 'u100');
    
    // Verify from approved verifier
    let block2 = chain.mineBlock([
      Tx.contractCall('kyc-registry', 'verify-user', 
        [types.principal(user1.address)], 
        verifier.address)
    ]);
    
    // Should succeed
    assertEquals(block2.receipts[0].result.expectOk(), true);
    
    // Check user is now verified
    let isVerified = chain.callReadOnlyFn(
      'kyc-registry', 'is-verified', [types.principal(user1.address)], deployer.address
    );
    assertEquals(isVerified.result.expectBool(), true);
  },
});

Clarinet.test({
  name: "Ensure verifiers can be removed",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const verifier = accounts.get('wallet_2')!;
    
    // Add verifier
    chain.mineBlock([
      Tx.contractCall('kyc-registry', 'add-verifier', 
        [types.principal(verifier.address), types.utf8("Test Verifier")], 
        deployer.address)
    ]);
    
    // Verify verifier is active
    let isVerifierBefore = chain.callReadOnlyFn(
      'kyc-registry', 'is-verifier', [types.principal(verifier.address)], deployer.address
    );
    assertEquals(isVerifierBefore.result.expectBool(), true);
    
    // Remove verifier
    let block = chain.mineBlock([
      Tx.contractCall('kyc-registry', 'remove-verifier', 
        [types.principal(verifier.address)], 
        deployer.address)
    ]);
    
    // Should succeed
    assertEquals(block.receipts[0].result.expectOk(), true);
    
    // Verify verifier is no longer active
    let isVerifierAfter = chain.callReadOnlyFn(
      'kyc-registry', 'is-verifier', [types.principal(verifier.address)], deployer.address
    );
    assertEquals(isVerifierAfter.result.expectBool(), false);
  },
});
