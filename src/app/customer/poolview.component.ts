import { Component, Input, OnInit, OnDestroy } from "@angular/core";
import { UserSessionProvider } from "shared/user-session-provider";
import { TranslateService } from "@ngx-translate/core";
import { ComponentBase } from "shared/component-base";
import BigNumber from "bignumber.js";
import { trigger, transition, style, animate } from "@angular/animations";
import { StakingPoolDTO } from "../../service-proxies/service-proxies";


@Component({
    templateUrl: "poolview.component.html",
    selector: "pool-view",
    //animations: [
    //    trigger(
    //        'inOutAnimation',
    //        [
    //            transition(
    //                ':enter',
    //                [
    //                    style({ height: 0, opacity: 0 }),
    //                    animate('1s ease-out',
    //                        style({ height: 'auto', opacity: 1 }))
    //                ]
    //            ),
    //            transition(
    //                ':leave',
    //                [
    //                    style({ height: 'auto', opacity: 1 }),
    //                    animate('1s ease-in',
    //                        style({ height: 0, opacity: 0 }))
    //                ]
    //            )
    //        ]
    //    )
    //]
})

export class PoolViewComponent extends ComponentBase implements OnInit, OnDestroy {
    @Input() pool: StakingPoolDTO;
    @Input() allowedAddresses: string[];
    @Input() poolsConfig: any;
    @Input() isLP: boolean;
    showUnstake: boolean = false;
    showStake: boolean = false;

    updateTimerId;
    //in approving progress after clicked button
    saving: boolean = false;
    isApproved: boolean = false;

    amountForStake: number;
    amountForWithdrawStake: number;

    account: string;
    stakedTokenBalance: number;
    stakedAmount: number = 0;
    pendingReward: number;
    stakingTokenAddress: string;
    rewardTokenAddress: string;
    //stakeSymbol: string;
    //rewardSymbol: string;
    stakeDecimal: number;
    rewardDecimal: number;

    rewardPerBlock: number;
    startBlock: number;
    finishBlock: number;
    nowBlock: number;

    isBlockPool: boolean;

    allStakedAmount: number;
    participants: number = 0;
    poolTokenAmount: number;

    lpToken0: string;
    lpToken1: string;

    lpTokenSymbol0: string;
    lpTokenSymbol1: string;

    owner: string;

    public get imagePath(): string {
        if (this.poolsConfig && this.poolsConfig.poolTokenImages) {
            //TODO: check this.pool.returnValues.poolToken.toLowerCase
            let poolImage = this.poolsConfig.poolTokenImages.filter(p => p.address.toLowerCase() == this.pool.poolToken.toLowerCase());
            if (poolImage.length > 0)
                return poolImage[0].image_url;
        }
        return "/assets/images/nologo.svg";
    }


    public get addLiquidityURL(): string {
        if (this.isBNBChain) {
            var liquidityURL = "";
            if (this.pool.stakingTokenSymbol == "Cake-LP") {
                liquidityURL = `https://exchange.pancakeswap.finance/#/add/BNB/`;
            }
            else if (this.pool.stakingTokenSymbol == "BLP") {
                    liquidityURL = `https://www.bakeryswap.org/#/add/ETH/`;
            }
            else if (this.pool.stakingTokenSymbol == "SLP") {
                liquidityURL = `https://julswap.com/#/add/BNB/`;
            }

            if (this.lpToken0 && this.lpToken1 && this.lpToken0.toLowerCase() === this.WETHAddress.toLowerCase()) {
                return `${liquidityURL}${this.lpToken1}`;
            }
            else if (this.lpToken0 && this.lpToken1 && this.lpToken1.toLowerCase() === this.WETHAddress.toLowerCase()) {
                return `${liquidityURL}${this.lpToken0}`;
            }
        }
        else {
            if (this.lpToken0 && this.lpToken1 && this.lpToken0.toLowerCase() === this.WETHAddress.toLowerCase()) {
                return `https://app.uniswap.org/#/add/ETH/${this.lpToken1}`;
            }
            else if (this.lpToken0 && this.lpToken1 && this.lpToken1.toLowerCase() === this.WETHAddress.toLowerCase()) {
                return `https://app.uniswap.org/#/add/ETH/${this.lpToken0}`;
            }
        }

        return "#";
    }

