import { Component, OnInit, OnDestroy, ViewChild } from "@angular/core";
import { slideFromBottom } from "shared/animation";
import { ComponentBase } from "shared/component-base";
import { EventBus } from "shared/event-bus";
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from "@angular/common/http";
import BigNumber from "bignumber.js";
import { Observable } from "rxjs";
import { environment } from "../../environments/environment";

@Component({
    templateUrl: "idopage.component.html",
    animations: [slideFromBottom()]
})

export class IDOComponent extends ComponentBase implements OnInit, OnDestroy {

    constructor(private http: HttpClient,
        private route: ActivatedRoute,
        private eventBus: EventBus) {
        super();
        this.now = Math.floor(Date.now() / 1000);

        this.updateTimeTimerId = setInterval(() => {
            this.now = Math.floor(Date.now() / 1000);

            var diffStart = 0
            if (this.isUpcoming)
                var diffStart = this.startTimestamp - this.now;
            else if (this.isStarted)
                var diffStart = this.finishTimestamp - this.now;
            if (diffStart > 0) {
                this.timerViewDays = Math.floor(diffStart / (3600 * 24));
                this.timerViewHours = Math.floor(diffStart % (3600 * 24) / 3600);
                this.timerViewMin = Math.floor(diffStart % 3600 / 60);
                this.timerViewSec = Math.floor(diffStart % 60);
            }
            else {
                this.timerViewDays = 0;
                this.timerViewHours = 0;
                this.timerViewMin = 0;
                this.timerViewSec = 0;
            }
        }, 1000);
    }

    idoAddress: string;
    rewardTokenAddress: string;
    rewardDecimal: number;
    rewardSymbol: string;
    totalSupply: number;

    ownerAddress: string;
    account: string;

    tokenDebt: number = 0;

    releasableAmount: number = 0;
    vestedAmount: number = 0;
    vestedReleasedAmount: number = 0;

    totalInvestedETH: number = 0;
    myClaimedTokensAmount: number = 0;
    totalStakeETH: number;
    totalBuyToken: number;

    ethBalance: number = 0;
    tokenPrice: number;
    rewardToken: string;

    startTimestamp: number;
    finishTimestamp: number;
    startClaimTimestamp: number;
    minEthPayment: number;
    maxEthPayment: number;
    userMaxEthPayment: number;
    fullDisBalance: number = 0;
    maxDistributedTokenAmount: number;
    tokensForDistribution: number;
    distributedTokens: number;
    buyAmountETH: number = 0;
    buyAmountDIS: number = 0;


    public vestingPercent: number;
    public vestingStart: number;
    public vestingInterval: number;
    public vestingDuration: number;


    public newVestingPercent: number;
    public newVestingStart: number;
    public newVestingInterval: number;
    public newVestingDuration: number;


    updateTimeTimerId;
    updateTimerId;
    updateTimerIdContract;
    waitingTimerId: any[] = [null, null, null, null, null, null];

    public showCountdownTimer: boolean = true;
    public fillPercent: number = 20;
    public fillAmount: number = 10000;
    public isWeb3Disabled: boolean = false;

    public saving: boolean = false;
    public isLoaded: boolean = false;
    //public withdrawPoolState: PoolState;
    public enable: any;

    now: number;

    timerViewDays: number;
    timerViewHours: number;
    timerViewMin: number;
    timerViewSec: number;

    hasWhitelisting: boolean = false;
    enableTierSystem: boolean = false;
    isWhitelisted: boolean = false;

    vipTier: TierSystemDTO;
    holdersTier: TierSystemDTO;
    publicTier: TierSystemDTO;

    public tokensDebt: any = new Array();


    addressesForAddWhiteList: string;

    public imagePath = "/assets/images/nologo.svg";

    public get allowClaim(): boolean {
        if (!this.startClaimTimestamp || this.startClaimTimestamp == 0)
            return false;
        return this.now > this.startClaimTimestamp;
    }

    public get isUpcoming(): boolean {
        return this.now < this.startTimestamp;
    }

    public get isStarted(): boolean {
        return this.now > this.startTimestamp && this.now < this.finishTimestamp;
    }

    public get isFinished(): boolean {
        return this.now > this.finishTimestamp;
    }

