// [tron-transaction/app/api/transactions/route.js]
import { TronWeb } from "tronweb";

export async function GET(request) {
  try {
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
    const walletAddress = tronWeb.address.fromPrivateKey(privateKey);

    const transactions = await tronWeb.trx.getTransactionsRelated(
      walletAddress,
      "all"
    );
    console.log("Transaction: ", transactions);

    return new Response(JSON.stringify({ transactions }), { status: 200 });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
}