    public get uniFullSymbols(): string {
        if (this.lpTokenSymbol0 && this.lpTokenSymbol1) {
            return `${this.lpTokenSymbol0}-${this.lpTokenSymbol1}`;
        }
        else { return null; }
    }

    apy: number;

    public get verified(): boolean {
        return this.allowedAddresses.includes(this.pool.poolAddress.toLowerCase());
    }

    public get isFinished(): boolean {
        return this.nowBlock > this.finishBlock;
    }

    public get isActive(): boolean {
        return this.nowBlock > this.startBlock && this.nowBlock < this.finishBlock;
    }

    public get getStakedPercent(): number {
        if (this.allStakedAmount && this.stakedAmount)
            return new BigNumber(this.stakedAmount).div(this.allStakedAmount).multipliedBy(100).toNumber();
        return 0;
    }

    
    public get allPaidReward(): number {
        if (this.nowBlock > this.startBlock) {
            if (this.nowBlock < this.finishBlock) {
                return (this.nowBlock - this.startBlock) * this.rewardPerBlock;
            }
            else
                return (this.finishBlock - this.startBlock) * this.rewardPerBlock;
        }
        else return 0;
    }


    public get getDistributedPercent(): number {
        if (this.nowBlock > this.startBlock) {
            if (this.nowBlock < this.finishBlock) {
                return new BigNumber(this.nowBlock - this.startBlock).div(this.finishBlock - this.startBlock).multipliedBy(100).toNumber();
            }
            else
                return 100;
        }
        else return 0;
    }

    public get allFutureReward(): number {
        let calc = (this.finishBlock - this.startBlock) * this.rewardPerBlock - this.allPaidReward;
        if (calc < 0)
            return 0;
        else
            return calc;
        // if(this.nowBlock>this.startBlock)
        // {
        //     if(this.finishBlock>this.nowBlock)
        //     {
        //         return (this.finishBlock-this.nowBlock)*this.rewardPerBlock;
        //     }
        //     else
        //         return (this.finishBlock - this.startBlock)*this.rewardPerBlock;
        // }
        // else return 0;
    }

    constructor(private userSessionProvider: UserSessionProvider, private translate: TranslateService) {
        super();
        this.account = userSessionProvider.username;
    }

    async ngOnInit() {
        //await this.initWeb3();
        //TODO: check

        //this.stakingTokenAddress = this.pool.returnValues.stakingToken;
        //this.rewardTokenAddress = this.pool.returnValues.poolToken;
        //console.log('this.pool.returnValues.startBlock')
        //console.log(this.pool.returnValues.startBlock)
        //this.startBlock = parseInt(this.pool.returnValues.startBlock);
        //this.finishBlock = parseInt(this.pool.returnValues.finishBlock);

        this.stakingTokenAddress = this.pool.stakingToken;
        this.rewardTokenAddress = this.pool.poolToken;
        //console.log('this.pool.returnValues.startBlock')
        //console.log(this.pool.returnValues.startBlock)
        this.startBlock = this.pool.startTime; //parseInt(this.pool.returnValues.startBlock);
        this.finishBlock = this.pool.finishTime;// parseInt(this.pool.returnValues.finishBlock);

        this.isBlockPool = this.pool.isBlockPool;

        //When add API cat get from pool.stakingTokenDecimals
        this.stakeDecimal = parseInt(await this.web3Service.GetDecimals(this.stakingTokenAddress)); //this.pool.stakingTokenDecimals;//
        this.rewardDecimal = parseInt(await this.web3Service.GetDecimals(this.rewardTokenAddress)); //this.pool.poolTokenDecimals; // 

        this.poolTokenAmount = this.toNumberFromWei(this.pool.poolTokenAmount, this.rewardDecimal);

        this.web3Service.getOwner(this.pool.poolAddress).then((resp) => {
            this.owner = resp;
        });

        //this.GetContractSymbol(this.stakingTokenAddress).then((resp) => {
        //    this.stakeSymbol = resp;
        //});

        //this.GetContractSymbol(this.rewardTokenAddress).then((resp) => {
        //    this.rewardSymbol = resp;
        //});

        this.rewardPerBlock = this.isBlockPool ? this.toNumberFromWei(await this.GetRewardPerBlock(), this.rewardDecimal)
            : this.toNumberFromWei(await this.GetRewardPerSec(), this.rewardDecimal);

        this.updateAllContractData();
        this.updateTimerId = setInterval(() => {
            this.updateAllContractData()
        }, this.longTimeUpdate);

        if (this.isLP) {
            this.lpToken0 = await this.web3Service.getUniToken0(this.stakingTokenAddress);
            this.lpToken1 = await this.web3Service.getUniToken1(this.stakingTokenAddress);

            if (this.lpToken0.toLowerCase() === this.WETHAddress.toLowerCase())
                this.lpTokenSymbol0 = this.chainSymbol;
            else
                this.lpTokenSymbol0 = await this.web3Service.GetContractSymbol(this.lpToken0);

            if (this.lpToken1.toLowerCase() === this.WETHAddress.toLowerCase())
                this.lpTokenSymbol1 = this.chainSymbol;
            else
                this.lpTokenSymbol1 = await this.web3Service.GetContractSymbol(this.lpToken1);
        }
    }

