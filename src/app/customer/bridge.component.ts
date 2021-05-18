import { Component, OnInit, OnDestroy } from "@angular/core";
import { slideFromBottom } from "shared/animation";
import { ComponentBase } from "shared/component-base";
import { EventBus } from "shared/event-bus";
import { Router } from '@angular/router';
import { TranslateService } from "@ngx-translate/core";
import Web3 from "web3";
import { BigNumber } from "bignumber.js";
import { PaybackEventDTO, PaybackEventsServiceProxy, TransitEventDTO, TransitEventServiceProxy } from "../../service-proxies/service-proxies";
import { environment } from "../../environments/environment";
import { UserSessionProvider } from "../../shared/user-session-provider";

@Component({
    templateUrl: "bridge.component.html",
    animations: [slideFromBottom()]
})
//TODO: change URL explorer

export class BridgeComponent extends ComponentBase implements OnInit, OnDestroy {
    constructor(private _router: Router,
        private paybackEventsService: PaybackEventsServiceProxy,
        private transitEventService: TransitEventServiceProxy,
        private userSessionProvider: UserSessionProvider,
        private translate: TranslateService,
        private eventBus: EventBus) {
        super();
    }

    waiting: boolean = false;

    public transitEvents: Array<TransitEventDTO> = [];
    public paybackEvents: Array<PaybackEventDTO> = [];

    step: number = 1;

    creatingPoolProcess: boolean = false;
    creatingPoolTx: string;
    //poolCreated: boolean= false;

    isTransitDis: boolean = true;
    tokenAddress: string = this.getDisAddress;
    tokenSymbol: string = "DIS";
    tokenDecimal: number;
    transferAmount: number;


    balanceAmount: number;

    account: string;


    public isApprovedTransferToken: boolean = false;

    async ngOnInit() {
        this.eventBus.loginEvent.subscribe(result => {
            console.log('loginEvent subscription:' + result);
            this.eventLogin(result);
        });

        this.eventBus.logoutEvent.subscribe(result => {
            console.log('logoutEvent subscription:' + result);
            this.eventLogout();
        });

        await this.web3Service.initWeb3();

        console.log("bridgeMasterAddress: " + this.bridgeMasterAddress)
    }

    async ngOnDestroy() {
    }

    updateTimerId;

    eventLogin(username: string): void {
        console.log('eventLogin');
        console.log(username);
        this.account = username;
        this.getPaybackEvents();
        this.getTransitEvent();

        this.updateTimerId = setInterval(() => {
            this.refreshDB()
        }, this.expectedBlockTime);
    }

    eventLogout(): void {
        this.account = "";
        this.paybackEvents = [];
        this.transitEvents = [];
        this.isTransitDis = true;
        this.tokenAddress = this.getDisAddress;
        this.tokenSymbol = "DIS";
        this.tokenDecimal = null;
        this.transferAmount = null;
        this.isApprovedTransferToken = false;
        this.step = 1;
        clearInterval(this.updateTimerId);
        console.log('eventLogout');
    }


    async getPaybackEvents() {
        this.paybackEventsService.getMy(this.account)
            //.finally(() => {
            //    this.unblockUI();
            //})
            .subscribe(result => {
                console.log(result);
                this.paybackEvents = result;
            },
                error => {
                    console.error(error);
                    //this.showError(error.json().message);
                });
    }

    async getTransitEvent() {
        this.transitEventService.getMy(this.account)
            //.finally(() => {
            //    this.unblockUI();
            //})
            .subscribe(result => {
                console.log(result);
                this.transitEvents = result;
            },
                error => {
                    console.error(error);
                    //this.showError(error.json().message);
                });
    }

    approveTransferTokenClick(): void {
        this.waiting = true;
        this.web3Service.ApproveOn(this.account, this.tokenAddress, this.bridgeMasterAddress)
            .then((response: any) => {
                this.translate.get('Confirmed transaction')
                    .subscribe((langResp: string) => {
                        this.showSuccessModal(langResp);
                    });
                this.updateAllowanceTransferToken();
            }).catch((response: any) => {
                console.info('catch');
                console.info(response);
            }).finally(() => {
                console.info('finally');
                this.waiting = false;
            });
    }

    selectTransitDis(): void {
        this.isTransitDis = true;
        //this.tokenSymbol = "DIS";
        //this.tokenAddress = this.getDisAddress;
        this.toStep1();
    }

    selectTransitOtherToken(): void {
        this.isTransitDis = false;
        this.tokenSymbol = "";
        this.tokenAddress = "";
        this.toStep1();
    }

    toStep1(): void {
        this.step = 1;
        this.isApprovedTransferToken = false;
        if (this.isTransitDis) {
            this.tokenSymbol = "DIS";
            this.tokenAddress = this.getDisAddress;
        }
        else {
            this.tokenSymbol = "";
        }
        this.tokenDecimal = null;
    }

