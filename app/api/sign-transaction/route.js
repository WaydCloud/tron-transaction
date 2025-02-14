import { TronWeb } from 'tronweb';

export async function POST(request) {
  try {
    const { unsignedTransaction } = await request.json();
    if (!unsignedTransaction) {
      return new Response(
        JSON.stringify({ error: 'Missing unsignedTransaction' }),
        { status: 400 }
      );
    }

    const fullNode = 'https://api.trongrid.io';
    const solidityNode = 'https://api.trongrid.io';
    const eventServer = 'https://api.trongrid.io';

    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey) {
      return new Response(
        JSON.stringify({ error: 'Private key not configured' }),
        { status: 500 }
      );
    }

    // TronWeb 인스턴스 생성 (서명 기능 활성화)
    const tronWeb = new TronWeb(fullNode, solidityNode, eventServer, privateKey);

    // unsigned 트랜잭션에 서명
    const signedTransaction = await tronWeb.trx.sign(unsignedTransaction, privateKey);

    return new Response(
      JSON.stringify({
        message: 'Step 3 (Sign Transaction): Transaction signed successfully.',
        signedTransaction,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return new Response(
      JSON.stringify({
        error: 'Signing failed',
        details: error.message,
      }),
      { status: 500 }
    );
  }
}
