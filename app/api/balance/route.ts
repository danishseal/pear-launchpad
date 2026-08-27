import { Connection, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { NextResponse } from "next/server";
import { RPC_URL } from "@/lib/peard/config";

export const dynamic = "force-dynamic";

const connection = new Connection(RPC_URL, "confirmed");

export async function GET(request: Request) {
  const address = new URL(request.url).searchParams.get("address");
  if (!address) return NextResponse.json({ error: "Wallet address is required" }, { status: 400 });

  let owner: PublicKey;
  try {
    owner = new PublicKey(address);
  } catch {
    return NextResponse.json({ error: "Wallet address is invalid" }, { status: 400 });
  }

  try {
    const lamports = await connection.getBalance(owner);
    return NextResponse.json(
      { sol: lamports / LAMPORTS_PER_SOL },
      { headers: { "cache-control": "no-store" } },
    );
  } catch {
    return NextResponse.json({ error: "Unable to read wallet balance" }, { status: 502 });
  }
}