    async toStep2() {
        if (!Web3.utils.isAddress(this.tokenAddress)) {
            this.showError("Incorrect address");
            return;
        }

        if (this.isBNBChain) {
            var pairAddress = await this.GetPairFor(this.tokenAddress);
            console.log(`pairAddress ${pairAddress}`);
            if (pairAddress == "0x0000000000000000000000000000000000000000") {
                this.showErrorModal("Unsupported token");
                return;
            }
        }
        //if (this.balance < this.masterFeeAmount) {
        //    this.showErrorModal("Insufficient funds of " + this.feeSymbol);
        //    return;
        //}

        this.tokenDecimal = parseInt(await this.web3Service.GetDecimals(this.tokenAddress));
        this.tokenSymbol = await this.web3Service.GetContractSymbol(this.tokenAddress);

        this.balanceAmount = this.toNumberFromWei(await this.web3Service.GetTokenBalance(this.account, this.tokenAddress), this.tokenDecimal);

        this.step = 2;
        if (this.isETHChain) {
            this.updateAllowanceTransferToken();
        }
        else {
            //in BSC call burn (transfer in ETH)
            this.isApprovedTransferToken = true;
        }
        this.web3Service.GetContractSymbol(this.tokenAddress).then((resp) => {
            this.tokenSymbol = resp;
        });
    }

    updateAllowanceTransferToken(): void {
        //Проверяем разрешение тратить pool token в размере tokenSupply
        this.web3Service.GetAllowance(this.account, this.tokenAddress, this.bridgeMasterAddress).then((resp) => {
            console.log(`GetAllowance of transfer token ${resp}`);
            if (this.transferAmount <= this.toNumberFromWei(resp, this.tokenDecimal)) {
                this.isApprovedTransferToken = true;
            }
            else {
                this.isApprovedTransferToken = false;
            }
        });
    }


    createTransitForBSCClick(): void {
        if (this.balanceAmount < this.transferAmount) {
            this.showErrorModal("You send amount exceed balance!");
        }
        if (this.tokenDecimal) {
            this.waiting = true;
            this.createTransitForBSC(this.tokenAddress, this.transferAmount, this.tokenDecimal)
                .then((response: any) => {
                    console.info('receipt');
                    console.info(response);

                    this.waiting = false;
                    if (response) {
                        var stringHTML = '<p>Change network to BSC</p> <p>Wait for the transfer to be signed (12 confirmations)</p><p>Click Receive button to claim your converted tokens.</p>';
                        this.showInfoHTMLModal(stringHTML, "OK");
                        this.transferAmount = 0;
                        this.toStep1();
                        if (this.isTransitDis)
                            this.tokenAddress = this.getDisAddress;
                        else
                            this.tokenAddress = "";
                    }
                    //if (error) {
                    //    console.error(error);
                    //}
                }).catch((response: any) => {
                    console.info('catch');
                    console.info(response);
                    this.waiting = false;
                }).finally(() => {
                    console.info('finally');
                    this.waiting = false;
                });
        }
    }

    createPaybackTransitClick() {
        if (this.balanceAmount < this.transferAmount) {
            this.showErrorModal("You send amount exceed balance!");
        }
        if (this.tokenDecimal) {
            this.waiting = true;
            this.createPaybackTransit(this.tokenAddress, this.transferAmount, this.tokenDecimal)
                .then((response: any) => {
                    console.info('receipt');
                    console.info(response);

                    this.waiting = false;
                    if (response) {
                        var stringHTML = '<p>Change network to ETH</p> <p>Wait for the transfer to be signed (12 confirmations)</p><p>Click Receive button to claim your converted tokens.</p>';
                        this.showInfoHTMLModal(stringHTML, "OK");
                    }
                    //if (error) {
                    //    console.error(error);
                    //}
                }).catch((response: any) => {
                    console.info('catch');
                    console.info(response);
                    this.waiting = false;
                }).finally(() => {
                    console.info('finally');
                    this.waiting = false;
                });
        }
    }

