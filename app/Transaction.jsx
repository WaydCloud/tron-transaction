"use client";

import { useState } from 'react';

export default function Transaction() {
  const [receiverAddress, setReceiverAddress] = useState('TSttawX9FRmhWHqWKNHUmyUdrYwbUDguK9');
  const [amount, setAmount] = useState('1');
  const [unsignedTx, setUnsignedTx] = useState(null);
  const [signedTx, setSignedTx] = useState(null);
  const [message, setMessage] = useState('');

  // Prepare Transaction API 호출
  const handlePrepareTransaction = async () => {
    setMessage('Preparing transaction...');
    try {
      const res = await fetch('/api/prepare-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiverAddress, amount }),
      });
      const data = await res.json();
      if (res.ok) {
        setUnsignedTx(data.transaction);
        setMessage(data.message);
      } else {
        setMessage(`Error: ${data.error}`);
      }
    } catch (error) {
      setMessage(`Fetch error: ${error.message}`);
    }
  };

  // Sign Transaction API 호출
  const handleSignTransaction = async () => {
    if (!unsignedTx) {
      setMessage('Please prepare the transaction first.');
      return;
    }
    setMessage('Signing transaction...');
    try {
      const res = await fetch('/api/sign-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unsignedTransaction: unsignedTx }),
      });
      const data = await res.json();
      if (res.ok) {
        setSignedTx(data.signedTransaction);
        setMessage(data.message);
      } else {
        setMessage(`Error: ${data.error}`);
      }
    } catch (error) {
      setMessage(`Fetch error: ${error.message}`);
    }
  };

  // Broadcast Transaction API 호출
  const handleBroadcastTransaction = async () => {
    if (!signedTx) {
      setMessage('Please sign the transaction first.');
      return;
    }
    setMessage('Broadcasting transaction...');
    try {
      const res = await fetch('/api/broadcast-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signedTransaction: signedTx }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(`${data.message}\nTransaction Result: ${JSON.stringify(data.result)}`);
      } else {
        setMessage(`Error: ${data.error}`);
      }
    } catch (error) {
      setMessage(`Fetch error: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-md">
        <h1 className="text-3xl font-bold text-white mb-6 text-center">USDT Transaction Sender</h1>
        <div className="mb-4">
          <input
            type="text"
            placeholder="Receiver Address"
            value={receiverAddress}
            onChange={(e) => setReceiverAddress(e.target.value)}
            className="w-full p-3 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="mb-6">
          <input
            type="number"
            placeholder="Amount (USDT)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full p-3 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="space-y-4">
          <button
            onClick={handlePrepareTransaction}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded"
          >
            Prepare Transaction
          </button>
          <button
            onClick={handleSignTransaction}
            className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded"
          >
            Sign Transaction
          </button>
          <button
            onClick={handleBroadcastTransaction}
            className="w-full bg-purple-500 hover:bg-purple-600 text-white font-semibold py-2 px-4 rounded"
          >
            Broadcast Transaction
          </button>
        </div>
        <div className="mt-6">
          <p className="text-white whitespace-pre-wrap">{message}</p>
        </div>
      </div>
    </div>
  );
}
