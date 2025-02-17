"use client";

import { useState, useEffect } from "react";
import QRCode from "react-qr-code";

export default function Transaction() {
  // 입력값 및 트랜잭션 상태
  const [receiverAddress, setReceiverAddress] = useState(
    "TSttawX9FRmhWHqWKNHUmyUdrYwbUDguK9"
  );
  const [amount, setAmount] = useState("1");
  const [unsignedTx, setUnsignedTx] = useState(null);
  const [signedTx, setSignedTx] = useState(null);
  const [message, setMessage] = useState("");

  // 잔액 및 리소스 상태 (walletAddress, TRX, USDT, Energy, Bandwidth)
  const [balance, setBalance] = useState({
    walletAddress: "",
    trxBalance: 0,
    usdtBalance: 0,
    availableEnergy: null,
    availableBandwidth: null,
  });

  // 거래 내역 상태
  const [transactions, setTransactions] = useState([]);

  // 지갑 주소 표시 상태
  const [showWallet, setShowWallet] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");

  // Prepare Transaction 시 추정된 에너지와 추천 feeLimit
  const [estimatedEnergy, setEstimatedEnergy] = useState(null);
  const [recommendedFee, setRecommendedFee] = useState(null);

  // 사용자가 수동으로 입력한 feeLimit (SUN 단위)
  const [manualFeeLimit, setManualFeeLimit] = useState("");

  // Freeze API 관련 상태
  const [freezeMessage, setFreezeMessage] = useState("");

  // 잔액 및 리소스 API 호출 (10초마다 갱신)
  const fetchBalance = async () => {
    try {
      const res = await fetch("/api/balance");
      if (res.ok) {
        const data = await res.json();
        setBalance(data);
        // 자동 Freeze 제안: 만약 Energy가 5000 SUN 미만이면 메시지 표시
        if (data.availableEnergy !== null && data.availableEnergy < 5000) {
          setFreezeMessage(
            "Low Energy detected. Consider freezing TRX to obtain more Energy."
          );
        } else {
          setFreezeMessage("");
        }
      } else {
        console.error("Error fetching balance");
      }
    } catch (error) {
      console.error("Fetch balance error:", error);
    }
  };

  useEffect(() => {
    fetchBalance();
    //const interval = setInterval(fetchBalance, 30000);
    //return () => clearInterval(interval);
  }, []);

  // 거래 내역 API 호출 (별도 API 사용 시)
  const fetchTransactions = async () => {
    try {
      const res = await fetch("/api/transactions");
      if (res.ok) {
        const data = await res.json();
        setTransactions(data.transactions || []);
      } else {
        setMessage("Error fetching transactions");
      }
    } catch (error) {
      setMessage("Error: " + error.message);
    }
  };

  // wallet-address API 호출
  const handleShowWalletAddress = async () => {
    try {
      const res = await fetch("/api/wallet-address");
      if (res.ok) {
        const data = await res.json();
        setWalletAddress(data.walletAddress);
        setShowWallet(true);
      } else {
        setMessage("Error fetching wallet address");
      }
    } catch (error) {
      setMessage("Error: " + error.message);
    }
  };

  // Prepare Transaction API 호출
  const handlePrepareTransaction = async () => {
    if (balance.availableEnergy !== null && balance.availableEnergy < 5000) {
      setMessage(
        "Insufficient Energy. Please freeze some TRX to obtain more Energy before proceeding."
      );
      return;
    }
    setMessage("Preparing transaction...");
    try {
      const payload = { receiverAddress, amount };
      if (manualFeeLimit) {
        payload.feeLimit = manualFeeLimit;
      }
      const res = await fetch("/api/prepare-transaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        setUnsignedTx(data.transaction);
        setEstimatedEnergy(data.estimatedEnergy);
        setRecommendedFee(data.recommendedFeeLimit);
        setMessage(
          `${data.message}\nEstimated Energy: ${
            data.estimatedEnergy || "N/A"
          }\nRecommended FeeLimit: ${data.recommendedFeeLimit} SUN`
        );
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
      setMessage("Please prepare the transaction first.");
      return;
    }
    setMessage("Signing transaction...");
    try {
      const res = await fetch("/api/sign-transaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
      setMessage("Please sign the transaction first.");
      return;
    }
    setMessage("Broadcasting transaction...");
    try {
      const res = await fetch("/api/broadcast-transaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signedTransaction: signedTx }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(
          `${data.message}\nTransaction Result: ${JSON.stringify(data.result)}`
        );
      } else {
        setMessage(`Error: ${data.error}`);
      }
    } catch (error) {
      setMessage(`Fetch error: ${error.message}`);
    }
  };

  // Freeze API 호출 (resource: "ENERGY" 또는 "BANDWIDTH")
  const handleFreeze = async (resource) => {
    // 예: 1 TRX = 1,000,000 SUN; freeze 1 TRX for 3 days
    const freezeAmount = 1 * 1e6;
    const freezeDuration = 3; // 3일
    try {
      const res = await fetch("/api/freeze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ freezeAmount, freezeDuration, resource }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage("Freeze successful: " + data.message);
        fetchBalance(); // freeze 후 잔액 갱신
      } else {
        setMessage("Freeze Error: " + data.error);
      }
    } catch (error) {
      setMessage("Freeze Error: " + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
      <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-md">
        <h1 className="text-3xl font-bold text-white mb-6 text-center">
          USDT Transaction Sender
        </h1>

        {/* 잔액 및 리소스 표시 영역 */}
        <div className="mb-4 p-6 bg-gray-900 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-white mb-4 border-b border-gray-600 pb-2">
            Wallet Balance & Resources
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {/* TRX 카드 */}
            <div className="flex flex-col items-center p-4 bg-gray-700 rounded">
              <p className="text-gray-300 text-sm">TRX</p>
              <p className="text-white text-xl font-semibold">
                {balance.trxBalance}
              </p>
            </div>
            {/* USDT 카드 */}
            <div className="flex flex-col items-center p-4 bg-gray-700 rounded">
              <p className="text-gray-300 text-sm">USDT</p>
              <p className="text-white text-xl font-semibold">
                {balance.usdtBalance}
              </p>
            </div>
            {/* Energy 카드 */}
            <div className="flex flex-col items-center p-4 bg-gray-700 rounded">
              <p className="text-gray-300 text-sm">Energy</p>
              <p className="text-white text-xl font-semibold">
                {balance.availableEnergy !== null
                  ? balance.availableEnergy
                  : "Loading..."}
              </p>
            </div>
            {/* Bandwidth 카드 */}
            <div className="flex flex-col items-center p-4 bg-gray-700 rounded">
              <p className="text-gray-300 text-sm">Bandwidth</p>
              <p className="text-white text-xl font-semibold">
                {balance.availableBandwidth !== null
                  ? balance.availableBandwidth
                  : "Loading..."}
              </p>
            </div>
          </div>
          <div className="mt-2 text-red-400 text-sm text-center">
            {freezeMessage}
            <div className="mt-1 flex justify-center space-x-2">
              <button
                onClick={() => handleFreeze("ENERGY")}
                className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded"
              >
                Freeze for ENERGY
              </button>
              <button
                onClick={() => handleFreeze("BANDWIDTH")}
                className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded"
              >
                Freeze for BANDWIDTH
              </button>
            </div>
          </div>
        </div>

        {/* Receiver, Amount 입력 */}
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

        {/* 수동 FeeLimit 입력 (선택 사항) */}
        <div className="mb-6">
          <input
            type="number"
            placeholder="FeeLimit (SUN) - optional"
            value={manualFeeLimit}
            onChange={(e) => setManualFeeLimit(e.target.value)}
            className="w-full p-3 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {recommendedFee && (
            <p className="text-gray-400 text-sm mt-1">
              Recommended FeeLimit: {recommendedFee} SUN
            </p>
          )}
          {estimatedEnergy && (
            <p className="text-gray-400 text-sm">
              Estimated Energy Usage: {estimatedEnergy} SUN
            </p>
          )}
        </div>

        {/* 트랜잭션 관련 버튼 */}
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

        {/* 거래 내역 조회 */}
        <div className="mt-6">
          <button
            onClick={fetchTransactions}
            className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-2 px-4 rounded mb-4"
          >
            Load Transaction History
          </button>
          {transactions.length > 0 && (
            <div className="bg-gray-700 p-4 rounded shadow-md max-h-60 overflow-y-auto">
              <h3 className="text-white font-bold mb-2">Transaction History</h3>
              <ul className="text-gray-200 text-sm">
                {transactions.map((tx, index) => (
                  <li
                    key={index}
                    className="mb-1 border-b border-gray-600 pb-1"
                  >
                    <p>Hash: {tx.txID || tx.hash}</p>
                    <p>
                      Status:{" "}
                      {tx.ret && tx.ret[0] ? tx.ret[0].contractRet : "Pending"}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Wallet Address 버튼 및 QR 코드 영역 */}
        <div className="mt-6">
          <button
            onClick={handleShowWalletAddress}
            className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-2 px-4 rounded mb-4"
          >
            Show Wallet Address
          </button>
          {showWallet && walletAddress && (
            <div className="flex flex-col items-center">
              <p className="text-white mb-2">Wallet Address: {walletAddress}</p>
              <QRCode value={walletAddress} />
            </div>
          )}
        </div>

        {/* 메시지 출력 영역 */}
        <div className="mt-6">
          <p className="text-white whitespace-pre-wrap">{message}</p>
        </div>
      </div>
    </div>
  );
}
