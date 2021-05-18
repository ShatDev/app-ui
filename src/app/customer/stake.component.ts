import { Component, OnInit, OnDestroy } from "@angular/core";
import { slideFromBottom } from "shared/animation";
import { ComponentBase } from "shared/component-base";
import { EventBus } from "shared/event-bus";
import { ActivatedRoute } from '@angular/router';
import { environment } from "environments/environment";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { debounceTime, distinctUntilChanged, map } from 'rxjs/operators';
import { StakingPoolDTO, StakingPoolServiceProxy } from "../../service-proxies/service-proxies";

@Component({
    templateUrl: "stake.component.html",
    animations: [slideFromBottom()]
})

export class StakeComponent extends ComponentBase implements OnInit, OnDestroy {

    constructor(private http: HttpClient,
        private route: ActivatedRoute,
        private eventBus: EventBus,
        private stakingPoolService: StakingPoolServiceProxy) {
        super();
    }

    account: string;

    //public showUnverifiedPools: boolean = false;
    public tabType: string = "verified";
    public nowBlock: number;
    public nowTimeStamp: number = Math.floor(Date.now() / 1000);

    //existPools: any = new Array();

    public existPools: Array<StakingPoolDTO> = [];
    public allowedPools: Array<StakingPoolDTO> = [];

    //allowedPools: any = new Array();
    allowedAddresses: string[] = [];
    poolsConfig: any;

    public selectedPoolAddress: string;

    private urlPoolAddress: string;
    private urlStakingAddress: string;
    private urlPoolTokenAddress: string;

    public loadingData: boolean = false;

