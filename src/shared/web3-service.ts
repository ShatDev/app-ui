import { Injectable, EventEmitter } from "@angular/core";
import Web3 from "web3";
import WalletConnectProvider from "@walletconnect/web3-provider";
import { EventBus } from "./event-bus";
import detectEthereumProvider from "@metamask/detect-provider";
import BigNumber from "bignumber.js";

import stakeMaster from 'assets/abi/StakeMaster.json';
import stakingPool from 'assets/abi/StakingPool.json';
import IERC20 from 'assets/abi/IERC20.json';
import ERC20Basic from 'assets/abi/ERC20Basic.json';
import UniswapV2Factory from 'assets/abi/UniswapV2Factory.json';
import UniswapV2Pair from 'assets/abi/UniswapV2Pair.json';
import UniswapV2Router from 'assets/abi/UniswapV2Router.json';
import idoMaster from 'assets/abi/IDOMaster.json';
import idoPool from 'assets/abi/IDOPool.json';
import { environment } from "../environments/environment";
import { UserSessionProvider } from "./user-session-provider";

export class ChainError extends Error {
    constructor(message) {
        super(message);
        this.name = "ChainError";
    }
}


@Injectable({
    providedIn: 'root',
})

export class Web3Service {
    public readonly stakeMasterAbi: any;
    public readonly stakingPoolAbi: any;
    public readonly IERC20Abi: any;
    public readonly ERC20BasicAbi: any;
    public readonly UniswapV2FactoryAbi: any;
    public readonly UniswapV2PairAbi: any;
    public readonly UniswapV2RouterAbi: any;
    public readonly idoMasterAbi: any;
    public readonly idoPoolAbi: any;


    public web3: Web3;
    private walletConnectProvider: WalletConnectProvider;
    private ethereumProvider: any;

    //TODO: chack network
    public get chainId(): string {
        if (environment.production) {
            if (this.userSessionProvider.getIsBSC)
                return '0x38';
            else
                return '0x01';
        }
        //testnet
        else {
            if (this.userSessionProvider.getIsBSC)
                return '0x61';
            else
                return '0x2a';
        }
    };

    constructor(private eventBus: EventBus, private userSessionProvider: UserSessionProvider,) {
        console.log('Web3Service constructor');
        this.stakeMasterAbi = stakeMaster.abi;
        this.stakingPoolAbi = stakingPool.abi;
        this.IERC20Abi = IERC20.abi;
        this.ERC20BasicAbi = ERC20Basic.abi;
        this.UniswapV2FactoryAbi = UniswapV2Factory.abi;
        this.UniswapV2PairAbi = UniswapV2Pair.abi;
        this.UniswapV2RouterAbi = UniswapV2Router.abi;
        this.idoMasterAbi = idoMaster.abi;
        this.idoPoolAbi = idoPool.abi;
    }


    async initWeb3() {
        this.ethereumProvider = await detectEthereumProvider({timeout: 1000});
        if (this.ethereumProvider) {
            this.web3 = new Web3(this.ethereumProvider);

            var metamaskChainId = this.convertChainIdToHex(await this.web3.eth.getChainId());
            //await window.ethereum.request({ method: 'eth_chainId' });
            console.log("matamask chainId: " + metamaskChainId);
            if (metamaskChainId != this.chainId) {
                this.setWeb3OnCustomRPC();
            }
            return;
        }

        else {
            //this.isWeb3Disabled = true;
            if (!this.web3) {
                this.setWeb3OnCustomRPC();
            }
        }

        //await this.updateChanId();

        //this.web3 = new Web3("https://mainnet.infura.io/v3/24327bb89ca04f38991d4b88036b70fa");
        //this.chainId = '0x2a';

        //this.chainId = '0x01';

        //await this.WalletConnect();
    }

    private web3ForEvents: Web3;

    private setWeb3OnCustomRPC() {
        console.log('set custom RPC for web3');
        if (environment.production) {
            if (this.userSessionProvider.getIsBSC)
                this.web3 = new Web3("https://bsc-dataseed.binance.org/");
            else
                this.web3 = new Web3("https://mainnet.infura.io/v3/24327bb89ca04f38991d4b88036b70fa");
        }
        else {
            //BSC testnet
            if (this.userSessionProvider.getIsBSC)
                this.web3 = new Web3("https://data-seed-prebsc-1-s1.binance.org:8545/");
            else
                this.web3 = new Web3("https://kovan.infura.io/v3/46e5f1638bb04dd4abb7f75bfd4f8898");
        }
    }

