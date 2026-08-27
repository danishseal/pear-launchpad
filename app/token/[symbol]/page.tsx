import TokenPageClient from "./token-page-client";

export default async function TokenPage({ params }: PageProps<"/token/[symbol]">) {
  const { symbol } = await params;
  return <TokenPageClient symbol={symbol}/>;
}
