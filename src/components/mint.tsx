"use client";

import { useAccount, useContractWrite, useWaitForTransaction } from 'wagmi';
import { CONTRACT_ADDRESS, ABI } from '@/contract';

export function MintNFT() {
  const { address } = useAccount();

  const { data, write } = useContractWrite({
    address: CONTRACT_ADDRESS,
    abi: ABI,
    functionName: "mint", // update this if your function name is different
  });

  const { isLoading, isSuccess } = useWaitForTransaction({ hash: data?.hash });

  return (
    <div>
      <button onClick={() => write?.()} disabled={!write || isLoading}>
        {isLoading ? "Minting..." : "Mint NFT"}
      </button>
      {isSuccess && <p>✅ Mint successful!</p>}
    </div>
  );
}
