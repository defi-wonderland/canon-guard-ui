# Canon Guard: Complete Transaction Flow Guide

*Understanding Canon Guard's complete workflow from setup to execution*

## 🤔 What Problem Does Canon Guard Solve?

**Traditional Gnosis Safe Issue**: Owners must coordinate off-chain to collect signatures, then anyone can execute the transaction immediately. This creates risks:
- **Manual review fatigue**: Reviewing every transaction manually can lead to missed manipulated data
- **Front-running**: Bad actors can execute your signed transaction before you do
- **Accidental execution**: Wrong transactions get executed by mistake  
- **No time to react**: Once enough signatures are collected, execution is immediate

**Canon Guard Solution**: Add a **timelock layer** that gives you control over *when* transactions execute, not just *if* they execute.

---

## 🔄 Complete Canon Guard Flow

### Step 1: Setup the Guard

**What happens**: Deploy and configure the SafeEntrypoint contract as your Safe's guard.

**Process**:
1. **Deploy SafeEntrypoint** with your chosen delays:
   - SHORT_TX_EXECUTION_DELAY (e.g., 30 seconds - 1 hour)
   - LONG_TX_EXECUTION_DELAY (e.g., 24-48 hours)
   - TX_EXPIRY_DELAY (for how long transactions stay executable)

2. **Create SetGuard Action**: Deploy a SimpleAction to set the SafeEntrypoint as your Safe's guard

3. **Queue & Approve**: Queue the setGuard transaction and get Safe owner signatures

4. **Execute**: Execute the setGuard action

**Result**: Your Safe now routes ALL transactions through the Canon Guard system.

### Step 2: Deploy Transaction Builders

**What are Transaction Builders?**: Immutable contracts that define specific actions your Safe can perform.

**Examples**:
- **SimpleTransfers**: Transfer specific tokens to specific recipients
- **CappedTokenTransfers**: Rate-limited transfers that reset over time
- **SimpleActions**: Execute any contract call

**Deploy Process**:
1. Configure the action (token address, recipient, amount)
2. Deploy the transaction builder contract
3. Result: Creates an immutable contract for that specific action

**Key Point**: Each transaction builder defines ONE specific action that never changes.

### Step 3: Understanding the Queue System

**What is the Queue?**: A holding area where approved transactions wait before they can be executed.

**Why Queue Transactions?**: 
- Provides time delays for security
- Allows review and intervention
- Prevents immediate execution attacks

**Queue Process**:
1. **Queue Transaction**: Add a transaction builder to the queue
2. **Delay Period**: Wait for the required time (short or long delay)
3. **Execution Window**: Transaction becomes executable
4. **Expiry**: Transaction expires if not executed

---

## 🛤️ Fast Path vs Slow Path

### Fast Path (Pre-approved)
**When**: Action Builder or Hub is pre-approved
**Delay**: SHORT_TX_EXECUTION_DELAY (30 seconds - 1 hour)
**Use Cases**: Common, recurring transactions you trust

### Slow Path (Non-approved)  
**When**: Action Builder is not pre-approved
**Delay**: LONG_TX_EXECUTION_DELAY (24-48 hours)
**Use Cases**: New or one-off transactions that need review

---

## 🚀 How to Execute Transactions

### Method 1: Direct Action Builder Execution

1. **Queue the Transaction**:
   - Specify the action builder address
   - System determines fast/slow path based on approval status

2. **Approve the Transaction**:
   - Safe owners call `safe.approveHash()` with transaction hash
   - Collect required number of signatures

3. **Execute the Transaction**:
   - Anyone can execute once delay period passes
   - Must happen before expiry time

### Method 2: Hub-Based Execution

**What are Hubs?**: Factory contracts that create multiple related action builders.

**Example**: CappedTokenTransfersHub creates rate-limited transfer actions
- Set spending caps per epoch (e.g., $1000/week)
- Create transfers up to the limit
- Automatically resets each epoch

---

## ⚡ Pre-Approval System Explained

