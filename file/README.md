# Blockchain-Based KYC System

A decentralized Know Your Customer (KYC) verification system built on the Stacks blockchain, allowing users to control their identity data while enabling compliant verification processes.

## Overview

This system enables:
- Users to own and control their identity data
- Verifiers to perform KYC checks and store verification results on-chain
- Applications to verify user identity without accessing raw personal data
- Regulatory compliance with privacy-preserving features

## Architecture

The system consists of three main smart contracts:

1. **KYC Registry**: Central registry tracking verification status of users
2. **KYC User**: Manages user identity data and consent mechanisms
3. **KYC Verifier**: Handles verification logic and approved verifier entities

## Technical Stack

- **Blockchain**: Stacks (Bitcoin Layer)
- **Smart Contract Language**: Clarity
- **Development Environment**: Clarinet
- **Testing Framework**: Clarinet's built-in testing tools

## Security Features

### Access Control
- Contract ownership validation using `tx-sender`
- Fine-grained authorization for critical operations
- Separation of admin and user operations

### Data Privacy
- Only data hashes stored on-chain (no personal information)
- Explicit consent management system
- Selective disclosure controls

### Verification Security
- Verification expiration to prevent stale data usage
- Verification limit mechanisms to prevent abuse
- Revocation capabilities for compromised verifications

### Error Handling
- Comprehensive error codes and descriptive messages
- Proper validation of all inputs and state changes
- Defensive programming practices

### Audit Trails
- Timestamps for all critical operations
- Complete history of consent grants and revocations
- Tracking of verification activities

## Smart Contract Design

### KYC Registry Contract
- Manages the global registry of verified users
- Controls verifier approvals and removals
- Provides central verification status lookup

### KYC User Contract
- Stores user identity data hashes (not raw data)
- Manages explicit user consent for data access
- Controls which data types can be stored

### KYC Verifier Contract
- Implements verification processes with security constraints
- Enforces verification limits and expiration
- Provides verification status validation

## Development Setup

### Prerequisites

- [Clarinet](https://github.com/hirosystems/clarinet) installed
- [Node.js](https://nodejs.org/) (for testing)
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/kyc-system.git
cd kyc-system

# Set up development environment
npm install
```

### Running Tests

```bash
clarinet test
```

## Test Coverage

The system includes comprehensive test suites:
- Unit tests for individual contract functions
- Integration tests for cross-contract interactions
- Negative test cases for security validation

## License

[MIT License](LICENSE)
