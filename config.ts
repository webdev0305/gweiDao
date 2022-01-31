// Types
type IConfig = {
  decimals: number;
  airdrop: Record<string, number>;
};

// Config from generator
const config: IConfig = {
  decimals: 18,
  airdrop: {
    "0xa33df9272c7edcdce4bf920f601fe5a00c38f75c": 100000,
    "0x37112cb8e83b30b24bb39f453dcee69f8ca61058": 100000,
    "0x508f07c99802b93b1c1f66b7e88122c53fc0ed96": 700000,
    "0xcdab1207081d70f15798bdbd677c90e6a3eff7b6": 500000
  }
};

// Export config
export default config;
