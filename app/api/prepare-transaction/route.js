import { TronWeb } from 'tronweb';

export async function POST(request) {
  try {
    const { receiverAddress, amount } = await request.json();
    console.log("Received:", receiverAddress, amount);

    if (!receiverAddress || !amount) {
      return new Response(
        JSON.stringify({ error: 'Missing receiverAddress or amount' }),
        { status: 400 }
      );
    }

    const fullNode = 'https://api.trongrid.io';
    const solidityNode = 'https://api.trongrid.io';
    const eventServer = 'https://api.trongrid.io';

    const tronWeb = new TronWeb(fullNode, solidityNode, eventServer);

    const contractAddress = 'TLa2f6VPqDgRE67v1736s7bJ8Ray5wYjU7';

    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey) {
      console.error("Private key not configured.");
      return new Response(
        JSON.stringify({ error: 'Private key not configured' }),
        { status: 500 }
      );
    }

    const senderAddress = tronWeb.address.fromPrivateKey(privateKey);
    console.log("Derived Tron address:", senderAddress);

    const amountInUnits = Number(amount) * 1e6;

    const transaction = await tronWeb.transactionBuilder.triggerSmartContract(
      contractAddress,
      'transfer(address,uint256)',
      { feeLimit: 100000000 },
      [
        { type: 'address', value: receiverAddress },
        { type: 'uint256', value: amountInUnits.toString() }
      ],
      senderAddress
    );

    console.log("Transaction response:", transaction);

    if (transaction.result && transaction.result.result) {
      return new Response(
        JSON.stringify({
          message: 'Unsigned transaction prepared successfully.',
          transaction: transaction.transaction,
        }),
        { status: 200 }
      );
    } else {
      console.error("Transaction preparation failed:", transaction);
      return new Response(
        JSON.stringify({ error: 'Failed to prepare transaction', details: transaction }),
        { status: 400 }
      );
    }
  } catch (err) {
    console.error("Error in prepare-transaction:", err);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: err.message }),
      { status: 500 }
    );
  }
}
