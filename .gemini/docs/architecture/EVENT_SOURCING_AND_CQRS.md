# Event Sourcing and CQRS Implementation Guide

## Table of Contents
1. [Introduction](#introduction)
2. [What is Event Sourcing?](#what-is-event-sourcing)
3. [What is CQRS?](#what-is-cqrs)
4. [How They Work Together](#how-they-work-together)
5. [Architecture Overview](#architecture-overview)
6. [Implementation Details](#implementation-details)
7. [Step-by-Step Example](#step-by-step-example)
8. [Key Components](#key-components)
9. [Benefits and Trade-offs](#benefits-and-trade-offs)
10. [Common Patterns in This Project](#common-patterns-in-this-project)

---

## Introduction

This document explains how **Event Sourcing** and **CQRS** (Command Query Responsibility Segregation) are implemented in this Personal Finance Tracker application. If you're new to these concepts, this guide will help you understand both the theory and the practical implementation in our codebase.

---

## What is Event Sourcing?

### Traditional Approach vs Event Sourcing

**Traditional Approach:**
```
State-based storage - We only save the current state
┌─────────────────┐
│ Account Table   │
├─────────────────┤
│ ID: 123         │
│ Balance: $1000  │ ← We only store current state
└─────────────────┘
```

**Event Sourcing:**
```
Event-based storage - We save ALL events that happened
┌─────────────────────────────────────────┐
│ Events Table (Event Store)               │
├─────────────────────────────────────────┤
│ 1. AccountCreated (balance: $0)         │
│ 2. MoneyDeposited ($500)                │
│ 3. MoneyDeposited ($500)                │
│ 4. MoneyWithdrawn ($100)                │
│ 5. MoneyDeposited ($100)                │
└─────────────────────────────────────────┘
Current balance = $0 + $500 + $500 - $100 + $100 = $1000
```

### Key Concepts

1. **Events are Immutable**: Once created, events never change. They represent facts about what happened.
2. **Event Store**: All events are stored in chronological order.
3. **State Reconstruction**: Current state is calculated by replaying all events from the beginning.
4. **Complete History**: You have a complete audit trail of everything that happened.

### Why Event Sourcing?

- **Audit Trail**: Every change is recorded
- **Time Travel**: Can reconstruct state at any point in time
- **Debugging**: See exactly what happened and in what order
- **Business Intelligence**: Analyze all historical events
- **Flexibility**: Can create new read models from existing events

---

## What is CQRS?

### Traditional Approach vs CQRS

**Traditional Approach:**
```
Single model for both reads and writes
┌──────────────────────────────────────┐
│          Database                     │
│  ┌────────────────────────────────┐  │
│  │      Account Table              │  │
│  │  (used for both reads & writes) │  │
│  └────────────────────────────────┘  │
└──────────────────────────────────────┘
```

**CQRS:**
```
Separate models for reads and writes
┌──────────────────────────────────────────┐
│  Command Side (Write)                    │
│  ┌────────────────────────────────────┐  │
│  │  Aggregates + Events               │  │
│  │  (Optimized for writes)            │  │
│  └────────────────────────────────────┘  │
│                  ↓                        │
│            Event Bus                     │
│                  ↓                        │
│  Query Side (Read)                       │
│  ┌────────────────────────────────────┐  │
│  │  Read Models (Denormalized)         │  │
│  │  (Optimized for reads)              │  │
│  └────────────────────────────────────┘  │
└──────────────────────────────────────────┘
```

### Key Concepts

1. **Command Side (Write)**: Handles all write operations
   - Uses aggregates to enforce business rules
   - Stores events in the event store
   - Publishes events to event bus

2. **Query Side (Read)**: Handles all read operations
   - Uses optimized read models (denormalized data)
   - Updated asynchronously via event handlers
   - Can have multiple read models for different queries

3. **Separation of Concerns**: Commands and queries are completely separated

### Why CQRS?

- **Performance**: Optimize read and write models independently
- **Scalability**: Scale read and write sides independently
- **Flexibility**: Can have multiple read models for different use cases
- **Complexity Management**: Separate complex business logic from query logic

---

## How They Work Together

Event Sourcing and CQRS work perfectly together:

1. **Command Side**: Uses Event Sourcing to store events
2. **Events**: Trigger updates to read models
3. **Query Side**: Uses optimized read models populated from events

```
┌─────────────────────────────────────────────────────────────┐
│                    Command Flow                              │
├─────────────────────────────────────────────────────────────┤
│  1. User sends command (e.g., "Deposit $100")              │
│  2. Command Handler loads aggregate from events             │
│  3. Aggregate validates and creates event                   │
│  4. Event Store saves the event                            │
│  5. Event Bus publishes event                              │
│  6. Read Model Handlers update read models                  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    Query Flow                                │
├─────────────────────────────────────────────────────────────┤
│  1. User sends query (e.g., "Get balance")                  │
│  2. Query Service reads from optimized read model          │
│  3. Returns result immediately                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Architecture Overview

### High-Level Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                      Client Layer                             │
│  ┌──────────────┐         ┌──────────────┐                  │
│  │   Commands   │         │    Queries   │                  │
│  │  (POST/PUT)  │         │    (GET)     │                  │
│  └──────┬───────┘         └──────┬───────┘                  │
└─────────┼─────────────────────────┼──────────────────────────┘
          │                         │
          ▼                         ▼
┌─────────────────┐         ┌─────────────────┐
│ Command Handler │         │  Query Service  │
│                 │         │                 │
│ - Load Aggregate│         │ - Read Model    │
│ - Execute       │         │ - Cache         │
│ - Save Events   │         │ - Fast Reads   │
└─────────┬───────┘         └─────────────────┘
          │
          ▼
┌─────────────────────────────────────────┐
│         Event Store (PostgreSQL)        │
│  - Stores all events                    │
│  - Optimistic concurrency control       │
│  - Event history                        │
└─────────┬───────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────┐
│         Event Bus (Redis)               │
│  - Publishes events                     │
│  - Subscribes handlers                  │
└─────────┬───────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────┐
│      Read Model Handlers                 │
│  - Listen to events                     │
│  - Update read models                   │
│  - Update cache                         │
└─────────┬───────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────┐
│      Read Models (PostgreSQL)            │
│  - AccountBalance                        │
│  - TransactionHistory                    │
│  - BudgetReadModel                      │
└─────────────────────────────────────────┘
```

---

## Implementation Details

### 1. Domain Events

Every event in the system follows this structure:

```typescript
interface DomainEvent {
  eventId: string;           // Unique event identifier
  aggregateId: string;        // Which aggregate this event belongs to
  aggregateType: string;      // Type of aggregate (Account, Budget, etc.)
  eventType: string;          // Type of event (AccountCreated, MoneyDeposited, etc.)
  eventData: Record<string, any>;  // Event payload
  occurredOn: Date;          // When the event happened
  version: number;            // Event version (for concurrency control)
}
```

**Location:** `src/common/domain/domain-event.interface.ts`

### 2. Aggregate Root

Aggregates are the core business entities. They:
- Enforce business rules
- Generate events when state changes
- Can be reconstructed from events

**Key Methods:**
- `apply(event)`: Applies an event and adds it to uncommitted events
- `loadFromHistory(events)`: Reconstructs state from events
- `getUncommittedEvents()`: Returns events that haven't been saved yet

**Location:** `src/common/aggregates/aggregate-root.ts`

**Example from Account Aggregate:**
```typescript
// When depositing money, we don't directly change balance
// Instead, we create and apply an event
deposit(amount: number): void {
  const event = this.createEvent('MoneyDeposited', 'Account', {
    amount,
    transactionId: uuidv4(),
  });
  this.apply(event); // This will update balance in handle() method
}

// The handle() method applies the event to change internal state
protected handle(event: DomainEvent): void {
  switch (event.eventType) {
    case 'MoneyDeposited':
      this.balance += event.eventData.amount; // Update state
      break;
    // ... other events
  }
}
```

**Location:** `src/account/domain/account.aggregate.ts`

### 3. Event Store

The Event Store is the source of truth. It:
- Stores all events in PostgreSQL
- Provides optimistic concurrency control
- Allows reconstruction of aggregates

**Key Methods:**
- `appendEvents()`: Saves new events with version checking
- `getEvents()`: Retrieves all events for an aggregate
Retrieves all events for an aggregate
**Location:** `src/common/event-store/event-store.service.ts`

**Optimistic Concurrency Control:**
```typescript
// When saving, we check if version matches
if (lastEvent && lastEvent.version !== expectedVersion) {
  throw new Error('Concurrency conflict');
}
// This prevents two users from modifying the same aggregate simultaneously
```

### 4. Command Handlers

Command Handlers orchestrate the command flow:
1. Load aggregate from event store
2. Execute command on aggregate
3. Save new events to event store
4. Publish events to event bus

**Location:** `src/account/commands/account.command-handler.ts`

**Example Flow:**
```typescript
async depositMoney(accountId: string, amount: number): Promise<void> {
  // 1. Load aggregate from events
  const account = await this.loadAccount(accountId);
  
  // 2. Execute command (creates event internally)
  account.deposit(amount);
  
  // 3. Save events and publish
  await this.saveAccount(account);
}

private async loadAccount(accountId: string): Promise<Account> {
  // Get all events for this account
  const events = await this.eventStore.getEvents(accountId, 'Account');
  
  // Create account and replay events
  const account = new Account(accountId);
  account.loadFromHistory(events);
  return account;
}

private async saveAccount(account: Account): Promise<void> {
  const events = account.getUncommittedEvents();
  
  // Save to event store (with version checking)
  await this.eventStore.appendEvents(
    account.getId(),
    'Account',
    events,
    account.getVersion() - events.length,
  );
  
  // Publish to event bus
  for (const event of events) {
    await this.eventBus.publish(event);
  }
  
  // Clear uncommitted events
  account.markEventsAsCommitted();
}
```

### 5. Event Bus

The Event Bus is responsible for:
- Publishing events to Redis channels
- Subscribing handlers to event types
- Distributing events to handlers

**Location:** `src/common/event-bus/event-bus.service.ts`

**How it works:**
```typescript
// Publishing
async publish(event: DomainEvent): Promise<void> {
  const channel = `event:${event.eventType}`;
  await this.publisher.publish(channel, JSON.stringify(event));
}

// Subscribing
subscribe(eventType: string, handler: (event) => Promise<void>): void {
  this.handlers.get(eventType).push(handler);
}
```

### 6. Read Model Handlers

Read Model Handlers listen to events and update read models:
1. Subscribe to specific event types
2. When event arrives, update the read model
3. Update cache if needed

**Location:** `src/account/read-models/account-read-model.handler.ts`

**Example:**
```typescript
async onModuleInit() {
  // Subscribe to events
  this.eventBus.subscribe('MoneyDeposited', (event) =>
    this.handleMoneyDeposited(event),
  );
}

private async handleMoneyDeposited(event: DomainEvent): Promise<void> {
  // Update read model
  await this.updateAccountBalance(
    event.aggregateId,
    event.eventData.amount,
    'add',
  );
  
  // Create transaction record
  const transaction = new TransactionHistory();
  transaction.accountId = event.aggregateId;
  transaction.transactionType = 'DEPOSIT';
  transaction.amount = event.eventData.amount;
  await this.transactionHistoryRepository.save(transaction);
  
  // Update cache
  await this.updateBalanceCache(event.aggregateId, newBalance);
}
```

### 7. Query Services

Query Services provide fast read access:
- Read from optimized read models (not event store)
- Use caching for frequently accessed data
- Provide simple, fast queries

**Location:** `src/account/queries/account.query.service.ts`

**Example:**
```typescript
async getAccountBalance(accountId: string) {
  // Try cache first
  const cachedBalance = await this.redis.get(`account:balance:${accountId}`);
  if (cachedBalance !== null) {
    return parseFloat(cachedBalance);
  }
  
  // Fallback to read model
  const accountBalance = await this.accountBalanceRepository.findOne({
    where: { accountId },
  });
  
  return accountBalance.balance;
}
```

---

## Step-by-Step Example

Let's trace a complete flow: **Depositing $100 into an account**

### Step 1: Client Sends Command
```http
POST /accounts/abc-123/deposit
{
  "amount": 100,
  "description": "Salary"
}
```

### Step 2: Command Controller Receives Request
```typescript
// src/account/commands/account.command.controller.ts
async depositMoney(@Param('id') accountId: string, @Body() dto: DepositMoneyDto) {
  await this.commandHandler.depositMoney(accountId, dto.amount, dto.description);
}
```

### Step 3: Command Handler Loads Aggregate
```typescript
// src/account/commands/account.command-handler.ts
async depositMoney(accountId: string, amount: number) {
  // Load account by replaying events
  const account = await this.loadAccount(accountId);
  // Events from event store:
  // 1. AccountCreated (balance: $0)
  // 2. MoneyDeposited ($50) - previous deposit
  
  // Account now has balance = $50
}
```

### Step 4: Aggregate Executes Command
```typescript
// src/account/domain/account.aggregate.ts
account.deposit(amount, description);
// Inside deposit():
// - Validates amount > 0
// - Creates MoneyDeposited event
// - Calls apply(event)
// - apply() calls handle(event)
// - handle() updates balance: $50 + $100 = $150
// - Event added to uncommittedEvents array
```

### Step 5: Command Handler Saves Events
```typescript
await this.saveAccount(account);

// Inside saveAccount():
// 1. Get uncommitted events: [MoneyDeposited event]
// 2. Save to event store with version check
await this.eventStore.appendEvents(
  accountId,
  'Account',
  events,
  2, // Expected version (we had 2 events before)
);

// Event Store now has:
// 1. AccountCreated (version: 1)
// 2. MoneyDeposited $50 (version: 2)
// 3. MoneyDeposited $100 (version: 3) ← NEW EVENT
```

### Step 6: Events Published to Event Bus
```typescript
for (const event of events) {
  await this.eventBus.publish(event);
}

// Event published to Redis channel: "event:MoneyDeposited"
```

### Step 7: Read Model Handler Receives Event
```typescript
// src/account/read-models/account-read-model.handler.ts
private async handleMoneyDeposited(event: DomainEvent) {
  // Update AccountBalance read model
  const accountBalance = await this.accountBalanceRepository.findOne({
    where: { accountId: event.aggregateId },
  });
  accountBalance.balance = 150; // Updated
  await this.accountBalanceRepository.save(accountBalance);
  
  // Create TransactionHistory record
  const transaction = new TransactionHistory();
  transaction.accountId = event.aggregateId;
  transaction.transactionType = 'DEPOSIT';
  transaction.amount = 100;
  // ... save transaction
  
  // Update Redis cache
  await this.redis.set('account:balance:abc-123', '150');
}
```

### Step 8: Query Returns Updated Balance
```http
GET /accounts/abc-123/balance
→ Returns: { accountId: "abc-123", balance: 150 }
```

**Key Point:** The query reads from the optimized `AccountBalance` read model, NOT from the event store. This makes queries fast!

---

## Key Components

### Project Structure

```
src/
├── account/              # Account domain module
│   ├── commands/         # Command side
│   │   ├── account.command.controller.ts     # REST API for commands
│   │   ├── account.command-handler.ts        # Command orchestration
│   │   └── *.command.ts                      # Command DTOs
│   ├── queries/          # Query side
│   │   ├── account.query.controller.ts       # REST API for queries
│   │   └── account.query.service.ts          # Query service
│   ├── domain/          # Domain layer
│   │   ├── account.aggregate.ts              # Aggregate root
│   │   └── events/                           # Event definitions
│   └── read-models/     # Read model handlers
│       ├── account-read-model.handler.ts      # Event subscriber
│       ├── account-balance.entity.ts          # Read model entity
│       └── transaction-history.entity.ts     # Read model entity
├── common/              # Shared infrastructure
│   ├── aggregates/
│   │   └── aggregate-root.ts                 # Base class for aggregates
│   ├── domain/
│   │   └── domain-event.interface.ts         # Event interface
│   ├── event-bus/
│   │   └── event-bus.service.ts               # Redis-based event bus
│   └── event-store/
│       ├── event-store.service.ts             # Event store service
│       └── event.entity.ts                    # Event entity
└── budget/              # Similar structure for Budget domain
└── category/            # Similar structure for Category domain
```

### Component Responsibilities

| Component | Responsibility | Location |
|-----------|---------------|----------|
| **Aggregate Root** | Business logic, event generation, state management | `src/*/domain/*.aggregate.ts` |
| **Command Handler** | Load aggregate, execute command, save events | `src/*/commands/*.command-handler.ts` |
| **Command Controller** | REST API endpoint for commands | `src/*/commands/*.command.controller.ts` |
| **Event Store** | Persist and retrieve events | `src/common/event-store/event-store.service.ts` |
| **Event Bus** | Publish/subscribe events | `src/common/event-bus/event-bus.service.ts` |
| **Read Model Handler** | Update read models when events occur | `src/*/read-models/*-read-model.handler.ts` |
| **Query Service** | Fast reads from read models | `src/*/queries/*.query.service.ts` |
| **Query Controller** | REST API endpoint for queries | `src/*/queries/*.query.controller.ts` |

---

## Benefits and Trade-offs

### Benefits

1. **Complete Audit Trail**
   - Every change is recorded
   - Know exactly what happened and when
   - No data loss

2. **Time Travel**
   - Can reconstruct state at any point in time
   - Useful for debugging and analytics

3. **Scalability**
   - Read and write sides can scale independently
   - Multiple read models for different use cases

4. **Performance**
   - Optimized read models for fast queries
   - Event store optimized for writes

5. **Flexibility**
   - Can create new read models from existing events
   - Don't need to change event store to add new queries

6. **Business Intelligence**
   - All historical data available for analysis
   - Can answer questions like "How many deposits in January?"

### Trade-offs

1. **Complexity**
   - More moving parts than traditional CRUD
   - Requires understanding of Event Sourcing and CQRS

2. **Eventual Consistency**
   - Read models updated asynchronously
   - May have slight delay between command and query result

3. **Storage**
   - Events can grow large over time
   - May need event archiving strategies

4. **Learning Curve**
   - Team needs to understand new patterns
   - Debugging can be different (replaying events)

5. **Replay Performance**
   - Loading aggregates with many events can be slow
   - May need snapshots for performance

---

## Common Patterns in This Project

### Pattern 1: Aggregate Reconstruction

**Problem:** Need to load aggregate from event store

**Solution:**
```typescript
private async loadAccount(accountId: string): Promise<Account> {
  const events = await this.eventStore.getEvents(accountId, 'Account');
  const account = new Account(accountId);
  account.loadFromHistory(events); // Replay all events
  return account;
}
```

### Pattern 2: Optimistic Concurrency Control

**Problem:** Prevent concurrent modifications

**Solution:**
```typescript
await this.eventStore.appendEvents(
  accountId,
  'Account',
  events,
  account.getVersion() - events.length, // Expected version
);
// If version doesn't match, throws error
```

### Pattern 3: Event-Driven Read Model Updates

**Problem:** Keep read models in sync with events

**Solution:**
```typescript
// Subscribe to events in onModuleInit()
this.eventBus.subscribe('MoneyDeposited', (event) =>
  this.handleMoneyDeposited(event),
);

// Update read model when event arrives
private async handleMoneyDeposited(event: DomainEvent) {
  await this.updateAccountBalance(event.aggregateId, amount, 'add');
}
```

### Pattern 4: Caching for Fast Queries

**Problem:** Repeated queries can be slow

**Solution:**
```typescript
// Try cache first
const cached = await this.redis.get(`account:balance:${accountId}`);
if (cached) return parseFloat(cached);

// Fallback to database
const balance = await this.accountBalanceRepository.findOne(...);
await this.redis.set(`account:balance:${accountId}`, balance, 'EX', 3600);
return balance;
```

### Pattern 5: Event Creation in Aggregates

**Problem:** Ensure events contain all necessary data

**Solution:**
```typescript
deposit(amount: number): void {
  // Validate
  if (amount <= 0) throw new Error('Amount must be positive');
  
  // Create event
  const event = this.createEvent('MoneyDeposited', 'Account', {
    amount,
    transactionId: uuidv4(),
    timestamp: new Date(),
  });
  
  // Apply event (updates state)
  this.apply(event);
}
```

---

## Summary

### Event Sourcing
- **Store events, not state**
- **Reconstruct state by replaying events**
- **Complete history and audit trail**
- **Implemented in:** Event Store, Aggregate Root

### CQRS
- **Separate command and query paths**
- **Commands use aggregates and events**
- **Queries use optimized read models**
- **Implemented in:** Command Handlers vs Query Services

### Together
- **Commands create events → Event Store**
- **Events published → Event Bus**
- **Read Model Handlers update read models**
- **Queries read from optimized read models**

This architecture provides:
- ✅ Complete audit trail
- ✅ High performance for both reads and writes
- ✅ Scalability
- ✅ Flexibility to add new read models
- ✅ Business intelligence capabilities

---

## Further Learning

1. **Read the Code**: Start with `src/account/` to see a complete example
2. **Trace a Flow**: Pick a command and trace it through the entire system
3. **Experiment**: Try adding a new event type or read model
4. **Study Patterns**: Look at how Budget and Category modules implement the same patterns

Happy learning! 🚀
