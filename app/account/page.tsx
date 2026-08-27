import type { Metadata } from "next";
import AccountPageClient from "./account-page-client";
import "./account.css";

export const metadata: Metadata = { title: "Account | peard", description: "Your peard portfolio and activity." };

export default function AccountPage() { return <AccountPageClient />; }
