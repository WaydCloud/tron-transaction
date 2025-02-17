// [tron-transaction/app/api/prepare-transaction/route.js]
import { TronWeb } from "tronweb";

export async function POST(request) {
  try {
    // 클라이언트 입력: receiverAddress, amount, (선택) feeLimit
    const {
      receiverAddress,
      amount,
      feeLimit: userFeeLimit,
    } = await request.json();
    console.log("Prepare Transaction Request Received:", {
      receiverAddress,
      amount,
      userFeeLimit,
    });
    if (!receiverAddress || !amount) {
      return new Response(
        JSON.stringify({ error: "Missing receiverAddress or amount" }),
        { status: 400 }
      );
    }

    // 노드 설정
    const fullNode = "https://api.trongrid.io";
    const solidityNode = "https://api.trongrid.io";
    const eventServer = "https://api.trongrid.io";
    const tronWeb = new TronWeb(fullNode, solidityNode, eventServer);

    // USDT TRC20 컨트랙트 주소 (Tronscan 기준)
    const contractAddress = "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t";

    // PRIVATE_KEY 체크
    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey) {
      console.error("Private key not configured.");
      return new Response(
        JSON.stringify({ error: "Private key not configured" }),
        { status: 500 }
      );
    }

    // 송신자 주소 도출 및 기본 주소(hex) 설정 (TRC20 호출용)
    const senderAddress = tronWeb.address.fromPrivateKey(privateKey);
    const senderAddressHex = tronWeb.address.toHex(senderAddress);
    tronWeb.setAddress(senderAddressHex);
    console.log("Derived Sender Address:", senderAddress);

    const amountInUnits = Number(amount) * 1e6; // USDT 단위

    // 사용자가 feeLimit을 지정하지 않으면 기본값: 100 TRX (100e6 SUN)
    const feeLimit = userFeeLimit ? Number(userFeeLimit) : 100 * 1e6;

    // (옵션) – 여기서 사전 리소스 체크를 추가할 수 있다면,
    // 예를 들어, 추정 에너지 소비량 임계값과 비교하는 로직 추가 가능 (API에서 추출된 energy_used로 결정)
    // 현재는 스마트 컨트랙트 호출 결과에서 energy_used 값을 추출합니다.

    const transaction = await tronWeb.transactionBuilder.triggerSmartContract(
      contractAddress,
      "transfer(address,uint256)",
      { feeLimit },
      [
        { type: "address", value: receiverAddress },
        { type: "uint256", value: amountInUnits.toString() },
      ],
      senderAddress
    );

    console.log("Raw Transaction Response:", transaction);

    if (transaction.result && transaction.result.result) {
      // transactionExtention에 energy_used 정보가 있으면 추출
      const energyUsed = transaction.transactionExtention?.energy_used || null;
      // 추천 feeLimit은 추정 에너지 소비량의 130% (여유분 포함)
      const recommendedFeeLimit = energyUsed
        ? Math.ceil(energyUsed * 1.3)
        : feeLimit;
      return new Response(
        JSON.stringify({
          message: "Unsigned transaction prepared successfully.",
          transaction: transaction.transaction,
          estimatedEnergy: energyUsed, // (SUN 단위)
          recommendedFeeLimit, // (SUN 단위)
        }),
        { status: 200 }
      );
    } else {
      console.error("Transaction preparation failed:", transaction);
      return new Response(
        JSON.stringify({
          error: "Failed to prepare transaction",
          details: transaction,
        }),
        { status: 400 }
      );
    }
  } catch (err) {
    console.error("Error in prepare-transaction:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: err.message }),
      { status: 500 }
    );
  }
}