    async ngOnDestroy() {
        if (this.updateTimerId) {
            clearInterval(this.updateTimerId);
        }
    }
    //getMultiplier(_from: number , _to: number): number {
    //if (_to <= bonusEndBlock) {
    //    return _to.sub(_from);
    //} else if (_from >= bonusEndBlock) {
    //    return 0;
    //} else {
    //    return bonusEndBlock.sub(_from);
    //}
    //}

    async updateAllContractData() {
        if (this.isFinished && this.updateTimerId) {
            clearInterval(this.updateTimerId);
        }

        this.updateContractData();
        if (this.account) {
            this.updateUserData();
        }
    }

    async updateUserData() {
        this.updateAllowance(this.account, this.pool.stakingToken, this.pool.poolAddress);
        this.GetUserInfo().then((resp) => {
            this.stakedAmount = this.toNumberFromWeiFixed(resp.amount, this.stakeDecimal, 8, 1);
        });

        this.GetPendingReward().then((resp) => {
            this.pendingReward = this.toNumberFromWeiFixed(resp, this.rewardDecimal, 8, 1);
        });

        this.web3Service.GetTokenBalance(this.account, this.pool.stakingToken).then((resp) => {           
            this.stakedTokenBalance = this.toNumberFromWeiFixed(resp, this.stakeDecimal, 8, 1);
        });
    }