    public get getWeb3ForEvents(): Web3 {
        //Work with our node for BSC MainNet
        if (this.chainId === '0x38') {
            if (!this.web3ForEvents) {
                //this.web3ForEvents = new Web3('https://rpcbsc.tosdis.finance/');
                this.web3ForEvents = new Web3('wss://wsbsc.tosdis.finance/');
            }
            return this.web3ForEvents;
        }
        return this.web3;
    }

    async WalletConnect() {
        console.log('WalletConnect');
        //  Create WalletConnect Provider
        this.walletConnectProvider = new WalletConnectProvider({
            rpc: {
                1: "https://mainnet.infura.io/v3/24327bb89ca04f38991d4b88036b70fa",
                42: "https://kovan.infura.io/v3/24327bb89ca04f38991d4b88036b70fa",
                //BSC mainnet 56 
                56: "https://bsc-dataseed.binance.org/",
                //BSC testnet
                97: "https://data-seed-prebsc-1-s1.binance.org:8545/"
            },
        });
        this.walletConnectProvider.chainId = parseInt(this.chainId);

        //  Enable session (triggers QR Code modal)
        var addresses = await this.walletConnectProvider.enable();
        console.log(addresses);

        //  Create Web3
        this.web3 = new Web3(this.walletConnectProvider as any);

        //  Get Chain Id
        //TODO: fix chain Id
        //var test = (await this.web3.eth.net.getId()).toString(16);
        var walletChainId = this.convertChainIdToHex(await this.web3.eth.getChainId());
        console.log('Wallet connect chainId: ' + walletChainId);

        if (this.chainId != walletChainId) {
            if (this.userSessionProvider.getIsBSC) {
                if (environment.production)
                    throw new ChainError(`Select BSC Network in your wallet.`);
                else
                    throw new ChainError(`Select BSC Testnet Network in your wallet.`);
            }
            else {
                if (environment.production)
                    throw new ChainError(`Select Mainnet Network in your wallet.`);
                else
                    throw new ChainError(`Select Kovan Network in your wallet.`);
            }
            //this.userSessionProvider.finishSession();
        }

        //if (environment.production) {
        //    if (chainId != 1)
        //        throw new ChainError("`Select Mainnet Network.");
        //}
        //else {
        //    if (chainId != 42)
        //        throw new ChainError("Select Kovan Network.");
        //}

        // Subscribe to accounts change
        this.walletConnectProvider.on("accountsChanged", (accounts: string[]) => {
            console.log("accountsChanged " + accounts);
            this.eventBus.accountsChanged.emit(accounts)
        });

        // Subscribe to chainId change
        this.walletConnectProvider.on("chainChanged", (chainId: number) => {
            console.log("chainChanged" + chainId);

            this.eventBus.chainChanged.emit(this.convertChainIdToHex(chainId));
        });

        // Subscribe to session connection
        this.walletConnectProvider.on("connect", () => {
            console.log("connect");
            this.eventBus.walletConnect.emit("");
        });

        // Subscribe to session disconnection
        this.walletConnectProvider.on("disconnect", (code: number, reason: string) => {
            console.log(code, reason);
            this.eventBus.walletDisconnect.emit(reason);
        });


        //console.log(this.web3);
        return addresses;
    }


    public convertChainIdToHex(value: number): string {
        var hexChainId = '0x' + value.toString(16);
        if (hexChainId === '0x1')
            hexChainId = "0x01";
        return hexChainId;
    }

    async WalletDisconnect() {
        if (this.walletConnectProvider) {
            // Close provider session
            await this.walletConnectProvider.disconnect()
        }
    }


    //#region web3
    async GetTransactionReceipt(tx: string): Promise<any> {
        return new Promise((resolve, reject) => {
            this.web3.eth.getTransactionReceipt(tx, (error, resp) => {
                console.log(resp);
                resolve(resp);
            });
        }) as Promise<any>;
    }

    async GetDecimals(contractAddress: string): Promise<any> {
        return new Promise((resolve, reject) => {
            let contract = new this.web3.eth.Contract(this.ERC20BasicAbi, contractAddress);
            contract.methods.decimals().call({}, (error, resp) => {
                resolve(resp);
            });
        }) as Promise<any>;
    }

