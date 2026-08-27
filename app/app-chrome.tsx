"use client";

import {
  DotsThreeOutline, House, Info, MagnifyingGlass, Plus, UserCircle,
} from "@phosphor-icons/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ConnectButton } from "./connect-button";

const navItems = [
  { Icon: House, label: "Home", href: "/", match: (path: string) => path === "/" },
  { Icon: UserCircle, label: "Account", href: "/account", match: (path: string) => path.startsWith("/account") },
];

export function AppSidebar() {
  const pathname = usePathname();

  return <aside className="sidebar">
    <Link className="brand" href="/" aria-label="Peard home">peard</Link>
    <nav aria-label="Primary navigation">
      {navItems.map(({ Icon, label, href, match }) => {
        const active = match(pathname);
        return <Link href={href} className={active ? "nav-item active" : "nav-item"} key={label}>
          <Icon className="nav-icon" weight={active ? "fill" : "regular"}/>{label}
        </Link>;
      })}
      <Link className={`launch${pathname.startsWith("/launch") ? " active" : ""}`} href="/launch">
        <Plus weight="bold"/> Launch a coin
      </Link>
    </nav>
    <Link className="more" href="/account"><DotsThreeOutline/> More</Link>
  </aside>;
}

export function AppHeader({
  query,
  onQueryChange,
}: {
  query?: string;
  onQueryChange?: (value: string) => void;
}) {
  const [localQuery, setLocalQuery] = useState("");
  const value = query ?? localQuery;
  const setValue = onQueryChange ?? setLocalQuery;

  return <header className="topbar">
    <label className="search">
      <MagnifyingGlass/>
      <input aria-label="Search" placeholder="Search underlyings" value={value} onChange={(event) => setValue(event.target.value)}/>
    </label>
    <div className="topbar-actions">
      <button className="how" type="button"><Info weight="fill"/> How it works</button>
      <ConnectButton/>
    </div>
  </header>;
}
