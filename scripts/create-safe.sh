#!/usr/bin/env bash
#
# Script to deploy a new 1/1 Safe wallet on a local Anvil fork
# Uses the SafeProxyFactory contract and Foundry's cast tool
#

set -euo pipefail

# ============================================================================
# Configuration
# ============================================================================

RPC_URL="${RPC_URL:-http://127.0.0.1:8545}"

# Safe v1.4.1 deployment addresses (same across all EVM chains)
SAFE_PROXY_FACTORY="0x4e1DCf7AD4e460CfD30791CCC4F9c8a4f820ec67"
SAFE_SINGLETON="0x41675C099F32341bf84BFc5382aF534df5C7461a"
FALLBACK_HANDLER="0xf48f2B2d2a534e402487b3ee7C18c33Aec0Fe5e4"

# Anvil's well-known private key for account 0
ANVIL_PRIVATE_KEY="0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"

# ============================================================================
# Helper Functions
# ============================================================================

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"
}

error() {
    echo "[ERROR] $*" >&2
    exit 1
}

# ============================================================================
# Main Script
# ============================================================================

log "Deploying new Safe wallet to $RPC_URL"

# Fetch the first Anvil account dynamically
log "Fetching Anvil accounts..."
ANVIL_ACCOUNTS=$(cast rpc eth_accounts --rpc-url "$RPC_URL" 2>/dev/null) || error "Failed to fetch accounts. Is Anvil running at $RPC_URL?"

# Parse the first account from the JSON array
OWNER=$(echo "$ANVIL_ACCOUNTS" | tr -d '[]" ' | cut -d',' -f1)
if [[ -z "$OWNER" || "$OWNER" == "null" ]]; then
    error "Could not get first Anvil account"
fi

log "Using owner address: $OWNER"
log "Safe Singleton: $SAFE_SINGLETON"
log "SafeProxyFactory: $SAFE_PROXY_FACTORY"
log "Fallback Handler: $FALLBACK_HANDLER"

# Generate a unique salt nonce using current timestamp
SALT_NONCE=$(date +%s)
log "Salt nonce: $SALT_NONCE"

# Encode the setup initializer data
# setup(address[],uint256,address,bytes,address,address,uint256,address)
#   - owners: [OWNER]
#   - threshold: 1
#   - to: address(0) - no delegate call
#   - data: 0x - empty
#   - fallbackHandler: FALLBACK_HANDLER
#   - paymentToken: address(0) - native token
#   - payment: 0
#   - paymentReceiver: address(0)

log "Encoding setup initializer..."
INITIALIZER=$(cast calldata "setup(address[],uint256,address,bytes,address,address,uint256,address)" \
    "[$OWNER]" \
    1 \
    "0x0000000000000000000000000000000000000000" \
    "0x" \
    "$FALLBACK_HANDLER" \
    "0x0000000000000000000000000000000000000000" \
    0 \
    "0x0000000000000000000000000000000000000000")

log "Initializer data: $INITIALIZER"

# Deploy the Safe proxy
log "Deploying Safe proxy via createProxyWithNonce..."
TX_OUTPUT=$(cast send "$SAFE_PROXY_FACTORY" \
    "createProxyWithNonce(address,bytes,uint256)" \
    "$SAFE_SINGLETON" \
    "$INITIALIZER" \
    "$SALT_NONCE" \
    --rpc-url "$RPC_URL" \
    --private-key "$ANVIL_PRIVATE_KEY" \
    --json)

# Extract transaction hash
TX_HASH=$(echo "$TX_OUTPUT" | jq -r '.transactionHash')
if [[ -z "$TX_HASH" || "$TX_HASH" == "null" ]]; then
    error "Failed to get transaction hash from output"
fi

log "Transaction hash: $TX_HASH"

# Get the transaction receipt to find the deployed Safe address
# The ProxyCreation event signature: ProxyCreation(address indexed proxy, address singleton)
# Event topic: keccak256("ProxyCreation(address,address)")
PROXY_CREATION_TOPIC="0x4f51faf6c4561ff95f067657e43439f0f856d97c04d9ec9070a6199ad418e235"

# Get logs from the transaction receipt
RECEIPT=$(cast receipt "$TX_HASH" --rpc-url "$RPC_URL" --json)

# Extract the Safe address from the ProxyCreation event
# The proxy address is the first indexed parameter (topic[1])
SAFE_ADDRESS=$(echo "$RECEIPT" | jq -r ".logs[] | select(.topics[0] == \"$PROXY_CREATION_TOPIC\") | .topics[1]" | head -1)

if [[ -z "$SAFE_ADDRESS" || "$SAFE_ADDRESS" == "null" ]]; then
    # Fallback: try to get from the event data or logs address
    SAFE_ADDRESS=$(echo "$RECEIPT" | jq -r ".logs[] | select(.topics[0] == \"$PROXY_CREATION_TOPIC\") | .address" | head -1)
fi

if [[ -z "$SAFE_ADDRESS" || "$SAFE_ADDRESS" == "null" ]]; then
    error "Could not extract Safe address from transaction logs"
fi

# Convert topic (32 bytes) to address (20 bytes) - remove leading zeros
if [[ ${#SAFE_ADDRESS} -eq 66 ]]; then
    # It's a 32-byte topic, extract the address (last 40 hex chars + 0x prefix)
    SAFE_ADDRESS="0x${SAFE_ADDRESS:26}"
fi

# Verify the Safe was deployed correctly by checking owners
log "Verifying Safe deployment..."
OWNERS=$(cast call "$SAFE_ADDRESS" "getOwners()(address[])" --rpc-url "$RPC_URL" 2>/dev/null) || error "Failed to verify Safe deployment"
THRESHOLD=$(cast call "$SAFE_ADDRESS" "getThreshold()(uint256)" --rpc-url "$RPC_URL" 2>/dev/null) || error "Failed to get threshold"

log ""
log "============================================"
log "Safe deployed successfully!"
log "============================================"
log "Safe Address: $SAFE_ADDRESS"
log "Owner(s): $OWNERS"
log "Threshold: $THRESHOLD"
log "============================================"

echo "$SAFE_ADDRESS"
