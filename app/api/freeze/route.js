import { TronWeb } from "tronweb";

export async function POST(request) {
  try {
    // 요청에서 freezeAmount와 resource를 받아옵니다.
    // freezeDuration은 v2에서는 사용되지 않으므로 제거합니다.
    const { freezeAmount, resource } = await request.json();
    if (!freezeAmount || !resource) {
      return new Response(JSON.stringify({ error: "Missing parameters" }), {
        status: 400,
      });
    }

    const fullNode = "https://api.trongrid.io";
    const solidityNode = "https://api.trongrid.io";
    const eventServer = "https://api.trongrid.io";
    const tronWeb = new TronWeb(fullNode, solidityNode, eventServer);

    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey) {
      return new Response(
        JSON.stringify({ error: "Private key not configured" }),
        { status: 500 }
      );
    }
    const senderAddress = tronWeb.address.fromPrivateKey(privateKey);
    console.log("senderAddress :", senderAddress);

    // freezeAmount는 SUN 단위여야 합니다 (1 TRX = 1,000,000 SUN)
    // freezeBalanceV2는 (amount, resource, address, options) 순서로 인자를 받습니다.
    const unsignedTx = await tronWeb.transactionBuilder.freezeBalanceV2(
      Number(freezeAmount),
      resource,
      senderAddress
    );

    // 생성된 트랜잭션 객체를 개인키로 서명합니다.
    const signedTx = await tronWeb.trx.sign(unsignedTx, privateKey);

    // 서명된 트랜잭션을 네트워크에 전송합니다.
    const result = await tronWeb.trx.sendRawTransaction(signedTx);

    console.log("Freeze Result:", result);
    return new Response(
      JSON.stringify({ message: "Freeze successful", result }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error freezing TRX:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
}