    public get allowPay(): boolean {
        if (!this.startTimestamp)
            return false;
        if (!this.finishTimestamp)
            return false;

        return this.now > this.startTimestamp && this.now < this.finishTimestamp;
    }

    public get getDistributedPercent(): number {
        if (this.maxDistributedTokenAmount && this.tokensForDistribution)
            return new BigNumber(this.tokensForDistribution).div(this.maxDistributedTokenAmount).multipliedBy(100).toNumber();
        return 0;
    }


    async ngOnInit() {
        this.eventBus.loginEvent.subscribe(result => {
            console.log('loginEvent subscription:' + result);
            this.eventLogin(result);
        });

        this.eventBus.logoutEvent.subscribe(result => {
            console.log('logoutEvent subscription:' + result);
            this.eventLogout();
        });

        this.route
            .queryParams
            .subscribe(params => {
                this.idoAddress = params['pool'];
            });

        await this.web3Service.initWeb3();

        if (this.web3Service.web3) {
            this.updateContractData();

            this.updateContractInterval();
            this.updateTimerIdContract = setInterval(() => {
                this.updateContractInterval();
            }, this.expectedBlockTime);
        }
    }

    async ngOnDestroy() {
        if (this.updateTimerId) {
            clearInterval(this.updateTimerId);
        }
        if (this.updateTimerIdContract) {
            clearInterval(this.updateTimerIdContract);
        }
        if (this.updateTimeTimerId) {
            clearInterval(this.updateTimeTimerId);
        }
    }

    async eventLogin(username: string) {
        console.log('eventLogin');
        console.log(username);
        this.account = username;

        //TODO:HACK call early than updateContractData
        this.rewardTokenAddress = await this.getRewardToken();
        this.rewardDecimal = parseInt(await this.web3Service.GetDecimals(this.rewardTokenAddress));

        this.updateUserData();

        this.updateTimerId = setInterval(() => {
            this.updateUserData();
        }, this.expectedBlockTime);

        this.getTokensDebts(username);
    }

    eventLogout(): void {
        console.log('signOut')
        this.account = "";

        this.tokenDebt = 0;
        this.totalInvestedETH = 0;
        this.ethBalance = 0;
        this.totalStakeETH = null;
        this.totalBuyToken = null;
        this.myClaimedTokensAmount = null;
        this.tokensDebt = new Array();
        //clearInterval(this.timerId);

        if (this.updateTimerId) {
            clearInterval(this.updateTimerId);
        }
    }

    calculateDis(): void {
        if (this.buyAmountETH) {
            this.buyAmountDIS = parseFloat(new BigNumber(this.buyAmountETH).dividedBy(this.tokenPrice).toFixed(2, 1));
        }
        else {
            this.buyAmountDIS = 0;
        }
    }

    calculateETH(): void {
        if (this.buyAmountDIS) {
            this.buyAmountETH = parseFloat(new BigNumber(this.buyAmountDIS).multipliedBy(this.tokenPrice).toFixed(8, 1));
        }
        else {
            this.buyAmountETH = 0;
        }
    }


