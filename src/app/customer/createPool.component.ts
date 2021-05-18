import { Component, OnInit, OnDestroy } from "@angular/core";
import { slideFromBottom } from "shared/animation";
import { ComponentBase } from "shared/component-base";
import { EventBus } from "shared/event-bus";
import { Router } from '@angular/router';
import { TranslateService } from "@ngx-translate/core";
import Web3 from "web3";
import { BigNumber } from "bignumber.js";

@Component({
    templateUrl: "createPool.component.html",
    animations: [slideFromBottom()]
})

export class CreatePoolComponent extends ComponentBase implements OnInit, OnDestroy {
    constructor(private _router: Router,
        private translate: TranslateService,
        private eventBus: EventBus) {
        super();
    }

    waiting: boolean = false;

    step: number = 1;
    createPoolTimerId;
    creatingPoolProcess: boolean = false;
    creatingPoolTx: string;
    //poolCreated: boolean= false;

    feeTokenAddress: string;
    feeSymbol: string;

    stakeAddress: string;
    poolAddress: string;

    stakeSymbol: string;
    poolSymbol: string;

    poolDecimal: number;

    startBlock: number;
    finishBlock: number;
    poolTokenSupply: number;

    masterFeeAmount: number;

    account: string;
    balance: number = 0;

    timerId;

    public allowanceBCS: number;
    public isApprovedStakingToken: boolean = false;

    public get isApprovedBSC(): boolean {
        if (this.allowanceBCS == null)
            return false;;
        return this.allowanceBCS >= this.masterFeeAmount;
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

        await this.web3Service.initWeb3();
        //await this.initWeb3();

        await this.updateContractInfo();
    }

    async ngOnDestroy() {
        if (this.timerId) {
            clearInterval(this.timerId);
        }

        if (this.createPoolTimerId) {
            clearInterval(this.createPoolTimerId);
        }
    }

    eventLogin(username: string): void {
        console.log('eventLogin');
        console.log(username);
        this.account = username;
        this.updateBalanceData();

        this.timerId = setInterval(() => {
            this.updateBalanceData()
        }, this.longTimeUpdate);
    }

    eventLogout(): void {
        this.account = "";
        this.balance = 0;
        this.allowanceBCS = null;
        this.masterFeeAmount = null;
        console.log('eventLogout')
        if (this.timerId) {
            console.log('clearInterval');
            clearInterval(this.timerId);
        }
    }

    async updateContractInfo() {
        console.log('updateContractInfo');
        this.masterFeeAmount = this.toNumberFromWei(await this.getFeeAmount(), 18);
        this.feeTokenAddress = await this.getFeeToken();
        this.feeSymbol = await this.web3Service.GetContractSymbol(this.feeTokenAddress);
    }

    async updateBalanceData() {
        console.log('updateBalanceData');
        console.log(this.stakeMasterAddress);

        if (!this.feeTokenAddress) {
            this.feeTokenAddress = await this.getFeeToken();
        }

        this.web3Service.GetTokenBalance(this.account, this.feeTokenAddress).then((balance) => {
            this.balance = this.toNumberFromWei(balance, 18);
        });
        this.web3Service.GetAllowance(this.account, this.feeTokenAddress, this.stakeMasterAddress).then((resp) => {
            this.allowanceBCS = this.toNumberFromWei(resp, 18);
        });
        //this.GetContractSymbol(this.feeTokenAddress).then((resp) => {
        //    this.feeSymbol = resp;
        //});
        //});
    }

    approveFeeClick(): void {
        this.waiting = true;
        this.web3Service.ApproveOn(this.account, this.feeTokenAddress, this.stakeMasterAddress)
            .then((response: any) => {
                this.translate.get('Confirmed transaction')
                    .subscribe((langResp: string) => {
                        this.showSuccessModal(langResp);
                    });
                this.updateBalanceData();
            }).catch((response: any) => {
                console.info('catch');
                console.info(response);
            }).finally(() => {
                console.info('finally');
                this.waiting = false;
            });
        //.on('transactionHash', function (hash) {
        //    console.info('transactionHash');
        //    console.info(hash);
        //    that.showTransactionSumbited(hash);
        //})
        //.on('receipt', function (receipt) {
        //    console.info('receipt');
        //    console.info(receipt);
        //    that.waiting = false;
        //    that.translate.get('Confirmed transaction')
        //        .subscribe((langResp: string) => {
        //            that.showSuccessModal(langResp);
        //        });
        //    that.updateBalanceData();
        //})
        //.on('error', function (error, receipt) {
        //    console.error(receipt);
        //    console.error(error);
        //    that.waiting = false;
        //});
    }


