"use client";

import { useWriteContract } from 'wagmi';
import { CONTRACT_ADDRESS, ABI } from '@/contract';

export default function MintNFT() {
  const { writeContract, data, status } = useWriteContract();

  const handleMint = () => {
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: ABI,
      functionName: 'mint',
    });
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h2>Mint Your Blink NFT</h2>
      <button
        onClick={handleMint}
        disabled={status === 'pending'}
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
        {status === 'pending' ? "Minting..." : "Mint NFT"}
      </button>

      {data && (
        <p style={{ marginTop: "1rem", color: "#22c55e" }}>
          ✅ Transaction sent! Hash: {data}
        </p>
      )}
    </div>
  );
}