    async updateContractData() {
        this.rewardTokenAddress = await this.getRewardToken();
        this.rewardDecimal = parseInt(await this.web3Service.GetDecimals(this.rewardTokenAddress));

        this.getAllowedPools()
            .subscribe(result => {
                console.log(result);
                if (result && result.poolTokenImages) {
                    let poolImage = result.poolTokenImages.filter(p => p.address.toLowerCase() == this.rewardTokenAddress.toLowerCase());
                    if (poolImage.length > 0)
                        this.imagePath = poolImage[0].image_url;
                }
            });

        this.web3Service.GetContractSymbol(this.rewardTokenAddress).then((resp) => {
            this.rewardSymbol = resp;
        });

        this.getTokensForDistribution().then((value) => {
            this.tokensForDistribution = this.toNumberFromWei(value, this.rewardDecimal);
        });

        this.getMaxDistributedTokenAmount().then((value) => {
            this.maxDistributedTokenAmount = this.toNumberFromWei(value, this.rewardDecimal);
        });

        this.getStartTimestamp().then((value) => {
            this.startTimestamp = parseInt(value);
        });

        this.getFinishTimestamp().then((value) => {
            this.finishTimestamp = parseInt(value);
        });

        this.getStartClaimTimestamp().then((value) => {
            this.startClaimTimestamp = parseInt(value);
        });

        this.getMinEthPayment().then((value) => {
            this.minEthPayment = this.toNumberFromWei(value, 18);
        });

        this.enableTierSystem = Boolean(await this.web3Service.IsEnableTierSystem(this.idoAddress));
        if (this.enableTierSystem) {
            this.web3Service.vipTier(this.idoMasterAddress).then((resp) => {
                this.vipTier = new TierSystemDTO(this.toNumberFromWei(resp.disAmount, this.disDecimals), parseInt(resp.percent));
            });
            this.web3Service.holdersTier(this.idoMasterAddress).then((resp) => {
                this.holdersTier = new TierSystemDTO(this.toNumberFromWei(resp.disAmount, this.disDecimals), parseInt(resp.percent));
            });
            this.web3Service.publicTier(this.idoMasterAddress).then((resp) => {
                this.publicTier = new TierSystemDTO(this.toNumberFromWei(resp.disAmount, this.disDecimals), parseInt(resp.percent));
            });
        }

        this.getMaxEthPayment().then((value) => {
            this.maxEthPayment = this.toNumberFromWei(value, 18);
            this.userMaxEthPayment = this.toNumberFromWei(value, 18);
            if (this.account && this.enableTierSystem) {
                this.web3Service.getMasterMaxEthPayment(this.account, value, this.idoMasterAddress).then((masterValue) => {
                    console.log('getMasterMaxEthPayment TierSystem');
                    //TODO: not working
                    console.log(masterValue);
                    this.userMaxEthPayment = this.toNumberFromWei(masterValue, 18);
                });
            }
        });

        this.getTokenPrice().then((value) => {
            this.tokenPrice = this.toNumberFromWei(value, 18);
        });

        this.web3Service.GetTotalSupply(this.rewardTokenAddress).then((resp) => {
            this.totalSupply = this.toNumberFromWei(resp, this.rewardDecimal);
        });

        this.web3Service.HasWhitelisting(this.idoAddress).then((resp) => {
            this.hasWhitelisting = Boolean(resp);
        });


        this.getVestingPercent().then((resp) => {
            this.vestingPercent = parseInt(resp);
        });

        this.getVestingStart().then((resp) => {
            this.vestingStart = parseInt(resp);
        });

        this.getVestingInterval().then((resp) => {
            this.vestingInterval = parseInt(resp);
        });

        this.getVestingDuration().then((resp) => {
            this.vestingDuration = parseInt(resp);
        });





        if (this.account) {
            this.web3Service.getOwner(this.idoAddress).then((resp) => {
                this.ownerAddress = resp;
            });
            this.web3Service.IsWhitelisted(this.idoAddress, this.account).then((resp) => {
                this.isWhitelisted = Boolean(resp);
            });
            this.web3Service.getFullDisBalance(this.account, this.idoMasterAddress).then((masterValue) => {
                this.fullDisBalance = this.toNumberFromWei(masterValue, 18);
            });
        }
    }

    async updateContractInterval() {
        if (this.rewardDecimal)
            this.getTokensForDistribution().then((value) => {
                this.tokensForDistribution = this.toNumberFromWei(value, this.rewardDecimal);
            });
    }

    toNumberFromWeiReward(input: string) {
        return this.toNumberFromWei(input, this.rewardDecimal);
    }

    async updateUserData() {
        console.log('updateUserData');
        this.web3Service.getEthBalance(this.account).then((value) => {
            this.ethBalance = this.toNumberFromWeiFixed(value, 18);
        });
        this.getUserInfo(this.account).then((userInfo) => {
            console.log(userInfo);
            console.log('userInfo');
            this.tokenDebt = this.toNumberFromWei(userInfo.debt, this.rewardDecimal);
            this.totalInvestedETH = this.toNumberFromWei(userInfo.totalInvestedETH, 18);
            this.myClaimedTokensAmount = this.toNumberFromWei((new BigNumber(userInfo.total)).minus(userInfo.debt).toString(), this.rewardDecimal);
        });


        this.getReleasableAmount(this.account).then((resp) => {
            this.releasableAmount = this.toNumberFromWei(resp, this.rewardDecimal);
        });

        this.getVesting(this.account).then((resp) => {
            this.vestedAmount = this.toNumberFromWei(resp[0], this.rewardDecimal);
            this.vestedReleasedAmount = this.toNumberFromWei(resp[1], this.rewardDecimal);
        });
        //this.getTokenDebt(this.account).then((balance) => {
        //    this.tokenDebt = this.toNumberFromWei(balance, this.rewardDecimal);
        //});
        //this.getPayedAmount(this.account).then((balance) => {
        //    this.myClaimedTokensAmount = this.toNumberFromWei(balance, this.rewardDecimal);
        //});
    }

