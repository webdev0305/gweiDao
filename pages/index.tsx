import Image from "next/image"; // Images
import { eth } from "state/eth"; // State container
import Layout from "components/Layout"; // Layout wrapper
import { useRouter } from "next/router"; // Routing
import styles from "styles/pages/Home.module.scss"; // Page styles

// Setup project details
const tokenName: string = process.env.NEXT_PUBLIC_TOKEN_NAME ?? "Token Name";
const heading: string = process.env.NEXT_PUBLIC_HEADING ?? "Some heading";
const description: string =
  process.env.NEXT_PUBLIC_DESCRIPTION ?? "Some description";

export default function Home() {
  // Routing
  const { push } = useRouter();
  // Authentication status
  const { address }: { address: string | null } = eth.useContainer();

  return (
    <Layout>
      <div className={styles.home}>
        {/* Project logo */}
        <div>
          <Image src="/largeLogo.png" alt="Logo" width={250} height={250} priority />
        </div>
        <h1 style={{color: "black"}}>GWEI DAO</h1>
        <a
          href="https://mirror.xyz/"
          target="_blank"
          rel="noopener noreferrer"
          style={{margin: '1rem'}}
        >
          Introducing GWEI
          {/* <Image src="/icons/arrow.svg" alt="Arrow" height={12} width={12} /> */}
        </a>
        {address && <div>

          <button onClick={() => push("/claim")}>Claim Tokens</button>
          <button >Staking</button>
          <button onClick={() => push("/data")}>Data</button>
        
        </div>
        }
        {/* Project heading */}
        <h1 style={{fontWeight: 500, margin: '1rem 0rem'}}>Help shape the feature of web3</h1>

        {/* Project description */}
        <p>The governance token for the GWEI DAO, an ultra-DAO formed with the vision of being the core heart and voice of the largest community of the native users on Binance Samrt Chain,  bridging the worlds of Defi, NFTs and DApps.</p>

        {/* Claim button */}
        {!address &&
          // If not authenticated, disabled
          <button disabled>Connect Wallet to Claim Tokens</button>
        }
      </div>
    </Layout>
  );
}
