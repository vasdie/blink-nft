"use client";

import { useContractWrite } from 'wagmi';
import { CONTRACT_ADDRESS, ABI } from '@/contract';

export default function MintNFT() {
  const { data, isLoading, write } = useContractWrite({
    address: CONTRACT_ADDRESS,
    abi: ABI,
    functionName: "mint",
  });

  return (
    <div style={{ padding: "2rem" }}>
      <h2>Mint Your Blink NFT</h2>
      <button
        onClick={() => write?.()}
        disabled={!write || isLoading}
        style={{
          marginTop: "1rem",
          padding: "0.6rem 1.2rem",
          fontSize: "1rem",
          borderRadius: "8px",
          background: "#6366f1",
          color: "#fff",
          border: "none",
          cursor: "pointer",
        }}
      >
        {isLoading ? "Minting..." : "Mint NFT"}
      </button>

      {data?.hash && (
        <p style={{ marginTop: "1rem", color: "#22c55e" }}>
          ✅ Transaction sent! Hash: {data.hash}
        </p>
      )}
    </div>
  );
}
