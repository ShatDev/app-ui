import { Component, Input, OnInit, OnDestroy } from "@angular/core";
import { UserSessionProvider } from "shared/user-session-provider";
import { TranslateService } from "@ngx-translate/core";
import { ComponentBase } from "shared/component-base";
import BigNumber from "bignumber.js";
import { Router } from '@angular/router';

@Component({
    templateUrl: "idoview.component.html",
    selector: "ido-view"
})

export class IDOViewComponent extends ComponentBase implements OnInit, OnDestroy {
    @Input() pool: any;
    @Input() allowedAddresses: string[];
    @Input() poolsConfig: any;

    updateTimeTimerId;
    updateTimerId;

    idoAddress: string;
    rewardTokenAddress: string;
    rewardSymbol: string;

    rewardDecimal: number;
    tokenPrice: number;

    tokensForDistribution: number;
    maxDistributedTokenAmount: number;

    startTimestamp: number;
    finishTimestamp: number;
    startClaimTimestamp: number;
    now: number;

    public get imagePath(): string {
        if (this.poolsConfig && this.poolsConfig.poolTokenImages) {
            let poolImage = this.poolsConfig.poolTokenImages.filter(p => p.address.toLowerCase() == this.pool.returnValues.rewardToken.toLowerCase());
            if (poolImage.length > 0)
                return poolImage[0].image_url;
        }
        return "/assets/images/nologo.svg";
    }

    public get verified(): boolean {
        return this.allowedAddresses.includes(this.pool.returnValues.idoPool.toLowerCase());
    }

    public get isFinished(): boolean {
        return this.now > this.finishTimestamp;
    }

    public get getDistributedPercent(): number {
        if (this.maxDistributedTokenAmount && this.tokensForDistribution)
            return new BigNumber(this.tokensForDistribution).div(this.maxDistributedTokenAmount).multipliedBy(100).toNumber();
        return 0;
    }

    constructor(private _router: Router) {
        super();
        this.now = Math.floor(Date.now() / 1000);

        this.updateTimeTimerId = setInterval(() => {
            this.now = Math.floor(Date.now() / 1000);
        }, 1000);
    }

    async ngOnInit() {
        //await this.initWeb3();

        //owner:
        //0x56655fdff46ac28db72603c5589a69b45b8604cc
        //idoPool:
        //0x83755c50627a65f38a6356086c00628ef0325ee1
        //tokenPrice:
        //1000000000000000
        //rewardToken:
        //0x0394d17af9dd20a1330754ca88deda4afa687b34
        //startTimestamp:
        //1613079000
        //finishTimestamp:
        //1613154000
        //startClaimTimestamp:
        //1613154000
        //minEthPayment:
        //100000000000000
        //maxEthPayment:
        //100000000000000000
        //maxDistributedTokenAmount:
        //1000000000

        this.rewardTokenAddress = this.pool.returnValues.rewardToken;
        this.idoAddress = this.pool.returnValues.idoPool;
        this.startTimestamp = parseInt(this.pool.returnValues.startTimestamp);
        this.finishTimestamp = parseInt(this.pool.returnValues.finishTimestamp);
        this.startClaimTimestamp = parseInt(this.pool.returnValues.startClaimTimestamp);

        this.rewardDecimal = parseInt(await this.web3Service.GetDecimals(this.rewardTokenAddress));

        this.GetMaxDistributedTokenAmount().then((resp) => {
            this.maxDistributedTokenAmount = this.toNumberFromWei(resp, this.rewardDecimal);
        });

        this.web3Service.GetContractSymbol(this.rewardTokenAddress).then((resp) => {
            this.rewardSymbol = resp;
        });

        this.tokenPrice = this.toNumberFromWei(this.pool.returnValues.tokenPrice, 18);

        this.updateUserData();
        this.updateTimerId = setInterval(() => {
            this.updateUserData()
        }, this.expectedBlockTime);
    }

    async ngOnDestroy() {
        if (this.updateTimerId) {
            clearInterval(this.updateTimerId);
        }
        if (this.updateTimeTimerId) {
            clearInterval(this.updateTimeTimerId);
        }
    }

    async updateUserData() {
        if (this.isFinished && this.updateTimerId) {
            clearInterval(this.updateTimerId);
        }

        this.GetTokensForDistribution().then((resp) => {
            this.tokensForDistribution = this.toNumberFromWei(resp, this.rewardDecimal);
        });
    }

    async GetMaxDistributedTokenAmount(): Promise<any> {
        return new Promise((resolve, reject) => {
            let contract = new this.web3Service.web3.eth.Contract(this.idoPoolAbi, this.idoAddress);
            contract.methods.maxDistributedTokenAmount().call({}, (error, resp) => {
                resolve(resp);
            });
        }) as Promise<any>;
    }

    async GetTokensForDistribution(): Promise<any> {
        return new Promise((resolve, reject) => {
            let contract = new this.web3Service.web3.eth.Contract(this.idoPoolAbi, this.idoAddress);
            contract.methods.tokensForDistribution().call({}, (error, resp) => {
                resolve(resp);
            });
        }) as Promise<any>;
    }

    toIdoPage() {
        this._router.navigate(['/ido-detail'], { queryParams: { pool: this.idoAddress } });
    }
}