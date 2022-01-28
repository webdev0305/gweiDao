import Link from "next/link"; // Dynamic routing
import Image from "next/image"; // Images
import { eth } from "state/eth"; // Global state
import { useState } from "react"; // State management
import styles from "styles/components/Header.module.scss"; // Component styles

/**
 * Links to render in action menu
 * @dev Does not render any links where url is undefined, allowing conditional rendering
 */
const actionMenuLinks: {
  name: string;
  icon: string;
  url: string | undefined;
}[] = [
  {
    name: "About",
    icon: "/icons/info.svg",
    url: process.env.NEXT_PUBLIC_ARTICLE,
  },
  {
    name: "Discord",
    icon: "/icons/discord.svg",
    url: process.env.NEXT_PUBLIC_DISCORD,
  },
  {
    name: "Twitter",
    icon: "/icons/twitter.svg",
    url: process.env.NEXT_PUBLIC_TWITTER,
  },
  {
    name: "GitHub",
    icon: "/icons/github.svg",
    url: process.env.NEXT_PUBLIC_GITHUB,
  },
];

export default function Header() {
  // Global state
  const { address, unlock, lock }: { address: string | null; unlock: Function; lock: Function } =
    eth.useContainer();
  // Action menu open state
  const [menuOpen, setMenuOpen] = useState<boolean>(false);

  return (
    <div className={styles.header}>
      {/* Logo */}
      <div className={styles.header__logo}>
        <Link href="/">
          <a>
            <Image src="/gweidao.png" alt="Logo" width={58} height={58} priority />
          </a>
        </Link>
      </div>

      {/* Auth + details */}
      <div className={styles.header__actions}>
        {/* About button */}
        <a
            href="https://mirror.xyz/"
            target="_blank"
            rel="noreferrer"
        >
            <button style={{ height: "100%" }}>
                About
            </button>
        </a>
        {/* Unlock button */}
        
        {!address
            ? // If not connected, render connect wallet
              <button onClick={() => unlock()}>Connect Wallet</button>
            : // Else, render address
            <button onClick={() => lock()}>
              {address.substr(0, 6)}...{address.slice(address.length - 4)}
            </button>
        }
        {/* Actions button */}
        <button onClick={() => setMenuOpen((previous) => !previous)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={"/icons/threeDot.svg"} alt="settings" />
        </button>
      </div>

      {menuOpen ? (
        // Render actions menu if open
        <div className={styles.header__actionMenu}>
          {actionMenuLinks.map(({ name, icon, url }, i) => {
            // For each link with a defined url
            return url ? (
              // Render action link containing name and image
              <a href={url} target="_blank" rel="noopener noreferrer" key={i}>
                <span>{name}</span>
                <Image src={icon} width={16} height={16} alt={`${name} icon`} />
              </a>
            ) : null;
          })}
        </div>
      ) : null}
    </div>
  );
}
