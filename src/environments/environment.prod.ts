export const environment = {
    production: true,
    poolsAddressesURL: 'https://raw.githubusercontent.com/tosdis/TosDisFinance/main/pools.json',
    eth: {
        stakeMasterAddress: '0xC9F1808F45B53Bf4FC399C4c3ad4Ea2523669f10',
        UniswapV2Factory: '0x5c69bee701ef814a2b6a3edd4b1652cb9cc5aa6f',
        UniswapV2Router02: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
        WETHAddress: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
        explorerURL: 'https://etherscan.io/tx/',
        idoMasterAddress: '',

        stakeStartBlock: '12173216',
        idoStartBlock: '12173216',
        bridgeAddress: "0x3C5Eb624e578D368190642Adfb2C06e829584C9f"
    },
    bsc: {
        stakeMasterAddress: '0xC9F1808F45B53Bf4FC399C4c3ad4Ea2523669f10',
        UniswapV2Factory: '0xBCfCcbde45cE874adCB698cC183deBcF17952812',
        UniswapV2Router02: '0x05fF2B0DB69458A0750badebc4f9e13aDd608C7F',
        WETHAddress: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
        explorerURL: 'https://bscscan.com/tx/',
        idoMasterAddress: '0xcaf2e9e334c0294913b2101258832bbafb10a044',
        stakeStartBlock: '6419209',
        idoStartBlock: '6419209',
        bridgeAddress: "0x3C5Eb624e578D368190642Adfb2C06e829584C9f"
    },
    remoteServiceBaseUrl: "https://main-api.tosdis.finance",
    logging: true
};