    async updateContractData() {
        if (this.isBlockPool) {
            this.nowBlock = (await this.web3Service.web3.eth.getBlock('latest')).number;
        }
        else {
            this.nowBlock = Math.floor(Date.now() / 1000);
        }

        this.allStakedAmount = this.toNumberFromWei(await this.GetAllStakedAmount(), this.stakeDecimal);

        this.GetParticipants().then((resp) => {
            this.participants = parseInt(resp);
        });
        //APY will calculate if exist allStakedAmount
        if (this.allStakedAmount && !this.isFinished){ //&& this.chainId != '0x38') {
            var BLOCKS_PER_YEAR = new BigNumber(31536000);
            if (this.isBlockPool) {
                BLOCKS_PER_YEAR = new BigNumber(2305000);
                if (this.chainId == '0x38') {
                    BLOCKS_PER_YEAR = new BigNumber(28800 * 365);
                }
            }

            if (this.pool.stakingToken != this.pool.poolToken) {
                if (this.isLP) {
                    let uniTokens = [await this.web3Service.getUniToken0(this.stakingTokenAddress), await this.web3Service.getUniToken1(this.stakingTokenAddress)]
                    //let token0 = await this.getUniToken0(this.stakingTokenAddress);
                    //let token1 = await this.getUniToken1(this.stakingTokenAddress);
                    let reserves = await this.web3Service.getUniReserves(this.stakingTokenAddress);
                    let totalSupply = new BigNumber(await this.web3Service.GetTotalSupply(this.stakingTokenAddress));
                    let lpTokenPrice;
                    if (uniTokens[0].toLowerCase() == this.WETHAddress.toLowerCase()) {
                        //let tokenPrice = await this.getAmountsOut(10 ** parseInt(await this.GetDecimals(uniTokens[1])), [uniTokens[1], environment.WETHAddress]);
                        //let tokenPriceInETH = new BigNumber(tokenPrice[1]);
                        //let uniPoolCost = (new BigNumber(reserves[0])).plus(new BigNumber(reserves[1]).multipliedBy(tokenPriceInETH));
                        let uniPoolCost = (new BigNumber(reserves[0])).times(2);
                        lpTokenPrice = uniPoolCost.multipliedBy(1e18).div(totalSupply);
                    }
                    else if (uniTokens[1].toLowerCase() == this.WETHAddress.toLowerCase()) {
                        //let tokenPrice = await this.getAmountsOut(10 ** parseInt(await this.GetDecimals(uniTokens[0])), [uniTokens[0], environment.WETHAddress]);
                        //let tokenPriceInETH = new BigNumber(tokenPrice[1]);
                        //let uniPoolCost = (new BigNumber(reserves[1])).plus(new BigNumber(reserves[0]).multipliedBy(tokenPriceInETH));
                        let uniPoolCost = (new BigNumber(reserves[1])).times(2);
                        console.log(uniPoolCost.toNumber());
                        lpTokenPrice = uniPoolCost.multipliedBy(1e18).div(totalSupply);
                    }
                    console.log('lpTokenPrice');
                    //if found lpTokenPrice
                    if (lpTokenPrice) {
                        let rewardAmountsOut = await this.web3Service.getAmountsOut(this.UniswapV2Router02, 10 ** this.rewardDecimal, [this.pool.poolToken, this.WETHAddress]);
                        if (rewardAmountsOut) {
                            let stakingTokenPriceInETH = lpTokenPrice;
                            let rewardTokenPriceInETH = new BigNumber(rewardAmountsOut[1]);

                            let totalRewardPricePerYear = rewardTokenPriceInETH.times(this.rewardPerBlock).times(BLOCKS_PER_YEAR);
                            let totalStakingTokenInPool = stakingTokenPriceInETH.times(this.allStakedAmount);
                            this.apy = parseFloat(totalRewardPricePerYear.div(totalStakingTokenInPool).times(100).toFixed(2, 1));
                        }
                    }
                    //let  = await this.GetTokenBalance(this.account, this.stakingTokenAddress);
                }
                else {
                    let stakingAmountsOut = await this.web3Service.getAmountsOut(this.UniswapV2Router02, 10 ** this.stakeDecimal, [this.pool.stakingToken, this.WETHAddress]);
                    let rewardAmountsOut = await this.web3Service.getAmountsOut(this.UniswapV2Router02, 10 ** this.rewardDecimal, [this.pool.poolToken, this.WETHAddress]);
                    if (stakingAmountsOut && rewardAmountsOut) {
                        let stakingTokenPriceInETH = new BigNumber(stakingAmountsOut[1]);
                        let rewardTokenPriceInETH = new BigNumber(rewardAmountsOut[1]);

                        let totalRewardPricePerYear = rewardTokenPriceInETH.times(this.rewardPerBlock).times(BLOCKS_PER_YEAR);
                        let totalStakingTokenInPool = stakingTokenPriceInETH.times(this.allStakedAmount);
                        this.apy = parseFloat(totalRewardPricePerYear.div(totalStakingTokenInPool).times(100).toFixed(2, 1));
                    }
                }
            }
            else {
                let totalRewardPricePerYear = new BigNumber(this.rewardPerBlock).times(BLOCKS_PER_YEAR);
                let totalStakingTokenInPool = new BigNumber(this.allStakedAmount);
                this.apy = parseFloat(totalRewardPricePerYear.div(totalStakingTokenInPool).times(100).toFixed(2, 1));
            }
        }
    }


    setMaxUnStake(): void {
        this.amountForWithdrawStake = this.stakedAmount;
    }


    setMaxStake(): void {
        this.amountForStake = this.stakedTokenBalance;
    }

    updateAllowance(account: string, tokenForspend: string, forContractAddress: string): void {
        this.web3Service.GetAllowance(account, tokenForspend, forContractAddress).then((resp) => {
            console.log(`GetAllowance: ${resp.toString()}`);
            //TODO: isApproved = resp > 0;
            this.isApproved = resp > 0;
        });
    }

    //async GetStakingToken(): Promise<any> {
    //    return new Promise((resolve, reject) => {
    //        let contract = new this.web3.eth.Contract(this.stakingPoolAbi, this.pool.returnValues.pool);
    //        contract.methods.stakingToken().call({}, (error, resp) => {
    //            resolve(resp);
    //        });
    //    }) as Promise<any>;
    //}

    //async GetRewardToken(): Promise<any> {
    //    return new Promise((resolve, reject) => {
    //        let contract = new this.web3.eth.Contract(this.stakingPoolAbi, this.pool.returnValues.pool);
    //        contract.methods.rewardToken().call({}, (error, resp) => {
    //            resolve(resp);
    //        });
    //    }) as Promise<any>;
    //}

