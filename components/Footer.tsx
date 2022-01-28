import Image from "next/image"; // Images
import styles from "styles/components/Footer.module.scss"; // Component styles

/**
 * Links to render in footer
 * @dev Does not render any links where url is undefined, allowing conditional rendering
 */
const footerLinks: { icon: string; url: string | undefined }[] = [
  // Snapshot
  { icon: "/icons/snapshot.svg", url: "https://snapshot.org/" },
  // Twitter
  { icon: "/icons/twitter.svg", url: "https://twitter.com/" },
  // Github
  { icon: "/icons/github.svg", url: "https://github.com/" },
  // Discord
  { icon: "/icons/discord.svg", url: "https://discord.gg/" },
];

export default function Footer() {
  return (
    <div className={styles.footer}>
      {footerLinks.map(({ icon, url }, i) => {
        // For each link in footer that is valid
        return url ? (
          // Render link with icon image
          <a href={url} target="_blank" rel="noopener noreferrer" key={i}>
            <Image src={icon} alt="Social link" width={30} height={30} />
          </a>
        ) : null;
      })}
    </div>
  );
}
