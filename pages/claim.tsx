import { eth } from "state/eth"; // Global state: ETH
import { useState, useEffect } from "react"; // State management
import { token } from "state/token"; // Global state: Tokens
import Layout from "components/Layout"; // Layout wrapper
import styles from "styles/pages/Claim.module.scss"; // Page styles
import { auth, get } from "@upstash/redis";

export default function Claim() {
  // Global ETH state
  const { address, unlock, accountInfo }: { address: string | null; unlock: Function; accountInfo: any } =
    eth.useContainer();
  // Global token state
  const {
    dataLoading,
    numTokens,
    alreadyClaimed,
    claimAirdrop,
  }: {
    dataLoading: boolean;
    numTokens: number;
    alreadyClaimed: boolean;
    claimAirdrop: Function;
  } = token.useContainer();
  // Local button loading
  const [buttonLoading, setButtonLoading] = useState<boolean>(false);

  // useEffect(() => {
  //   const claimTokens = async () => {
  //     try {
  //       setRebateLoading(true);
  //       const GAS_DAO_TOKEN_ADDRESS = process.env.REACT_APP_CONTRACT;

  //       var web3 = new Web3(Web3.givenProvider || process.env.REACT_APP_INFURA);

  //       var GAS = new web3.eth.Contract(
  //         GasDaoTokenArtifacts.abi,
  //         GAS_DAO_TOKEN_ADDRESS
  //       );
  //       await GAS.methods
  //         .delegates(props.address)
  //         .call()
  //         .then(function (delegatee: string) {
  //           setDelegatee(delegatee);
  //         });

  //       await GAS.methods
  //         .balanceOf(props.address)
  //         .call()
  //         .then(function (balance: number) {
  //           setBalance(
  //             truncate(web3.utils.fromWei(balance.toString(), "ether"), 2)
  //           );
  //         });

  //       // query rebate
  //       auth(process.env.REACT_APP_UPSTASH, process.env.REACT_APP_UPSTASH_KEY);
  //       await get("stake-" + props.address).then((result) => {
  //         let data = JSON.parse(result.data);
  //         console.log(data);
  //         if (data == null) {
  //           console.log("Address DNE");
  //         } else {
  //           const { block, count, count_total, eth, eth_total, reward, unix } =
  //             data;
  //           // Set variables
  //           setBlock(block);
  //           setCount(count);
  //           setCountTotal(count_total);
  //           setEth(truncate(eth, 4));
  //           setEthTotal(truncate(eth_total, 4));
  //           setReward(truncate(reward, 2));
  //           const now = new Date();
  //           const last = new Date(unix * 1000);
  //           //@ts-ignore
  //           const hours = (now - last) / (1000 * 60 * 60);
  //           console.log(hours);
  //           setHours(Math.floor(hours));
  //           const minutes = (hours % 1) * 60;
  //           setMinutes(Math.floor(minutes));
  //         }
  //       });
  //       const STUB_ADDR = "stake-0xE18260C2483562E7CE5FfCab7a6142598F36aF2A";
  //       if (count === 0) {
  //         await get(STUB_ADDR).then((result) => {
  //           let data = JSON.parse(result.data);
  //           const { block, count_total, eth_total, unix } = data;
  //           // Set variables, but NOT reward (bc the address is stubbed and
  //           // we're just getting group-level data)
  //           setBlock(block);
  //           setCountTotal(count_total);
  //           setEthTotal(truncate(eth_total, 4));
  //           console.log(countTotal);
  //           console.log(ethTotal);
  //           const now = new Date();
  //           const last = new Date(unix * 1000);
  //           //@ts-ignore
  //           const hours = (now - last) / (1000 * 60 * 60);
  //           console.log(hours);
  //           setHours(Math.floor(hours));
  //           const minutes = (hours % 1) * 60;
  //           setMinutes(Math.floor(minutes));
  //         });
  //       }
  //     } catch (err) {
  //       console.log(err);
  //       setRebateLoading(false);
  //     } finally {
  //       setRebateLoading(false);
  //     }
  //   };
  //   claimTokens();
  // }, [props, setRebateLoading, count]);

  /**
   * Claims airdrop with local button loading
   */
  const claimWithLoading = async () => {
    setButtonLoading(true); // Toggle
    await claimAirdrop(); // Claim
    setButtonLoading(false); // Toggle
  };



  return (
    <Layout>
      <div className={styles.claim}>
        {!address ? (
          // Not authenticated
          <div className={styles.card}>
            <h1>You are not authenticated.</h1>
            <p>Please connect with your wallet to check your airdrop.</p>
            <button onClick={() => unlock()}>Connect Wallet</button>
          </div>
        ) : dataLoading ? (
          // Loading details about address
          <div className={styles.card}>
            <h1>Loading airdrop details...</h1>
            <p>Please hold while we collect details about your address.</p>
          </div>
        ) : numTokens == 0 ? (
          // Not part of airdrop
          <div className={styles.card}>
            <h1>You do not qualify.</h1>
            <p>Unfortunately, your address does not qualify for the airdrop.</p>
          </div>
        ) : alreadyClaimed ? (
          // Already claimed airdrop
          <div className={styles.card}>
            <h1>Already claimed.</h1>
            <p>
              Your address ({address}) has already claimed {numTokens} tokens.
            </p>
          </div>
        ) : (

          <div>
            <h1>Claim your Rewards</h1>
            <h2>Reward Criteria</h2>
            <div className={styles.content}>
              <div>BNB Spent</div>
              <div>
                <div>Amount</div>
                <div>{accountInfo.ownSpent} BNB</div>
              </div>
              <div>
                <div>Sub-Total</div>
                <div>{accountInfo.totalSpent} BNB</div>
              </div>
            </div>
            <div className={styles.content}>
              <div>Transactions</div>
              <div>
                <div>Amount</div>
                <div>{accountInfo.ownCount}</div>
              </div>
              <div>
                <div>Sub-Total</div>
                <div>{accountInfo.totalCount}</div>
              </div>
            </div>
            <hr />
            <div className={styles.result}>
              <div>Rewards</div>
              <div>{accountInfo.rewards} GAS</div>
            </div>
            <button onClick={claimWithLoading} disabled={buttonLoading}>
              {buttonLoading ? "Claiming..." : "Claim"}
            </button>
          </div>

        )}
      </div>
    </Layout>
  );
}
