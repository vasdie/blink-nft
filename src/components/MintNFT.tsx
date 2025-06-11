import { useReadContract, useWriteContract } from 'wagmi';
import { CONTRACT_ADDRESS, ABI } from '@/contract';
import { formatEther } from 'viem';

export default function MintNFT() {
  const { data: priceRaw } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ABI,
    functionName: 'price',
  });

  const price = priceRaw ? formatEther(priceRaw) : null;

  const { writeContract, status, data } = useWriteContract();

  const handleMint = () => {
    if (!priceRaw) return;

    writeContract({
      address: CONTRACT_ADDRESS,
      abi: ABI,
      functionName: 'mint',
      value: priceRaw, // Pay correct amount
    });
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Mint Your Blink NFT</h2>
      <p>Price: {price ? `${price} MON` : 'Loading...'}</p>
      <button onClick={handleMint} disabled={!priceRaw || status === 'pending'}>
        {status === 'pending' ? 'Minting...' : 'Mint NFT'}
      </button>
      {data?.hash && (
        <p style={{ marginTop: '1rem', color: '#22c55e' }}>
          ✅ Tx sent! Hash: {data.hash}
        </p>
      )}
    </div>
  );
}
