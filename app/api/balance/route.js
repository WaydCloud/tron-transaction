// [tron-transaction/app/api/balance/route.js]
import { TronWeb } from "tronweb";

export async function GET(request) {
  try {
    // 노드 설정
    const fullNode = "https://api.trongrid.io";
    const solidityNode = "https://api.trongrid.io";
    const eventServer = "https://api.trongrid.io";

    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey) {
      return new Response(
        JSON.stringify({ error: "Private key not configured" }),
        { status: 500 }
      );
    }

    const tronWeb = new TronWeb(fullNode, solidityNode, eventServer);
    const walletAddress = tronWeb.address.fromPrivateKey(privateKey);
    const walletAddressHex = tronWeb.address.toHex(walletAddress);
    tronWeb.setAddress(walletAddressHex);

    // 1. TRX 잔액 조회 (SUN 단위 -> TRX)
    const trxBalanceSun = await tronWeb.trx.getBalance(walletAddress);
    const trxBalance = trxBalanceSun / 1e6;

    // 2. USDT 잔액 조회 (TRC20 컨트랙트 사용)
    const usdtContractAddress = "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t";
    const usdtAbi = [
      {
        constant: true,
        inputs: [{ name: "_owner", type: "address" }],
        name: "balanceOf",
        outputs: [{ name: "", type: "uint256" }],
        payable: false,
        stateMutability: "view",
        type: "function",
      },
    ];
    const usdtContract = await tronWeb.contract(usdtAbi, usdtContractAddress);
    const usdtBalanceRaw = await usdtContract
      .balanceOf(walletAddressHex)
      .call({ from: walletAddressHex });
    const usdtBalance = parseInt(usdtBalanceRaw.toString()) / 1e6;

    // 3. 계정 리소스 조회
    const resources = await tronWeb.trx.getAccountResources(walletAddress);

    const freeBandwidth =
      (resources.freeNetLimit || 0) - (resources.freeNetUsed || 0);
    let assetBandwidth = 0;
    if (resources.assetNetLimit && resources.assetNetUsed) {
      assetBandwidth =
        resources.assetNetLimit.reduce(
          (acc, obj) => acc + Number(obj.value || 0),
          0
        ) -
        resources.assetNetUsed.reduce(
          (acc, obj) => acc + Number(obj.value || 0),
          0
        );
    }
    const availableBandwidth = freeBandwidth + assetBandwidth;

    // Energy: API에서 TotalEnergyLimit 사용
    const availableEnergy = resources.TotalEnergyLimit || 0;
    const energyWeight = resources.TotalEnergyWeight || 0;

    console.log("Wallet Address:", walletAddress);
    console.log("TRX Balance:", trxBalance);
    console.log("USDT Balance:", usdtBalance);
    console.log("Available Energy:", availableEnergy);
    console.log("Energy Weight:", energyWeight);
    console.log("Available Bandwidth:", availableBandwidth);

    return new Response(
      JSON.stringify({
        walletAddress,
        trxBalance,
        usdtBalance,
        availableEnergy,
        energyWeight,
        availableBandwidth,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching balances:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
}