### What is Pre-Approval?
Pre-approval puts an Action Builder or Hub on the "fast path" - shorter delays for trusted actions.

### How to Pre-Approve:
**Process**:
1. **Deploy ApproveAction**: Creates a contract that approves another action builder
2. **Set Duration**: Define how long the approval lasts
3. **Execute**: Queue and execute the approval action

**Result**: The approved action builder now uses SHORT_TX_EXECUTION_DELAY instead of LONG_TX_EXECUTION_DELAY.

### Why Pre-Approve?
- **One-time review**: Review common transactions once, trust them until expiration
- **Faster execution**: Skip long delays for routine operations
- **Less manual work**: Stop reviewing identical payroll/transfer transactions repeatedly

---

## 🔍 Transaction Approval vs Pre-Approval

### Transaction Approval (Required for ALL transactions)
- **What**: Safe owners signing a specific transaction hash
- **When**: Every single transaction needs this
- **How**: `safe.approveHash()` called by each owner
- **Purpose**: Maintains Safe's signature security

### Pre-Approval (Optional, for faster execution)
- **What**: Marking an Action Builder/Hub as "trusted"
- **When**: Done once for recurring transaction types
- **How**: Deploy and execute an ApproveAction
- **Purpose**: Reduces delay time from long to short

---

## 🏗️ Core Components

### SafeEntrypoint
- **Role**: Main Canon Guard contract attached to your Safe
- **Function**: Manages the queue, delays, and execution logic
- **Configuration**: Short/long delays, expiry times, emergency controls

### Action Builders
- **Role**: Immutable contracts defining specific transactions
- **Examples**: Transfer 100 USDC to Alice, Swap ETH for DAI
- **Security**: Can't be changed once deployed - what you approve is what executes

### Hubs
- **Role**: Factory contracts that create related Action Builders
- **Examples**: PayrollHub (multiple employee transfers), DeFiHub (multiple position actions)
- **Benefit**: Approve the hub once, trust all actions it creates

---

## 🔧 Security Benefits

### Hack Protection
**Time buffer prevents immediate damage** if your Safe gets compromised:
- Hacker can't execute transactions immediately
- Long delay (24+ hours) gives you time to react and stop malicious transactions
- Review suspicious activity before it's too late

### One-Time Review for Common Actions  
**Stop reviewing the same transactions repeatedly**:
- Pre-approve common transactions once (payroll, regular transfers)
- Skip the hassle of manually reviewing identical transactions
- Trust the same transaction pattern until expiration (weeks/months away)

### Immutable Security
**Action Builders can't be changed after deployment**:
- Transfer $1000 to Alice daily ✅  
- Can't be modified to transfer $1M to Bob ❌
- What you pre-approve is exactly what executes

---

## 💡 Key Terms

- **Queue**: Where approved transactions wait during their delay period
- **Action Builder**: Immutable contract defining a specific transaction
- **Hub**: Factory that creates multiple related Action Builders
- **Pre-approval**: Marking builders/hubs as trusted for faster execution
- **Transaction Approval**: Safe owners signing specific transaction hashes
- **Fast Path**: Short delay for pre-approved actions
- **Slow Path**: Long delay for non-approved actions
- **Execution Window**: Time period when queued transactions can be executed

---

## 🎯 The Complete Picture

Canon Guard transforms your Safe workflow:

**Traditional**: Sign → Execute Immediately → Hope Nothing Goes Wrong

**Canon Guard**: Sign → Queue → Wait (Review Time) → Execute → Peace of Mind

**Benefits**:
- 🛡️ **Hack protection** - Time to stop malicious transactions  
- ⚡ **Skip repeated reviews** - Pre-approve common actions once
- ⏰ **Time to think** - Buffer before critical transactions execute
- 🔒 **Front-run protection** - Controlled execution timing
- 🤖 **Automated safety** - Immutable action builders you can trust

*Result: All the flexibility of a multisig, with hack protection and dramatically less manual review work.*