    approvePoolTokenClick(): void {
        this.waiting = true;
        this.web3Service.ApproveOn(this.account, this.poolAddress, this.stakeMasterAddress)
            .then((response: any) => {
                this.translate.get('Confirmed transaction')
                    .subscribe((langResp: string) => {
                        this.showSuccessModal(langResp);
                    });
                this.updateAllowancePoolToken();
            }).catch((response: any) => {
                console.info('catch');
                console.info(response);
            }).finally(() => {
                console.info('finally');
                this.waiting = false;
            });

        //.on('transactionHash', function (hash) {
        //    console.info('transactionHash');
        //    console.info(hash);
        //    that.showTransactionSumbited(hash);
        //})
        //.on('receipt', function (receipt) {
        //    console.info('receipt');
        //    console.info(receipt);
        //    that.waiting = false;
        //    that.translate.get('Confirmed transaction')
        //        .subscribe((langResp: string) => {
        //            that.showSuccessModal(langResp);
        //        });
        //    that.updateAllowancePoolToken();
        //})
        //.on('error', function (error, receipt) {
        //    console.error(receipt);
        //    console.error(error);
        //    that.waiting = false;
        //});
    }

    toStep1(): void {
        this.step = 1;
        this.isApprovedStakingToken = false;
        this.stakeSymbol = "";
        this.poolSymbol = "";
        this.poolDecimal = null;
    }

    async toStep2() {
        if (!Web3.utils.isAddress(this.stakeAddress)) {
            this.showError("Incorrect stake address");
            return;
        }
        if (!Web3.utils.isAddress(this.poolAddress)) {
            this.showError("Incorrect pool address");
            return;
        }

        if (this.balance < this.masterFeeAmount) {
            this.showErrorModal("Insufficient funds of " + this.feeSymbol);
            return;
        }
        this.step = 2;
        this.poolDecimal = parseInt(await this.web3Service.GetDecimals(this.poolAddress));

        this.updateAllowancePoolToken();

        this.web3Service.GetContractSymbol(this.stakeAddress).then((resp) => {
            this.stakeSymbol = resp;
        });

        this.web3Service.GetContractSymbol(this.poolAddress).then((resp) => {
            this.poolSymbol = resp;
        });
    }

    updateAllowancePoolToken(): void {
        //Проверяем разрешение тратить pool token в размере tokenSupply
        this.web3Service.GetAllowance(this.account, this.poolAddress, this.stakeMasterAddress).then((resp) => {
            console.log(`GetAllowance PoolAddress ${resp}`);
            if (this.poolTokenSupply <= this.toNumberFromWei(resp, this.poolDecimal)) {
                this.isApprovedStakingToken = true;
            }
            else {
                this.isApprovedStakingToken = false;
            }
        });
    }