    //async GetStartBlock(): Promise<any> {
    //    return new Promise((resolve, reject) => {
    //        let contract = new this.web3.eth.Contract(this.stakingPoolAbi, this.pool.returnValues.pool);
    //        contract.methods.startBlock().call({}, (error, resp) => {
    //            resolve(resp);
    //        });
    //    }) as Promise<any>;
    //}

    //async GetFinishBlock(): Promise<any> {
    //    return new Promise((resolve, reject) => {
    //        let contract = new this.web3.eth.Contract(this.stakingPoolAbi, this.pool.returnValues.pool);
    //        contract.methods.finishBlock().call({}, (error, resp) => {
    //            resolve(resp);
    //        });
    //    }) as Promise<any>;
    //}

    async GetRewardPerBlock(): Promise<any> {
        return new Promise((resolve, reject) => {
            let contract = new this.web3Service.web3.eth.Contract(this.stakingPoolAbi, this.pool.poolAddress);
            contract.methods.rewardPerBlock().call({}, (error, resp) => {
                console.log(`rewardPerBlock ${resp}`);
                resolve(resp);
            });
        }) as Promise<any>;
    }

    async GetRewardPerSec(): Promise<any> {
        return new Promise((resolve, reject) => {
            let contract = new this.web3Service.web3.eth.Contract(this.stakingPoolAbiV2, this.pool.poolAddress);
            contract.methods.rewardPerSec().call({}, (error, resp) => {
                console.log(`rewardPerSec ${resp}`);
                resolve(resp);
            });
        }) as Promise<any>;
    }

    async GetAllStakedAmount(): Promise<any> {
        return new Promise((resolve, reject) => {
            let contract = new this.web3Service.web3.eth.Contract(this.stakingPoolAbi, this.pool.poolAddress);
            contract.methods.allStakedAmount().call({}, (error, resp) => {
                resolve(resp);
            });
        }) as Promise<any>;
    }

    async GetParticipants(): Promise<any> {
        return new Promise((resolve, reject) => {
            let contract = new this.web3Service.web3.eth.Contract(this.stakingPoolAbi, this.pool.poolAddress);
            contract.methods.participants().call({}, (error, resp) => {
                resolve(resp);
            });
        }) as Promise<any>;
    }


    async GetAccTokensPerShare(): Promise<any> {
        return new Promise((resolve, reject) => {
            let contract = new this.web3Service.web3.eth.Contract(this.stakingPoolAbi, this.pool.poolAddress);
            contract.methods.accTokensPerShare().call({}, (error, resp) => {
                resolve(resp);
            });
        }) as Promise<any>;
    }

    async GetLastRewardBlock(): Promise<any> {
        return new Promise((resolve, reject) => {
            let contract = new this.web3Service.web3.eth.Contract(this.stakingPoolAbi, this.pool.poolAddress);
            contract.methods.lastRewardBlock().call({}, (error, resp) => {
                resolve(resp);
            });
        }) as Promise<any>;
    }

    async GetUserInfo(): Promise<any> {
        return new Promise((resolve, reject) => {
            let contract = new this.web3Service.web3.eth.Contract(this.stakingPoolAbi, this.pool.poolAddress);
            contract.methods.userInfo(this.account).call({}, (error, resp) => {
                //console.log('userInfo');
                //console.log(resp);
                resolve(resp);
            });
        }) as Promise<any>;
    }

    async GetPendingReward(): Promise<any> {
        return new Promise((resolve, reject) => {
            let contract = new this.web3Service.web3.eth.Contract(this.stakingPoolAbi, this.pool.poolAddress);
            contract.methods.pendingReward(this.account).call({}, (error, resp) => {
                //console.log('pendingReward');
                //console.log(resp);
                resolve(resp);
            });
        }) as Promise<any>;
    }

