Kyc verifier test suite
import { Clarinet, Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v0.31.0/index.ts';
import { assertEquals } from 'https://deno.land/std@0.90.0/testing/asserts.ts';

Clarinet.test({
  name: "Ensure verification limits can be set",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const verifier = accounts.get('wallet_2')!;
    
    // Set verification limit
    let block = chain.mineBlock([
      Tx.contractCall('kyc-verifier', 'set-verification-limit', 
        [types.principal(verifier.address), types.uint(500)], 
        deployer.address)
    ]);
    
    // Assert success
    assertEquals(block.receipts[0].result.expectOk(), true);
    
    // Check verification limit
    let limit = chain.callReadOnlyFn(
      'kyc-verifier', 'get-verification-limit', [types.principal(verifier.address)], deployer.address
    );
    assertEquals(limit.result.expectUint(), 500);
  },
});

Clarinet.test({
  name: "Ensure verification counts can be reset",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const verifier = accounts.get('wallet_2')!;
    
    // Check initial verification count
    let initialCount = chain.callReadOnlyFn(
      'kyc-verifier', 'get-verification-count', [types.principal(verifier.address)], deployer.address
    );
    assertEquals(initialCount.result.expectUint(), 0);
    
    // Reset verification count (even though it's already 0)
    let block = chain.mineBlock([
      Tx.contractCall('kyc-verifier', 'reset-verification-count', 
        [types.principal(verifier.address)], 
        deployer.address)
    ]);
    
    // Assert success
    assertEquals(block.receipts[0].result.expectOk(), true);
    
    // Check verification count after reset
    let countAfterReset = chain.callReadOnlyFn(
      'kyc-verifier', 'get-verification-count', [types.principal(verifier.address)], deployer.address
    );
    assertEquals(countAfterReset.result.expectUint(), 0);
  },
});

// Note: Testing the full verification flow would require integration tests that involve
// all three contracts. This would be done in a separate test file or by extending these tests.