    //private subscribeLoginEvent: any;

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
                this.urlPoolAddress = params['pool'];
                this.urlStakingAddress = params['stakingToken'];
                this.urlPoolTokenAddress = params['poolToken'];
                console.log(`urlPoolAddress ${this.urlPoolAddress}`);
                console.log(`urlStakingAddress ${this.urlStakingAddress}`);
                console.log(`urlPoolTokenAddress ${this.urlPoolTokenAddress}`);
            });

        await this.web3Service.initWeb3();
        if (this.web3Service.web3) {
            console.log('stakeMasterAddress: ' + this.stakeMasterAddress);
            this.getPools();
        }
        //this.getPoolsApi();
    }

    async ngOnDestroy() {
        //this.subscribeLoginEvent.unsubscribe();
        this.web3Service.web3.eth.clearSubscriptions((error, resp) => {
            console.log('clearSubscriptions');
            console.log(resp);
            console.error(error);
        });
    }

    eventLogin(username: string): void {
        console.log('eventLogin');
        console.log(username);
        this.account = username;
        //this.getPools();
    }

    eventLogout(): void {
        console.log('signOut')
        this.account = "";
        //this.existPools = new Array();
        //this.allowedPools = new Array();

        this.web3Service.web3.eth.clearSubscriptions((error, resp) => {
            console.log('clearSubscriptions');
            console.log(resp);
            console.error(error);
        });
    }

    async getPoolsApi() {
        console.log('getPoolsApi');
        console.log(this.chainIdNumber);
        this.stakingPoolService.getAll(this.chainIdNumber)
            //.finally(() => {
            //    this.unblockUI();
            //})
            .subscribe(result => {
                console.log(result);
                for (let i = 0; i < result.length; i++) {
                    let itemDTO = result[i];
                    //await this.processPool(resp, i);
                    if (!this.lpTokenSymbols.includes(itemDTO.stakingTokenSymbol)) {
                        this.existPools.unshift(itemDTO);

                        //Add only verified and not finished pools by default
                        if (this.allowedAddresses.includes(itemDTO.poolAddress.toLowerCase()) && (itemDTO.isBlockPool && itemDTO.finishTime > this.nowBlock
                            || !itemDTO.isBlockPool && itemDTO.finishTime > this.nowTimeStamp)) {
                            this.allowedPools.unshift(itemDTO);
                        }
                    }
                }
                this.updatePools();
            },
                error => {
                    console.error(error);
                    //this.showError(error.json().message);
                });
    }

    async getPools() {
        console.log('getPools');
        //this.loadingData = true;
        this.nowBlock = (await this.web3Service.web3.eth.getBlock('latest')).number;
        this.nowTimeStamp = Math.floor(Date.now() / 1000);

        this.getAllowedPools()
            .subscribe(result => {
                console.log(result);
                this.poolsConfig = result;
                this.allowedAddresses = result.verifiedPoolAddresses.map(x => x.toLowerCase());

                //add hardcoded pools from old contract
                var oldPools = this.getOldPools();
                for (let i = 0; i < oldPools.length; i++) {
                    this.processPool(oldPools, i);
                }

                this.getPoolsApi();
                //var web3ForEvents = this.web3Service.getWeb3ForEvents;
                //var masterContract = new web3ForEvents.eth.Contract(this.stakeMasterAbi, this.stakeMasterAddress);
                //masterContract.getPastEvents("StakingPoolCreated", { fromBlock: this.stakeStartBlock, toBlock: 'latest' }).then(async (resp) => {
                //    console.log('StakingPoolCreated');
                //    console.log(resp);
                //    console.log(JSON.stringify(resp));
                //    //this.loadingData = false;
                //    for (let i = 0; i < resp.length; i++) {
                //        await this.processPool(resp, i);
                //    }
                //    this.updatePools();
                //});
            });


        //owner: "0xC99Da1a5eCc84e95a8f864d7eb45973b7f94C5BA"
        //pool: "0xFdcb2079Dd7f4b0b9A250b40Fe4f6Cdceb95C1cc"
        //poolToken: "0xA221B156f892C92C47845F39C4D9b9De1E20f718"
        //poolTokenAmount: "1000000000000000000000"
        //stakingToken: "0xFc3001D96E4Cd682fBc8631f9C57AE14f4E2088A"

        //if (this.urlPoolAddress || this.urlStakingAddress || this.urlPoolTokenAddress) {
        //    if (this.urlPoolAddress && this.urlPoolAddress.toLowerCase() == event.returnValues.pool.toLowerCase()) {
        //        this.allowedPools.unshift(event);
        //    }
        //    if (this.urlStakingAddress && this.urlStakingAddress.toLowerCase() == event.returnValues.stakingToken.toLowerCase()) {
        //        this.allowedPools.unshift(event);
        //    }
        //    if (this.urlPoolTokenAddress && this.urlPoolTokenAddress.toLowerCase() == event.returnValues.poolToken.toLowerCase()) {
        //        this.allowedPools.unshift(event);
        //    }
        //}
    }

    ////TODO: check
    //private processPool(resp, i: number) {
    //    let pool: any = resp[i];
    //    this.web3Service.GetContractSymbol(pool.returnValues.stakingToken).then((resp) => {
    //        //don't add mining address
    //        if (resp != "UNI-V2") {
    //            this.existPools.unshift(pool);
    //            pool.stakingTokenSymbol = resp;
    //            this.web3Service.GetContractSymbol(pool.returnValues.poolToken).then((resp) => {
    //                pool.poolTokenSymbol = resp;
    //            });
    //            //Add only verified and not finished pools by default
    //            if (this.allowedAddresses.includes(pool.returnValues.pool.toLowerCase())
    //                && (pool.isBlockPool && pool.returnValues.finishBlock > this.nowBlock
    //                    || !pool.isBlockPool && pool.returnValues.finishBlock > this.nowTimeStamp)) {
    //                this.allowedPools.unshift(pool);
    //            }
    //        }
    //    });
    //}


    private async processPool(pools, i: number) {
        //let event: any = pools[i];

        let itemDTO = await this.ConvertPoolDTO(pools[i]);

        //let symbol = await this.web3Service.GetContractSymbol(event.returnValues.stakingToken);//.then((resp) => {
        //don't add mining address
        if (!this.lpTokenSymbols.includes(itemDTO.stakingTokenSymbol)) {
            this.existPools.unshift(itemDTO);
            //event.stakingTokenSymbol = symbol;
            //this.web3Service.GetContractSymbol(event.returnValues.poolToken).then((resp) => {
            //    event.poolTokenSymbol = resp;
            //});
            //Add only verified and not finished pools by default
            if (this.allowedAddresses.includes(itemDTO.poolAddress.toLowerCase()) && (itemDTO.isBlockPool && itemDTO.finishTime > this.nowBlock
                || !itemDTO.isBlockPool && itemDTO.finishTime > this.nowTimeStamp)) {
                this.allowedPools.unshift(itemDTO);
            }
        }
        //});
    }


    getAllowedPools(): Observable<any> {
        return this.http.get(environment.poolsAddressesURL + `?v=${Date.now()}`);
    }


    public selected: any;
    public oldSelected: any;
    formatter = (state: any) => `${state.stakingTokenSymbol}-${state.poolTokenSymbol}`;

    selectedChanged(value) {
        //console.log(value);
        //console.log(this.selected);


        if (value)
            this.allowedPools = [value];
        else if (this.oldSelected != value)
            this.updatePools();

        this.oldSelected = value;
    }

    public acceptTerms: boolean = false;

    //updatePoolsClick() {
    //    this.updatePools();
    //    if (this.showUnverifiedPools && !this.acceptTerms) {
    //        this.showUnverifiedPoolsMessage();
    //        this.acceptTerms = true;
    //    }
    //}

    updatePools() {
        console.log('updatePools');
        console.log(this.tabType);
        if (this.tabType == "public") {
            this.allowedPools = this.sortByDesc(this.existPools.filter(pool => !this.allowedAddresses.includes(pool.poolAddress.toLowerCase())
                && (pool.isBlockPool && pool.finishTime > this.nowBlock
                    || !pool.isBlockPool && pool.finishTime > this.nowTimeStamp)), 'blockNumber');
            if (!this.acceptTerms) {
                this.showUnverifiedPoolsMessage();
                this.acceptTerms = true;
            }
        }
        else if (this.tabType == "verified") {
            this.allowedPools = this.sortByDesc(this.existPools.filter(pool => this.allowedAddresses.includes(pool.poolAddress.toLowerCase())
                && (pool.isBlockPool && pool.finishTime > this.nowBlock
                    || !pool.isBlockPool && pool.finishTime > this.nowTimeStamp)), 'blockNumber');
        }
        else if (this.tabType == "finished") {
            this.allowedPools = this.sortByDesc(this.existPools.filter(pool => pool.isBlockPool && pool.finishTime <= this.nowBlock
                || !pool.isBlockPool && pool.finishTime <= this.nowTimeStamp), 'blockNumber');
        }
    }

    search = (text$: Observable<string>) =>
        text$.pipe(
            debounceTime(200),
            distinctUntilChanged(),
            map(term => term.length < 2 ? []
                : this.allowedPools.filter(v => v.stakingTokenSymbol.toLowerCase().startsWith(term.toLocaleLowerCase())
                    || v.poolTokenSymbol.toLowerCase().startsWith(term.toLocaleLowerCase())
                    || v.stakingToken.toLowerCase().startsWith(term.toLocaleLowerCase())
                    || v.poolToken.toLowerCase().startsWith(term.toLocaleLowerCase())
                    || v.poolAddress.toLowerCase().startsWith(term.toLocaleLowerCase()))
                    .splice(0, 10))
        )
}