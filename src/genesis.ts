const TESTNET_GENESIS = "testnet-v1.0";
const MAINNET_GENESIS = "mainnet-v1.0";

export function assertTestNetGenesis(genesisId: string): void {
  if (genesisId === MAINNET_GENESIS) {
    throw new Error("Refusing MainNet genesis " + genesisId + ". This bot is TestNet only.");
  }
  if (genesisId !== TESTNET_GENESIS) {
    throw new Error("Refusing genesis " + genesisId + ". Expected " + TESTNET_GENESIS + ".");
  }
}
