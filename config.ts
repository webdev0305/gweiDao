// Types
type IConfig = {
  decimals: number;
  airdrop: Record<string, number>;
};

// Config from generator
const config: IConfig = {
  decimals: 18,
  airdrop: {
    "0xa33df9272c7edcdce4bf920f601fe5a00c38f75c": 1000,
  },
};

// Export config
export default config;