    async GetTotalSupply(contractAddress: string): Promise<any> {
        return new Promise((resolve, reject) => {
            let contract = new this.web3.eth.Contract(this.ERC20BasicAbi, contractAddress);
            contract.methods.totalSupply().call({}, (error, resp) => {
                resolve(resp);
            });
        }) as Promise<any>;
    }


    async GetAllowance(account: string, tokenForspend: string, forContractAddress: string): Promise<any> {
        return new Promise((resolve, reject) => {
            let contract = new this.web3.eth.Contract(this.ERC20BasicAbi, tokenForspend);
            contract.methods.allowance(account, forContractAddress).call({}, (error, resp) => {
                resolve(resp);
            });
        }) as Promise<any>;
    }

    async GetTokenBalance(account: string, tokenAddress: string): Promise<any> {
        return new Promise((resolve, reject) => {
            let contract = new this.web3.eth.Contract(this.ERC20BasicAbi, tokenAddress);
            contract.methods.balanceOf(account).call({}, (error, resp) => {
                resolve(resp);
            });
        }) as Promise<any>;
    }

    async GetContractSymbol(tokenAddress: string): Promise<any> {
        return new Promise((resolve, reject) => {
            let contract = new this.web3.eth.Contract(this.ERC20BasicAbi, tokenAddress);
            contract.methods.symbol().call({}, (error, resp) => {
                resolve(resp);
            });
        }) as Promise<any>;
    }

    //async Approve(account: string, tokenForspend: string, forContractAddress: string): Promise<any> {
    //    return new Promise((resolve, reject) => {
    //        // Get contract instance
    //        let tokenContract = new this.web3.eth.Contract(this.IERC20Abi, tokenForspend);

    //        tokenContract.methods.approve(forContractAddress, '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff')
    //            .send({ from: account }, (error, resp) => {
    //                console.log(resp);
    //                resolve(resp);
    //            });
    //    }) as Promise<any>;
    //}


    async ApproveOn(account: string, tokenForspend: string, forContractAddress: string): Promise<any> {
        return new Promise((resolve, reject) => {
            // Get contract instance
            let tokenContract = new this.web3.eth.Contract(this.IERC20Abi, tokenForspend);

            return tokenContract.methods.approve(forContractAddress, '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff')
                .send({ from: account })
                .on('transactionHash', function (hash) {
                    console.info('transactionHash');
                    console.info(hash);
                })
                .on('receipt', function (receipt) {
                    console.info('receipt');
                    console.info(receipt);
                    resolve(receipt);
                })
                .on('error', function (error, receipt) {
                    console.error(error);
                    console.error(receipt);
                    reject(error);
                    //this.waiting = false;
                });
        }) as Promise<any>;
    }

    //#region Uniswap

    //#endregion Uniswap

    async GetPairAddress(uniswapV2Factory: string, contract1: string, contract2: string): Promise<any> {
        return new Promise((resolve, reject) => {
            let contract = new this.web3.eth.Contract(this.UniswapV2FactoryAbi, uniswapV2Factory);
            contract.methods.getPair(contract1, contract2).call({}, (error, resp) => {
                resolve(resp);
            });
        }) as Promise<any>;
    }


    async getAmountsOut(uniswapV2Router02: string, amountIn: number, path: string[]): Promise<any> {
        return new Promise((resolve, reject) => {
            let stringAmountIn = "0x" + new BigNumber(amountIn).toString(16);
            let contract = new this.web3.eth.Contract(this.UniswapV2RouterAbi, uniswapV2Router02);
            contract.methods.getAmountsOut(stringAmountIn, path).call({}, (error, resp) => {
                resolve(resp);
            });
        }) as Promise<any>;
    }


    async getUniToken0(tokenAddress: string): Promise<any> {
        return new Promise((resolve, reject) => {
            let contract = new this.web3.eth.Contract(this.UniswapV2PairAbi, tokenAddress);
            contract.methods.token0().call({}, (error, resp) => {
                resolve(resp);
            });
        }) as Promise<any>;
    }

    async getUniToken1(tokenAddress: string): Promise<any> {
        return new Promise((resolve, reject) => {
            let contract = new this.web3.eth.Contract(this.UniswapV2PairAbi, tokenAddress);
            contract.methods.token1().call({}, (error, resp) => {
                resolve(resp);
            });
        }) as Promise<any>;
    }