    async createTransitForBSC(tokenAddress: string, amount: number, tokenDecimals: number): Promise<any> {
        return new Promise((resolve, reject) => {
            let masterContract = new this.web3Service.web3.eth.Contract(this.ethTransitAbi, environment.eth.bridgeAddress);

            let stringAmount = "0x" + new BigNumber(amount).shiftedBy(tokenDecimals).toString(16);

            return masterContract.methods.transitForBSC(tokenAddress, stringAmount)
                .send({ from: this.account })
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
                });
        }) as Promise<any>;
    }


    async createPaybackTransit(tokenAddress: string, amount: number, tokenDecimals: number): Promise<any> {
        return new Promise((resolve, reject) => {
            let masterContract = new this.web3Service.web3.eth.Contract(this.bscTransitAbi, environment.bsc.bridgeAddress);

            let stringAmount = "0x" + new BigNumber(amount).shiftedBy(tokenDecimals).toString(16);

            return masterContract.methods.paybackTransit(tokenAddress, stringAmount)
                .send({ from: this.account })
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
                });
        }) as Promise<any>;
    }


    withdrawTransitTokenClick(transitEvent: TransitEventDTO) {
        this.waiting = true;
        this.withdrawTransitToken(transitEvent.signature, transitEvent.transactionHash, transitEvent.amount, transitEvent.token,
            transitEvent.signedTokenName, transitEvent.signedTokenSymbol, transitEvent.signedTokenDecimals)
            .then((response: any) => {
                console.info('receipt');
                console.info(response);

                this.waiting = false;
                if (response) {
                    this.showSuccessModal("Confirmed transaction");
                    transitEvent.isWithdraw = true;
                }
                //if (error) {
                //    console.error(error);
                //}
            }).catch((response: any) => {
                console.info('catch');
                console.info(response);
                this.waiting = false;
            }).finally(() => {
                console.info('finally');
                this.waiting = false;
            });
    }
    //withdrawTransitToken(
    //    bytes calldata _signature,
    //    bytes32 _transitId,
    //    uint _amount,
    //    address _token,
    //    string calldata _name,
    //    string calldata _symbol,
    //    uint8 _decimals
    //)
    async withdrawTransitToken(signature: string, transactionHash: string, amount: string, token: string, tokeName: string, tokenSymbol: string, tokenDecimals: number): Promise<any> {
        return new Promise((resolve, reject) => {
            let masterContract = new this.web3Service.web3.eth.Contract(this.bscTransitAbi, environment.bsc.bridgeAddress);

            let stringAmount = "0x" + new BigNumber(amount).toString(16);
            let stringTokenDecimals = "0x" + new BigNumber(tokenDecimals).toString(16);

            return masterContract.methods.withdrawTransitToken(signature, transactionHash, stringAmount, token, tokeName, tokenSymbol, stringTokenDecimals)
                .send({ from: this.account })
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
                });
        }) as Promise<any>;
    }


    withdrawFromBSCClick(paybackEvent: PaybackEventDTO) {
        this.waiting = true;
        this.withdrawFromBSC(paybackEvent.signature, paybackEvent.transactionHash, paybackEvent.amount, paybackEvent.token)
            .then((response: any) => {
                console.info('receipt');
                console.info(response);

                this.waiting = false;
                if (response) {
                    this.showSuccessModal("Confirmed transaction");
                    paybackEvent.isWithdraw = true;
                }
                //if (error) {
                //    console.error(error);
                //}
            }).catch((response: any) => {
                console.info('catch');
                console.info(response);
                this.waiting = false;
            }).finally(() => {
                console.info('finally');
                this.waiting = false;
            });
    }

    async withdrawFromBSC(signature: string, transactionHash: string, amount: string, token: string): Promise<any> {
        return new Promise((resolve, reject) => {
            let masterContract = new this.web3Service.web3.eth.Contract(this.ethTransitAbi, environment.eth.bridgeAddress);

            let stringAmount = "0x" + new BigNumber(amount).toString(16);

            //withdrawFromBSC(bytes calldata _signature, bytes32 _paybackId, address _token, uint _amount)
            return masterContract.methods.withdrawFromBSC(signature, transactionHash, token, stringAmount)
                .send({ from: this.account })
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
                });
        }) as Promise<any>;
    }

    async GetPairFor(bscToken: string): Promise<any> {
        return new Promise((resolve, reject) => {
            let contract = new this.web3Service.web3.eth.Contract(this.bscTransitAbi, environment.bsc.bridgeAddress);
            contract.methods.pairFor(bscToken).call({}, (error, resp) => {
                resolve(resp);
            });
        }) as Promise<any>;
    }

    public refreshData: boolean = false;
    async refreshDB() {
        this.refreshData = true;
        await this.getPaybackEvents();
        await this.getTransitEvent();
        this.refreshData = false;
    }

    //TODO:dublicated in header move to base class
    selectETHChainClick(event): void {
        if (this.isETHChain) {
            return;
        }
        if (this.account) {
            this.showInfoModal("Change network to Ethereum Mainnet in your wallet");
        }
        else {
            this.userSessionProvider.setETHNetwork();
            location.reload();
        }
    }

    //TODO:dublicated in header move to base class
    async selectBSCChainClick(): Promise<boolean> {
        if (this.isBNBChain) {
            return;
        }
        console.log('selectBSCChain');
        const nodes = ["https://bsc-dataseed.binance.org", "https://bsc-dataseed1.defibit.io", "https://bsc-dataseed1.ninicoin.io"];

        const provider = window.ethereum
        //If exist metamask and connected account
        //TODO: get account from web3
        if (provider && this.userSessionProvider.username) {
            const chainId = 56
            try {
                // @ts-ignore
                await provider.request({
                    method: 'wallet_addEthereumChain',
                    params: [
                        {
                            chainId: `0x${chainId.toString(16)}`,
                            chainName: 'Binance Smart Chain Mainnet',
                            nativeCurrency: {
                                name: 'BNB',
                                symbol: 'bnb',
                                decimals: 18,
                            },
                            rpcUrls: nodes,
                            blockExplorerUrls: ['https://bscscan.com/'],
                        },
                    ],
                })
                return true
            } catch (error) {
                console.error(error)
                return false
            }
        }

        else {
            this.userSessionProvider.setBSCNetwork();
            location.reload();
            console.error("Can't setup the BSC network on metamask because window.ethereum is undefined")
            return false
        }
    }

}