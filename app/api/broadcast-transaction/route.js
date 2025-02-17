// [tron-transaction/app/api/broadcast-transaction/route.js]
import { TronWeb } from "tronweb";

export async function POST(request) {
  try {
    const requestBody = await request.json();
    console.log("Broadcast Transaction Request Received:", requestBody);
    const { signedTransaction } = requestBody;
    if (!signedTransaction) {
      console.error("Missing signedTransaction in request body:", requestBody);
      return new Response(
        JSON.stringify({ error: "Missing signedTransaction" }),
        { status: 400 }
      );
    }

    const fullNode = "https://api.trongrid.io";
    const solidityNode = "https://api.trongrid.io";
    const eventServer = "https://api.trongrid.io";
    console.log("Initializing TronWeb with nodes:", {
      fullNode,
      solidityNode,
      eventServer,
    });
    const tronWeb = new TronWeb(fullNode, solidityNode, eventServer);

    // 트랜잭션 만료 시간 체크 (디버깅용)
    const currentTime = Date.now();
    const txExpiration = signedTransaction.raw_data.expiration;
    console.log(
      "Current Time (ms):",
      currentTime,
      new Date(currentTime).toISOString()
    );
    console.log(
      "Transaction Expiration (ms):",
      txExpiration,
      new Date(txExpiration).toISOString()
    );
    if (currentTime > txExpiration) {
      console.error("Transaction has expired.");
    } else {
      console.log("Time remaining (ms):", txExpiration - currentTime);
    }

    console.log("Broadcasting signed transaction...");
    const result = await tronWeb.trx.sendRawTransaction(signedTransaction);
    console.log("Broadcast Result:", result);
    if (result && result.result) {
      return new Response(
        JSON.stringify({
          message: "Transaction broadcast successfully.",
          result,
        }),
        { status: 200 }
      );
    } else {
      console.error("Broadcast failed:", result);
      return new Response(
        JSON.stringify({
          error: "Broadcast failed",
          details: result,
        }),
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error in broadcast-transaction:", error);
    return new Response(
      JSON.stringify({
        error: "Broadcast error",
        details: error && error.message ? error.message : String(error),
      }),
      { status: 500 }
    );
  }
}