    async getUniReserves(tokenAddress: string): Promise<any> {
        return new Promise((resolve, reject) => {
            let contract = new this.web3.eth.Contract(this.UniswapV2PairAbi, tokenAddress);
            contract.methods.getReserves().call({}, (error, resp) => {
                resolve(resp);
            });
        }) as Promise<any>;
    }

    async getEthBalance(customerAddress): Promise<any> {
        return new Promise((resolve, reject) => {
            this.web3.eth.getBalance(customerAddress, (error, balance) => {
                resolve(balance);
            });
        }) as Promise<any>;
    }

    async getOwner(contractAddress: string): Promise<any> {
        return new Promise((resolve, reject) => {
            //TODO: don't work
            //let abi = [{
            //    inputs: [],
            //    name: "owner",
            //    outputs: [
            //        {
            //            internalType: "address",
            //            name: "",
            //            type: "address"
            //        }
            //    ],
            //    stateMutability: "view",
            //    type: "function",
            //    constant: true
            //}];
            let contract = new this.web3.eth.Contract(this.stakeMasterAbi, contractAddress);
            contract.methods.owner().call({}, (error, resp) => {
                resolve(resp);
            });
        }) as Promise<any>;
    }



    //#region  idoPool

    async vipTier(masterAddress: string): Promise<any> {
        return new Promise((resolve, reject) => {
            let contract = new this.web3.eth.Contract(this.idoMasterAbi, masterAddress);
            contract.methods.vipTier().call({}, (error, resp) => {
                resolve(resp);
            });
        }) as Promise<any>;
    }

    async holdersTier(masterAddress: string): Promise<any> {
        return new Promise((resolve, reject) => {
            let contract = new this.web3.eth.Contract(this.idoMasterAbi, masterAddress);
            contract.methods.holdersTier().call({}, (error, resp) => {
                resolve(resp);
            });
        }) as Promise<any>;
    }

    async publicTier(masterAddress: string): Promise<any> {
        return new Promise((resolve, reject) => {
            let contract = new this.web3.eth.Contract(this.idoMasterAbi, masterAddress);
            contract.methods.publicTier().call({}, (error, resp) => {
                resolve(resp);
            });
        }) as Promise<any>;
    }

    //TODO: check maxETH is string
    async getMasterMaxEthPayment(userAddress: string, maxETH: string, masterAddress: string): Promise<any> {
        return new Promise((resolve, reject) => {
            let contract = new this.web3.eth.Contract(this.idoMasterAbi, masterAddress);
            contract.methods.getMaxEthPayment(userAddress, maxETH).call({}, (error, resp) => {
                resolve(resp);
            });
        }) as Promise<any>;
    }

    async getFullDisBalance(userAddress: string, masterAddress: string): Promise<any> {
        return new Promise((resolve, reject) => {
            let contract = new this.web3.eth.Contract(this.idoMasterAbi, masterAddress);
            contract.methods.getFullDisBalance(userAddress).call({}, (error, resp) => {
                resolve(resp);
            });
        }) as Promise<any>;
    }
    

    async getIdoCreatorProxy(masterAddress: string): Promise<string> {
        return new Promise((resolve, reject) => {
            let contract = new this.web3.eth.Contract(this.idoMasterAbi, masterAddress);
            contract.methods.creatorProxy().call({}, (error, resp) => {
                resolve(resp);
            });
        }) as Promise<string>;
    }


    //#endregion idoMaster

    //#region  idoPool

    async HasWhitelisting(idoAddress: string): Promise<any> {
        return new Promise((resolve, reject) => {
            let contract = new this.web3.eth.Contract(this.idoPoolAbi, idoAddress);
            contract.methods.hasWhitelisting().call({}, (error, resp) => {
                resolve(resp);
            });
        }) as Promise<any>;
    }

    async IsEnableTierSystem(idoAddress: string): Promise<any> {
        return new Promise((resolve, reject) => {
            let contract = new this.web3.eth.Contract(this.idoPoolAbi, idoAddress);
            contract.methods.enableTierSystem().call({}, (error, resp) => {
                resolve(resp);
            });
        }) as Promise<any>;
    }




    async IsWhitelisted(idoAddress: string, userAddress): Promise<any> {
        return new Promise((resolve, reject) => {
            let contract = new this.web3.eth.Contract(this.idoPoolAbi, idoAddress);
            contract.methods.isWhitelisted(userAddress).call({}, (error, resp) => {
                resolve(resp);
            });
        }) as Promise<any>;
    }


    //#endregion idoPool

    //#endregion web3

}