    approvePoolClick(): void {
        this.saving = true;

        this.web3Service.ApproveOn(this.account, this.stakingTokenAddress, this.pool.poolAddress)
            .then((response: any) => {
                this.translate.get('Confirmed transaction')
                    .subscribe((langResp: string) => {
                        this.showSuccessModal(langResp);
                    });
                this.updateUserData();
            }).catch((response: any) => {
                console.info('catch');
                console.info(response);
            }).finally(() => {
                console.info('finally');
                this.saving = false;
            });

        //.on('transactionHash', function (hash) {
        //    console.info('transactionHash');
        //    console.info(hash);
        //    that.showTransactionSumbited(hash);
        //})
        //.on('receipt', function (receipt) {
        //    console.info('receipt');
        //    console.info(receipt);
        //    that.saving = false;
        //    that.translate.get('Confirmed transaction')
        //        .subscribe((langResp: string) => {
        //            that.showSuccessModal(langResp);
        //        });
        //    that.updateUserData();
        //})
        //.on('error', function (error, receipt) {
        //    console.error(receipt);
        //    console.error(error);
        //    that.saving = false;
        //});
    }

    stakeClick(): void {
        if (this.amountForStake > this.stakedTokenBalance) {
            this.showErrorModal("Stake amount more than your balance!");
            return;
        }
        this.saving = true;
        this.stakeTokens(this.pool.poolAddress, this.amountForStake)
            .then((response: any) => {
                this.saving = false;
                this.showStake = false;
                this.translate.get('Confirmed transaction')
                    .subscribe((langResp: string) => {
                        this.showSuccessModal(langResp);
                    });
                this.updateAllContractData();
            }).catch((response: any) => {
                this.saving = false;
                console.info('catch');
                console.info(response);
            }).finally(() => {
                console.info('finally');
                this.saving = false;
            });
    }

    stakeTokens(contractAddress: string, tokenAmount: number): Promise<any> {
        return new Promise((resolve, reject) => {
            let stakingPoolContract = new this.web3Service.web3.eth.Contract(this.stakingPoolAbi, contractAddress);
            let stringTokenAmount = "0x" + new BigNumber(tokenAmount).shiftedBy(this.stakeDecimal).toString(16);
            stakingPoolContract.methods.stakeTokens(stringTokenAmount)
                .send({ from: this.account })
                .on('transactionHash', function (hash) {
                    console.info('transactionHash');
                    console.info(hash);
                    //that.showTransactionSumbited(hash);
                    //that.amountForStake = null;
                    //that.showStake = false;
                })
                .on('receipt', function (receipt) {
                    console.info('receipt');
                    console.info(receipt);
                    resolve(receipt);
                    //that.saving = false;
                    //that.translate.get('Confirmed transaction')
                    //    .subscribe((langResp: string) => {
                    //        that.showSuccessModal(langResp);
                    //    });
                    //that.updateUserData();
                })
                .on('error', function (error, receipt) {
                    console.error(receipt);
                    console.error(error);
                    reject(error);
                    //that.saving = false;
                });
        }) as Promise<any>;
    }

    reinvest(contractAddress: string): Promise<any> {
        return new Promise((resolve, reject) => {
            let stakingPoolContract = new this.web3Service.web3.eth.Contract(this.stakingPoolAbiV2, contractAddress);
            stakingPoolContract.methods.reinvestTokens()
                .send({ from: this.account })
                .on('transactionHash', function (hash) {
                    console.info('transactionHash');
                    console.info(hash);
                    //that.showTransactionSumbited(hash);
                    //that.amountForStake = null;
                    //that.showStake = false;
                })
                .on('receipt', function (receipt) {
                    console.info('receipt');
                    console.info(receipt);
                    resolve(receipt);
                    //that.saving = false;
                    //that.translate.get('Confirmed transaction')
                    //    .subscribe((langResp: string) => {
                    //        that.showSuccessModal(langResp);
                    //    });
                    //that.updateUserData();
                })
                .on('error', function (error, receipt) {
                    console.error(receipt);
                    console.error(error);
                    reject(error);
                    //that.saving = false;
                });
        }) as Promise<any>;
    }
    withdrawStakeClick() {
        console.log('withdrawStakeClick');
        if (this.amountForWithdrawStake > this.stakedAmount) {
            this.showErrorModal("Unstake amount more than staked balance!");
            return;
        }
        this.saving = true;
        this.withdrawStake(this.pool.poolAddress, this.amountForWithdrawStake)
            .then((response: any) => {
                this.saving = false;
                this.showUnstake = false;
                this.translate.get('Confirmed transaction')
                    .subscribe((langResp: string) => {
                        this.showSuccessModal(langResp);
                    });
                this.updateAllContractData();
            }).catch((response: any) => {
                console.info('catch');
                console.info(response);
                this.saving = false;
            }).finally(() => {
                console.info('finally');
                this.saving = false;
            });
    }

