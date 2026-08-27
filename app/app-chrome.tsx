"use client";

import {
  ArrowSquareOut, BookOpen, DotsThreeOutline, GlobeHemisphereWest, House, MagnifyingGlass, Plus, UserCircle, XLogo,
} from "@phosphor-icons/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ConnectButton } from "./connect-button";

const navItems = [
  { Icon: House, label: "Home", href: "/", match: (path: string) => path === "/" },
  { Icon: UserCircle, label: "Account", href: "/account", match: (path: string) => path.startsWith("/account") },
];

export function AppSidebar() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!moreOpen) return;
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!moreRef.current?.contains(event.target as Node)) setMoreOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMoreOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [moreOpen]);

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
    <div className="more-wrap" ref={moreRef}>
      {moreOpen ? <div className="more-menu" id="more-menu">
        <a href="https://x.com/peard_assets" target="_blank" rel="noopener noreferrer"><XLogo/> <span>X / Twitter</span><ArrowSquareOut/></a>
        <a href="https://peard.fun" target="_blank" rel="noopener noreferrer"><GlobeHemisphereWest/> <span>Peard</span><ArrowSquareOut/></a>
        <a href="https://docs.peard.fun" target="_blank" rel="noopener noreferrer"><BookOpen/> <span>Docs</span><ArrowSquareOut/></a>
      </div> : null}
      <button className={`more${moreOpen ? " active" : ""}`} type="button" aria-expanded={moreOpen} aria-controls="more-menu" onClick={() => setMoreOpen((open) => !open)}>
        <DotsThreeOutline/> More
      </button>
    </div>
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
    <form className="search" role="search" action="/">
      <button className="search-submit" type="submit" aria-label="Search"><MagnifyingGlass/></button>
      <input
        type="search"
        name="q"
        aria-label="Search coins"
        placeholder="Search coins"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key !== "Enter") return;
          event.preventDefault();
          event.currentTarget.form?.requestSubmit();
        }}
      />
    </form>
    <div className="topbar-actions">
      <ConnectButton/>
    </div>
  </header>;
}