    async payClick(): Promise<void> {
        var index = 0;
        this.waitingTimerId[index] = 1;
        let contract = new this.web3Service.web3.eth.Contract(this.idoPoolAbi, this.idoAddress);
        let wei = (new BigNumber(this.buyAmountETH)).multipliedBy(1e18).toNumber();
        //TODO: let that = this;
        let that = this;
        contract.methods.pay().send({ value: wei, from: this.account })
            .on('transactionHash', function (hash) {
                console.info('transactionHash');
                console.info(hash);
                that.buyAmountETH = 0;
                that.buyAmountDIS = 0;
                that.showTransactionSumbited(hash);
            })
            .on('receipt', function (receipt) {
                console.info('receipt');
                console.info(receipt);
                that.waitingTimerId[index] = null;
                //that.translate.get('Confirmed transaction')
                //    .subscribe((langResp: string) => {
                //        that.showSuccessModal(langResp);
                //    });
                that.showSuccessModal('Confirmed transaction');
                that.updateUserData();
                that.getTokensDebts(that.account);
            })
            //.on('confirmation', function (confirmationNumber, receipt) {
            //    console.info('confirmation');
            //    console.info(confirmationNumber);
            //    console.info(receipt);
            //})
            .on('error', function (error, receipt) {
                console.error(receipt);
                console.error(error);
                that.waitingTimerId[index] = null;
            });

        //this.pay(this.buyAmountETH).then((resp) => {
        //    console.log(`then pay ${resp}`);
        //    if (resp) {
        //        this.waitingTimerId[index] = setInterval(() => {
        //            this.CheckTx(resp, this.waitingTimerId, index);
        //        }, this.fastRefreshTime);
        //        this.buyAmountETH = 0;
        //        this.buyAmountDIS = 0;
        //        this.showTransactionSumbited(resp);
        //    }
        //    else {
        //        this.waitingTimerId[index] = null;
        //    }
        //})
    }

    async claimClick(): Promise<void> {
        var index = 1;
        this.waitingTimerId[index] = 1;
        let contract = new this.web3Service.web3.eth.Contract(this.idoPoolAbi, this.idoAddress);
        //TODO: let that = this;
        let that = this;
        contract.methods.claim().send({ from: this.account })
            .on('transactionHash', function (hash) {
                console.info('transactionHash');
                console.info(hash);
                that.showTransactionSumbited(hash);
            })
            .on('receipt', function (receipt) {
                console.info('receipt');
                console.info(receipt);
                that.waitingTimerId[index] = null;
                //that.translate.get('Confirmed transaction')
                //    .subscribe((langResp: string) => {
                //        that.showSuccessModal(langResp);
                //    });
                that.showSuccessModal('Confirmed transaction');
                that.updateUserData();
            })
            //.on('confirmation', function (confirmationNumber, receipt) {
            //    console.info('confirmation');
            //    console.info(confirmationNumber);
            //    console.info(receipt);
            //})
            .on('error', function (error, receipt) {
                console.error(receipt);
                console.error(error);
                that.waitingTimerId[index] = null;
            });

        //var index = 1;
        //this.waitingTimerId[index] = 1;
        //this.claim().then((resp) => {
        //    console.log(`then pay ${resp}`);
        //    if (resp) {
        //        this.waitingTimerId[index] = setInterval(() => {
        //            this.CheckTx(resp, this.waitingTimerId, index);
        //        }, this.fastRefreshTime);

        //        this.showTransactionSumbited(resp);
        //    }
        //    else {
        //        this.waitingTimerId[index] = null;
        //    }
        //})
    }


