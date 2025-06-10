# Blink Starter for Monad

A Next.js-based starter template demonstrating how to integrate [Blinks](https://docs.dialect.to/blinks/) with the Monad blockchain. This project showcases a simple donation application that allows users to send MON (Monad's native currency) to a specified wallet address.

![Blink Scaffold for Monad](/public/screenshot-blink-scaffold-monad.png)

## Guide 🔥🔥🔥

Learn how to build this Blink from scratch with our extensive guide:
https://docs.dialect.to/blinks/blinks-provider/guides/tip-blink

## Prerequisites

- Node.js 18+
- npm, yarn, pnpm, or bun
- A wallet with some MON tokens (for testing donations)

## Environment Setup

In the `.env` file, we have preset a `DONATION_WALLET` address as well as the public RPC endpoint for the Monad testnet.

If you prefer to use your own wallet or RPC, please update the `.env` file accordingly.

- `NEXT_PUBLIC_RPC_URL`: Monad RPC URL
- `DONATION_WALLET`: The wallet address to receive donations

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Run the development server:

```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## License

MIT
// trigger redeploy
