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

////export const environment = {
////    production: false,
////    poolsAddressesURL: 'https://raw.githubusercontent.com/tosdis/TosDisFinance/main/pools.json',
////    eth: {
////        stakeMasterAddress: '0x4F4Cc1c62945D702CB70Cf77D90B6E45f7de211D',
////        UniswapV2Factory: '0x5c69bee701ef814a2b6a3edd4b1652cb9cc5aa6f',
////        UniswapV2Router02: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
////        WETHAddress: '0xd0a1e359811322d97991e03f863a0c30c2cf029c',
////        explorerURL: 'https://kovan.etherscan.io/tx/',
////        idoMasterAddress: '0xf1e4ede634da80646facfe6b4c176dc0f05c95b6',

////        stakeStartBlock: '23342413',
////        idoStartBlock: '23426715',

////        bridgeAddress: "0x221A3e8490734E51B29199470EE35922e1668AD9"
////    },
////    bsc: {
////        stakeMasterAddress: '0x5ff1e447e65DDd9E623C746d658f5a3cD10a1C3b',
////        UniswapV2Factory: '',
////        UniswapV2Router02: '',
////        WETHAddress: '',
////        explorerURL: 'https://testnet.bscscan.com/tx/',
////        idoMasterAddress: '0x21119F2aF8855f644C70005dC2bf8C3d5DfE5B18',

////        stakeStartBlock: '6484541',
////        idoStartBlock: '6486695',

////        bridgeAddress: "0x42631c7ef362a1F7B4713c8c03cE4C7d5dB56512"
////    },
////    //remoteServiceBaseUrl: "http://localhost:60243",
////    remoteServiceBaseUrl: "https://testbridge-api.tosdis.finance",
////    logging: true
////};