// Types
type IConfig = {
  decimals: number;
  airdrop: Record<string, number>;
};

// Config from generator
const config: IConfig = {
  decimals: 18,
  airdrop: {
    "0xa33dF9272C7EdCdce4bf920f601FE5A00C38F75c": 100000,
    "0x37112CB8E83B30B24bB39f453dcEE69f8cA61058": 100000,
    "0x508f07c99802B93b1c1F66B7E88122C53fc0Ed96": 700000,
    "0xCDAb1207081d70F15798bdbD677C90E6a3EfF7b6": 500000
  }
};

// Export config
export default config;
