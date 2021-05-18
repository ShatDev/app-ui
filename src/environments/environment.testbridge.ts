export const environment = {
    production: false,
    poolsAddressesURL: 'https://raw.githubusercontent.com/tosdis/TosDisFinance/main/pools.json',
    eth: {
        stakeMasterAddress: '0x4F4Cc1c62945D702CB70Cf77D90B6E45f7de211D',
        UniswapV2Factory: '0x5c69bee701ef814a2b6a3edd4b1652cb9cc5aa6f',
        UniswapV2Router02: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
        WETHAddress: '0xd0a1e359811322d97991e03f863a0c30c2cf029c',
        explorerURL: 'https://kovan.etherscan.io/tx/',
        idoMasterAddress: '0xf1e4ede634da80646facfe6b4c176dc0f05c95b6',

        stakeStartBlock: '23342413',
        idoStartBlock: '23426715',

        bridgeAddress: "0xf0e42a22440b39630876a655d7486710a5adaa01"
    },
    bsc: {
        stakeMasterAddress: '0x5ff1e447e65DDd9E623C746d658f5a3cD10a1C3b',
        UniswapV2Factory: '',
        UniswapV2Router02: '',
        WETHAddress: '',
        explorerURL: 'https://testnet.bscscan.com/tx/',
        idoMasterAddress: '0x21119F2aF8855f644C70005dC2bf8C3d5DfE5B18',

        stakeStartBlock: '6484541',
        idoStartBlock: '6486695',

        bridgeAddress: "0xd86eaa0e8d2b4bac9685288cffc662d97e2aa5d7"
    },
    //remoteServiceBaseUrl: "http://localhost:60243",
    remoteServiceBaseUrl: "https://testbridge-api.tosdis.finance",
    logging: true
};