    async claimVesingClick(): Promise<void> {
        var index = 1;
        this.waitingTimerId[index] = 1;
        let contract = new this.web3Service.web3.eth.Contract(this.idoPoolAbi, this.idoAddress);
        //TODO: let that = this;
        let that = this;
        contract.methods.release(this.account).send({ from: this.account })
            .on('transactionHash', function (hash) {
                console.info('transactionHash');
                console.info(hash);
                that.showTransactionSumbited(hash);
            })
            .on('receipt', function (receipt) {
                console.info('receipt');
                console.info(receipt);
                that.waitingTimerId[index] = null;
                that.showSuccessModal('Confirmed transaction');
                that.updateUserData();
            })
            .on('error', function (error, receipt) {
                console.error(receipt);
                console.error(error);
                that.waitingTimerId[index] = null;
            });
    }

    //CheckTx(tx: string, timers: NodeJS.Timeout[], index: number): void {
    //    console.log("CheckTx: ", tx)
    //    this.GetTransactionReceipt(this.web3, tx).then((resp) => {
    //        console.log("Got the transaction receipt: ", resp);
    //        if (resp) {
    //            if (timers[index]) {
    //                console.log("clearInterval");
    //                console.log(timers[index]);
    //                clearInterval(timers[index]);
    //                timers[index] = null;
    //            }
    //            this.translate.get('Confirmed transaction')
    //                .subscribe((langResp: string) => {
    //                    this.showSuccessModal(langResp);
    //                });

    //            this.updateUserData();
    //        }
    //    });
    //}

    //async pay(ethAmount: number): Promise<any> {
    //    return new Promise((resolve, reject) => {
    //        let wei = (new BigNumber(ethAmount)).multipliedBy(1e18).toNumber();
    //        console.log(wei);
    //        let contract = new this.web3.eth.Contract(this.idoPoolAbi, this.idoAddress);

    //        contract.methods.pay().call({ value: wei }, (error, resp) => {
    //            console.log(resp);
    //            resolve(resp);
    //        });
    //    }) as Promise<any>;
    //}

    //async claim(): Promise<any> {
    //    return new Promise((resolve, reject) => {
    //        let contract = new this.web3.eth.Contract(this.idoPoolAbi, this.idoAddress);
    //        contract.methods.claim((error, resp) => {
    //            console.log(resp);
    //            resolve(resp);
    //        });
    //    }) as Promise<any>;
    //}

    async getTokensDebts(holder: string) {

        var web3ForEvents = this.web3Service.getWeb3ForEvents;
        let contract = new web3ForEvents.eth.Contract(this.idoPoolAbi, this.idoAddress);
        contract.getPastEvents("TokensDebt", { fromBlock: this.stakeStartBlock, toBlock: 'latest' }).then((resp) => {
            console.log('TokensDebt');
            console.log(resp);
            this.tokensDebt = new Array();
            for (let i = 0; i < resp.length; i++) {
                let event: any = resp[i];
                this.tokensDebt.push(event);
                this.web3Service.web3.eth.getBlock(event.blockNumber, false).then((block) => {
                    event.timestamp = block.timestamp;
                });
            }
        });
    }

    async getUserInfo(customerAddress): Promise<any> {
        return new Promise((resolve, reject) => {
            let contract = new this.web3Service.web3.eth.Contract(this.idoPoolAbi, this.idoAddress);
            contract.methods.userInfo(customerAddress).call({}, (error, balance) => {
                resolve(balance);
            });
        }) as Promise<any>;
    }

    async getRewardToken(): Promise<any> {
        return new Promise((resolve, reject) => {
            let contract = new this.web3Service.web3.eth.Contract(this.idoPoolAbi, this.idoAddress);
            contract.methods.rewardToken().call({}, (error, balance) => {
                resolve(balance);
            });
        }) as Promise<any>;
    }

    async getTokensForDistribution(): Promise<any> {
        return new Promise((resolve, reject) => {
            let contract = new this.web3Service.web3.eth.Contract(this.idoPoolAbi, this.idoAddress);
            contract.methods.tokensForDistribution().call({}, (error, balance) => {
                resolve(balance);
            });
        }) as Promise<any>;
    }

