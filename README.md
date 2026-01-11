# Eterna Order Execution Engine

A high-performance order execution engine backend built with Node.js, Fastify, BullMQ, and PostgreSQL. This system handles **Market Orders** with intelligent DEX routing (Raydium vs Meteora) and real-time WebSocket status updates.

## 🚀 Features

- **Market Order Execution**: Chosen for its fundamental role in trading. It provides the core architecture (routing, execution, settlement) upon which Limit and Sniper orders can be built.
- **Smart DEX Routing**: Compares quotes between Raydium and Meteora to ensure the best execution price.
- **High Concurrency**: Uses BullMQ (Redis-based queue) to handle bursts of orders (10 concurrent workers, rate-limited).
- **Real-time Updates**: WebSocket integration streams order status (`PENDING` -> `ROUTING` -> `SUBMITTED` -> `CONFIRMED`) to the client.
- **Resilience**: Automatic retries and error handling.

### API Endpoints

- `POST /api/orders/execute`: Execute a new order.
  - Body: `{ inputToken, outputToken, amount, type: "MARKET" | "LIMIT" | "SNIPER", limitPrice? }`
- `GET /api/orders/history`: Get last 50 orders.
- `GET /api/orders/:id`: Get status of a specific order.
- `DELETE /api/orders/:id`: Cancel a pending order.
- `GET /health`: System health check.

### Order Types
- **MARKET**: Executes immediately at the best available price.
- **LIMIT**: Executes only if the output amount is at least `limitPrice`.
- **SNIPER**: Urgent execution that also requires output to be at least `limitPrice`.

# Eterna Order Execution Engine

A high-performance order execution engine with mock DEX routing (Raydium/Meteora), BullMQ task queuing, and real-time status updates via WebSockets.

### 🚀 Live Deployment
- **Dashboard (Frontend):** [https://modest-luck-production-7648.up.railway.app](https://modest-luck-production-7648.up.railway.app)
- **API (Backend):** [https://surajeternabakend-production.up.railway.app](https://surajeternabakend-production.up.railway.app)

### 🛠️ Tech Stack
- **Frontend:** React, TypeScript, Tailwind CSS (Vite)
- **Backend:** Node.js, Fastify, TypeScript
- **Database:** PostgreSQL (Prisma ORM)
- **Queue/Cache:** Redis, BullMQ
- **DevOps:** Docker, Railway

### 📋 Design Decisions
- **Asynchronous Execution:** I chose a queue-based architecture using BullMQ and Redis. This ensures that even during high traffic (100 orders/min), the API remains responsive while workers process trades in the background.
- **Order Types:** I implemented **Sniper Orders** as the primary focus because they demonstrate complex conditional logic (waiting for a target price/liquidity) before execution.
- **Extensibility:** The engine uses a Strategy pattern in the `DexRouter`. To add more order types, one would simply add a new processor in `orderQueue.ts` and define the logic (e.g., trailing stops) without changing the routing or settlement code.


## 📦 Setup & Installation

### Prerequisites
- Node.js (v18+)
- Docker (for Redis and Postgres)

### Steps

1. **Clone and Install**
   ```bash
   git clone <repo-url>
   cd backend_eterna
   npm install
   ```

2. **Start Infrastructure**
   ```bash
   docker-compose up -d
   ```

3. **Database Migration**
   ```bash
   npx prisma migrate dev --name init
   ```

4. **Run Server**
   ```bash
   npm run build
   npm start
   ```
   Server runs on `http://localhost:3000`.

5. **Run Tests**
   ```bash
   npm test
   ```

## 🔌 API Reference

### Execute Order
`POST /api/orders/execute`

**Body:**
```json
{
  "inputToken": "SOL",
  "outputToken": "USDC",
  "amount": 1.5,
  "type": "MARKET"
}
```

**Response:**
```json
{
  "orderId": "uuid-string",
  "message": "Order queued",
  "wsUrl": "ws://localhost:3000/ws?orderId=uuid-string"
}
```

### WebSocket Updates
Connect to `ws://localhost:3000/ws?orderId=<orderId>` to receive updates:

```json
{
  "orderId": "...",
  "status": "CONFIRMED",
  "txHash": "5x...",
  "executionPrice": 152.45
}
```

## 🏗 Architecture Decisions

- **Why Market Order?**
  I chose Market Order to focus on the critical path of execution speed and routing efficiency. It demonstrates the ability to handle immediate liquidity demands and requires robust race-condition handling which is central to DEX aggregators.

- **Fastify vs Express**
  Fastify was chosen for its low overhead and built-in first-party WebSocket support, which simplifies the architecture compared to managing a separate WS server.

- **BullMQ**
  Selected for its robust retry mechanisms and priority queuing capabilities, essential for a trading engine where transaction reliability is paramount.

## 🧪 Testing

The project includes unit tests for the Router logic and integration tests for the API flow (mocking the queue/DB).

```bash
npm test
```