    createPoolClick(): void {
        if (this.poolDecimal) {
            this.waiting = true;
            this.createStakingPool(this.stakeAddress, this.poolAddress, this.startBlock, this.finishBlock, this.poolTokenSupply)
                .then((response: any) => {
                    console.info('receipt');
                    console.info(response);

                    this.waiting = false;
                    if (response) {
                        this.translate.get('Pool created')
                            .subscribe((langResp: string) => {
                                this.showSuccessModal(langResp);
                            });
                        var poolAddress = response.events.StakingPoolCreated.returnValues.pool;
                        console.info(response.events.StakingPoolCreated);
                        console.info(poolAddress);
                        this._router.navigate(['/poolView'], { queryParams: { pool: poolAddress } });
                        //this._router.navigate(['/stake']);
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

            //promise.once('transactionHash', function (hash) {
            //    console.info('transactionHash');
            //    console.info(hash);
            //    this.showTransactionSumbited(hash);
            //    this.creatingPoolTx = hash;
            //    this.creatingPoolProcess = true;
            //});
            //promise.once('receipt', function (receipt) {
            //    console.info('receipt');
            //    console.info(receipt);
            //    this.waiting = false;
            //    this.translate.get('Pool created')
            //        .subscribe((langResp: string) => {
            //            this.showSuccessModal(langResp);
            //        });
            //    var poolAddress = receipt.events.StakingPoolCreated.returnValues.pool;
            //    console.info(receipt.events.StakingPoolCreated);
            //    console.info(poolAddress);
            //    //TODO: not working that._router.navigate
            //    this._router.navigate(['/stake'], { queryParams: { pool: poolAddress } });

            //    //that.updateBalanceData();
            //})
            //promise.once('error', function (error, receipt) {
            //    console.error(receipt);
            //    console.error(error);
            //    this.waiting = false;
            //});


            //.then((response) => {
            //    console.log(response);
            //    if (response) {
            //        this.creatingPoolTx = response;
            //        this.creatingPoolProcess = true;
            //        this.createPoolTimerId = setInterval(() => {
            //            this.CheckTxCreatePool(response)
            //        }, this.expectedBlockTime);
            //    }
            //});
        }
    }

    //CheckTxCreatePool(tx: string): void {
    //    console.log("CheckTxCreatePool: ", tx)
    //    this.GetTransactionReceipt(tx).then((resp) => {
    //        console.log("Got the transaction receipt: ", resp);
    //        if (resp) {
    //            if (this.createPoolTimerId) {
    //                clearInterval(this.createPoolTimerId);
    //            }
    //            this.showSuccessModal("Transaction mined");
    //        }
    //    });
    //}

    async createStakingPool(stakingToken: string, poolToken: string, startDate: number, finishDate: number, poolTokenAmount: number): Promise<any> {
        return new Promise((resolve, reject) => {
            let masterContract = new this.web3Service.web3.eth.Contract(this.stakeMasterAbi, this.stakeMasterAddress);

            let stringStartDate = "0x" + new BigNumber(startDate).toString(16);
            let stringFinishDate = "0x" + new BigNumber(finishDate).toString(16);
            let stringPoolTokenAmount = "0x" + new BigNumber(poolTokenAmount).shiftedBy(this.poolDecimal).toString(16);

            return masterContract.methods.createStakingPool(stakingToken, poolToken, stringStartDate, stringFinishDate, stringPoolTokenAmount)
                .send({ from: this.account })
                .on('transactionHash', function (hash) {
                    console.info('transactionHash');
                    console.info(hash);
                    //this.showTransactionSumbited(hash);
                    //this.creatingPoolTx = hash;
                    //this.creatingPoolProcess = true;
                })
                .on('receipt', function (receipt) {
                    console.info('receipt');
                    console.info(receipt);
                    resolve(receipt);
                    //this.waiting = false;
                    //this.translate.get('Pool created')
                    //    .subscribe((langResp: string) => {
                    //        this.showSuccessModal(langResp);
                    //    });
                    //var poolAddress = receipt.events.StakingPoolCreated.returnValues.pool;
                    //console.info(receipt.events.StakingPoolCreated);
                    //console.info(poolAddress);
                    ////TODO: not working that._router.navigate
                    //this._router.navigate(['/stake'], { queryParams: { pool: poolAddress } });

                    //that.updateBalanceData();
                })
                .on('error', function (error, receipt) {
                    console.error(error);
                    console.error(receipt);
                    reject(error);
                    //this.waiting = false;
                });
        }) as Promise<any>;
    }


    async getFeeToken(): Promise<any> {
        return new Promise((resolve, reject) => {
            let masterContract = new this.web3Service.web3.eth.Contract(this.stakeMasterAbi, this.stakeMasterAddress);
            masterContract.methods.feeToken().call({}, (error, resp) => {
                resolve(resp);
            });
        }) as Promise<any>;
    }


    async getFeeAmount(): Promise<any> {
        return new Promise((resolve, reject) => {
            let masterContract = new this.web3Service.web3.eth.Contract(this.stakeMasterAbi, this.stakeMasterAddress);
            masterContract.methods.feeAmount().call({}, (error, resp) => {
                resolve(resp);
            });
        }) as Promise<any>;
    }
}