// [tron-transaction/app/api/sign-transaction/route.js]
import { TronWeb } from "tronweb";

export async function POST(request) {
  try {
    const { unsignedTransaction } = await request.json();
    if (!unsignedTransaction) {
      return new Response(
        JSON.stringify({ error: "Missing unsignedTransaction" }),
        { status: 400 }
      );
    }

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

    // TronWeb 인스턴스 (서명 기능 활성화)
    const tronWeb = new TronWeb(
      fullNode,
      solidityNode,
      eventServer,
      privateKey
    );

    // 서명 실행
    const signedTransaction = await tronWeb.trx.sign(
      unsignedTransaction,
      privateKey
    );
    console.log("Signed Transaction:", signedTransaction);
    return new Response(
      JSON.stringify({
        message: "Transaction signed successfully.",
        signedTransaction,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in sign-transaction:", error);
    return new Response(
      JSON.stringify({ error: "Signing failed", details: error.message }),
      { status: 500 }
    );
  }
}
