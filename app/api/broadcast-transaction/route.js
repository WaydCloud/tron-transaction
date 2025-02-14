import { TronWeb } from 'tronweb';

export async function POST(request) {
  try {
    const requestBody = await request.json();
    console.log("Broadcast Transaction Request Received:", requestBody);

    const { signedTransaction } = requestBody;
    if (!signedTransaction) {
      console.error("Missing signedTransaction in request body:", requestBody);
      return new Response(
        JSON.stringify({ error: 'Missing signedTransaction' }),
        { status: 400 }
      );
    }

    const fullNode = 'https://api.trongrid.io';
    const solidityNode = 'https://api.trongrid.io';
    const eventServer = 'https://api.trongrid.io';
    console.log("Initializing TronWeb with nodes:", { fullNode, solidityNode, eventServer });

    const tronWeb = new TronWeb(fullNode, solidityNode, eventServer);

    // 디버깅: 현재 시간과 트랜잭션 만료 시간 비교
    const currentTime = Date.now();
    console.log("Current system time (ms):", currentTime, new Date(currentTime).toISOString());

    const txExpiration = signedTransaction.raw_data.expiration;
    console.log("Transaction expiration time (ms):", txExpiration, new Date(txExpiration).toISOString());

    if (currentTime > txExpiration) {
      console.error("Transaction has already expired. Current time is after expiration.");
    } else {
      console.log("Transaction is valid. Time remaining (ms):", txExpiration - currentTime);
    }

    console.log("Attempting to broadcast signed transaction...");
    console.log("Signed Transaction:", JSON.stringify(signedTransaction, null, 2));

    const result = await tronWeb.trx.sendRawTransaction(signedTransaction);
    console.log("Broadcast result:", result);

    if (result && result.result) {
      console.log("Transaction broadcast successfully:", result);
      return new Response(
        JSON.stringify({
          message: 'Step 4 (Broadcast Transaction): Transaction broadcast successfully.',
          result,
        }),
        { status: 200 }
      );
    } else {
      console.error("Broadcast failed, result does not indicate success:", result);
      return new Response(
        JSON.stringify({
          error: 'Broadcast failed',
          details: result,
        }),
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error in broadcasting transaction:", error);
    return new Response(
      JSON.stringify({
        error: 'Broadcast error',
        details: error && error.message ? error.message : String(error),
      }),
      { status: 500 }
    );
  }
}