    harvestClick() {
        this.saving = true;
        this.withdrawStake(this.pool.poolAddress, 0)
            .then((response: any) => {
                this.saving = false;
                this.translate.get('Confirmed transaction')
                    .subscribe((langResp: string) => {
                        this.showSuccessModal(langResp);
                    });
                this.updateAllContractData();
            }).catch((response: any) => {
                console.info('catch');
                console.info(response);
                this.saving = false;
            }).finally(() => {
                console.info('finally');
                this.saving = false;
            });
    }

    reinvestClick() {
        this.saving = true;
        this.reinvest(this.pool.poolAddress)
            .then((response: any) => {
                this.saving = false;
                this.showStake = false;
                this.translate.get('Confirmed transaction')
                    .subscribe((langResp: string) => {
                        this.showSuccessModal(langResp);
                    });
                this.updateAllContractData();
            }).catch((response: any) => {
                this.saving = false;
                console.info('catch');
                console.info(response);
            }).finally(() => {
                console.info('finally');
                this.saving = false;
            });
    }
    
    withdrawStake(contractAddress: string, tokenAmount: number): Promise<any> {
        return new Promise((resolve, reject) => {
            //this.saving = true;
            let stakingPoolContract = new this.web3Service.web3.eth.Contract(this.stakingPoolAbi, contractAddress);
            let stringTokenAmount = "0x" + new BigNumber(tokenAmount).shiftedBy(this.stakeDecimal).toString(16);
            console.log("balance " + this.stakedTokenBalance);
            console.log("stringTokenAmount " + stringTokenAmount);
            console.log("tokenAmount " + tokenAmount);
            stakingPoolContract.methods.withdrawStake(stringTokenAmount)
                .send({ from: this.account })
                .on('transactionHash', function (hash) {
                    console.info('transactionHash');
                    console.info(hash);
                    //that.showTransactionSumbited(hash);
                    //that.amountForWithdrawStake = null;
                    //that.showUnstake = false;
                })
                .on('receipt', function (receipt) {
                    console.info('receipt');
                    console.info(receipt);
                    resolve(receipt);
                    //that.saving = false;
                    //that.translate.get('Confirmed transaction')
                    //    .subscribe((langResp: string) => {
                    //        that.showSuccessModal(langResp);
                    //    });
                    //that.updateUserData();
                })
                .on('error', function (error, receipt) {
                    console.error(receipt);
                    console.error(error);
                    reject(error);
                    //that.saving = false;
                });
        }) as Promise<any>;
    }



    withdrawPoolRemainderClick() {
        this.saving = true;
        this.withdrawPoolRemainder(this.pool.poolAddress)
            .then((response: any) => {
                this.saving = false;
                this.translate.get('Confirmed transaction')
                    .subscribe((langResp: string) => {
                        this.showSuccessModal(langResp);
                    });
                this.updateUserData();
            }).catch((response: any) => {
                console.info('catch');
                console.info(response);
                this.saving = false;
            }).finally(() => {
                console.info('finally');
                this.saving = false;
            });
    }


    withdrawPoolRemainder(contractAddress: string): Promise<any> {
        return new Promise((resolve, reject) => {
            //this.saving = true;
            let stakingPoolContract = new this.web3Service.web3.eth.Contract(this.stakingPoolAbi, contractAddress);
            stakingPoolContract.methods.withdrawPoolRemainder()
                .send({ from: this.account })
                .on('transactionHash', function (hash) {
                    console.info('transactionHash');
                    console.info(hash);
                    //that.showTransactionSumbited(hash);
                    //that.amountForWithdrawStake = null;
                    //that.showUnstake = false;
                })
                .on('receipt', function (receipt) {
                    console.info('receipt');
                    console.info(receipt);
                    resolve(receipt);
                    //that.saving = false;
                    //that.translate.get('Confirmed transaction')
                    //    .subscribe((langResp: string) => {
                    //        that.showSuccessModal(langResp);
                    //    });
                    //that.updateUserData();
                })
                .on('error', function (error, receipt) {
                    console.error(receipt);
                    console.error(error);
                    reject(error);
                    //that.saving = false;
                });
        }) as Promise<any>;
    }
    toggleStake(): void {
        this.showStake = !this.showStake;
    }
    toggleUnStake(): void {
        this.showUnstake = !this.showUnstake;
    }
}