    async getMaxDistributedTokenAmount(): Promise<any> {
        return new Promise((resolve, reject) => {
            let contract = new this.web3Service.web3.eth.Contract(this.idoPoolAbi, this.idoAddress);
            contract.methods.maxDistributedTokenAmount().call({}, (error, balance) => {
                resolve(balance);
            });
        }) as Promise<any>;
    }

    async getStartTimestamp(): Promise<any> {
        return new Promise((resolve, reject) => {
            let contract = new this.web3Service.web3.eth.Contract(this.idoPoolAbi, this.idoAddress);
            contract.methods.startTimestamp().call({}, (error, balance) => {
                resolve(balance);
            });
        }) as Promise<any>;
    }

    async getFinishTimestamp(): Promise<any> {
        return new Promise((resolve, reject) => {
            let contract = new this.web3Service.web3.eth.Contract(this.idoPoolAbi, this.idoAddress);
            contract.methods.finishTimestamp().call({}, (error, balance) => {
                resolve(balance);
            });
        }) as Promise<any>;
    }

    async getStartClaimTimestamp(): Promise<any> {
        return new Promise((resolve, reject) => {
            let contract = new this.web3Service.web3.eth.Contract(this.idoPoolAbi, this.idoAddress);
            contract.methods.startClaimTimestamp().call({}, (error, balance) => {
                resolve(balance);
            });
        }) as Promise<any>;
    }

    async getMinEthPayment(): Promise<any> {
        return new Promise((resolve, reject) => {
            let contract = new this.web3Service.web3.eth.Contract(this.idoPoolAbi, this.idoAddress);
            contract.methods.minEthPayment().call({}, (error, balance) => {
                resolve(balance);
            });
        }) as Promise<any>;
    }

    async getMaxEthPayment(): Promise<any> {
        return new Promise((resolve, reject) => {
            let contract = new this.web3Service.web3.eth.Contract(this.idoPoolAbi, this.idoAddress);
            contract.methods.maxEthPayment().call({}, (error, balance) => {
                resolve(balance);
            });
        }) as Promise<any>;
    }

    async getTokenPrice(): Promise<any> {
        return new Promise((resolve, reject) => {
            let contract = new this.web3Service.web3.eth.Contract(this.idoPoolAbi, this.idoAddress);
            contract.methods.tokenPrice().call({}, (error, balance) => {
                resolve(balance);
            });
        }) as Promise<any>;
    }




    async getVestingPercent(): Promise<any> {
        return new Promise((resolve, reject) => {
            let contract = new this.web3Service.web3.eth.Contract(this.idoPoolAbi, this.idoAddress);
            contract.methods.vestingPercent().call({}, (error, value) => {
                resolve(value);
            });
        }) as Promise<any>;
    }

    async getVestingStart(): Promise<any> {
        return new Promise((resolve, reject) => {
            let contract = new this.web3Service.web3.eth.Contract(this.idoPoolAbi, this.idoAddress);
            contract.methods.vestingStart().call({}, (error, value) => {
                resolve(value);
            });
        }) as Promise<any>;
    }

    async getVestingInterval(): Promise<any> {
        return new Promise((resolve, reject) => {
            let contract = new this.web3Service.web3.eth.Contract(this.idoPoolAbi, this.idoAddress);
            contract.methods.vestingInterval().call({}, (error, value) => {
                resolve(value);
            });
        }) as Promise<any>;
    }

    async getVestingDuration(): Promise<any> {
        return new Promise((resolve, reject) => {
            let contract = new this.web3Service.web3.eth.Contract(this.idoPoolAbi, this.idoAddress);
            contract.methods.vestingDuration().call({}, (error, value) => {
                resolve(value);
            });
        }) as Promise<any>;
    }

    async getReleasableAmount(userAddress: string): Promise<any> {
        return new Promise((resolve, reject) => {
            let contract = new this.web3Service.web3.eth.Contract(this.idoPoolAbi, this.idoAddress);
            contract.methods.releasableAmount(userAddress).call({}, (error, value) => {
                resolve(value);
            });
        }) as Promise<any>;
    }

