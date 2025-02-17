// [tron-transaction/app/api/wallet-address/route.js]
import { TronWeb } from "tronweb";

export async function GET(request) {
  try {
    // Tron 노드 설정 (모두 같은 URL 사용)
    const fullNode = "https://api.trongrid.io";
    const solidityNode = "https://api.trongrid.io";
    const eventServer = "https://api.trongrid.io";

    // 환경 변수에서 PRIVATE_KEY 가져오기
    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey) {
      return new Response(
        JSON.stringify({ error: "Private key not configured" }),
        { status: 500 }
      );
    }

    // TronWeb 인스턴스 생성 (서명 기능이 필요하지 않으므로 privateKey 없이도 가능하지만, 여기서는 주소 도출을 위해 사용)
    const tronWeb = new TronWeb(fullNode, solidityNode, eventServer);

    // PRIVATE_KEY로부터 지갑 주소 도출
    const walletAddress = tronWeb.address.fromPrivateKey(privateKey);

    return new Response(JSON.stringify({ walletAddress }), { status: 200 });
  } catch (error) {
    console.error("Error deriving wallet address:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
}