    async getVesting(userAddress: string): Promise<any> {
        return new Promise((resolve, reject) => {
            let contract = new this.web3Service.web3.eth.Contract(this.idoPoolAbi, this.idoAddress);
            contract.methods.getVesting(userAddress).call({}, (error, value) => {
                resolve(value);
            });
        }) as Promise<any>;
    }


    getAllowedPools(): Observable<any> {
        return this.http.get(environment.poolsAddressesURL + `?v=${Date.now()}`);
    }


    //#region settings
    waiting: boolean = false;

    updateWhiteListClick(): void {
        this.waiting = true;
        this.addToWhiteList(this.account, this.idoAddress, this.addressesForAddWhiteList.split(' '))
            .then((response: any) => {
                console.info('receipt');
                console.info(response);

                this.waiting = false;
                if (response) {
                    this.showSuccessModal('Success');
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


    async addToWhiteList(currentAccount: string, contractAddress: string, addresses: string[]): Promise<any> {
        return new Promise((resolve, reject) => {
            let contract = new this.web3Service.web3.eth.Contract(this.idoPoolAbi, contractAddress);

            return contract.methods.add(addresses)
                .send({ from: currentAccount })
                .on('transactionHash', function (hash) {
                    console.info('transactionHash');
                    console.info(hash);
                })
                //TODO: don't work receipt
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


    updateVestingClick(): void {
        this.waiting = true;

        this.setVesting(this.account, this.idoAddress, this.newVestingPercent, this.newVestingStart, this.newVestingInterval, this.newVestingDuration)
            .then((response: any) => {
                console.info('receipt');
                console.info(response);

                this.waiting = false;
                if (response) {
                    this.showSuccessModal('Success');
                    this.updateContractData();
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


    async setVesting(currentAccount: string, contractAddress: string, _vestingPercent: number, _vestingStart: number, _vestingInterval: number, _vestingDuration: number): Promise<any> {
        //setVesting(uint256 _vestingPercent,
        //    uint256 _vestingStart,
        //    uint256 _vestingInterval,
        //    uint256 _vestingDuration) 
        return new Promise((resolve, reject) => {
            let contract = new this.web3Service.web3.eth.Contract(this.idoPoolAbi, contractAddress);
            return contract.methods.setVesting(_vestingPercent, _vestingStart, _vestingInterval, _vestingDuration)
                .send({ from: currentAccount })
                .on('transactionHash', function (hash) {
                    console.info('transactionHash');
                    console.info(hash);
                })
                //TODO: don't work receipt
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



    withdrawFundsClick(): void {
        this.waiting = true;
        this.withdrawFunds(this.account, this.idoAddress)
            .then((response: any) => {
                console.info('receipt');
                console.info(response);

                this.waiting = false;
                if (response) {
                    this.showSuccessModal('Success');
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

    async withdrawFunds(currentAccount: string, idoAddress: string): Promise<any> {
        return new Promise((resolve, reject) => {
            let masterContract = new this.web3Service.web3.eth.Contract(this.idoPoolAbi, idoAddress);

            return masterContract.methods.withdrawFunds()
                .send({ from: currentAccount })
                .on('transactionHash', function (hash) {
                    console.info('transactionHash');
                    console.info(hash);
                })
                //TODO: don't work receipt
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



    withdrawNotSoldTokensClick(): void {
        this.waiting = true;
        this.withdrawNotSoldTokens(this.account, this.idoAddress)
            .then((response: any) => {
                console.info('receipt');
                console.info(response);

                this.waiting = false;
                if (response) {
                    this.showSuccessModal('Success');
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


    async withdrawNotSoldTokens(currentAccount: string, idoAddress: string): Promise<any> {
        return new Promise((resolve, reject) => {
            let masterContract = new this.web3Service.web3.eth.Contract(this.idoPoolAbi, idoAddress);

            return masterContract.methods.withdrawNotSoldTokens()
                .send({ from: currentAccount })
                .on('transactionHash', function (hash) {
                    console.info('transactionHash');
                    console.info(hash);
                })
                //TODO: don't work receipt
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
    //#endregion settings
}

class TierSystemDTO {
    public constructor(amount: number, percent: number) {
        this.disAmount = amount;
        this.percent = percent;
    }

    disAmount: number;
    percent: number;
}