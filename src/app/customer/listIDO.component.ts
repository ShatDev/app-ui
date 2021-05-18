import { Component, OnInit, OnDestroy } from "@angular/core";
import { slideFromBottom } from "shared/animation";
import { ComponentBase } from "shared/component-base";
import { EventBus } from "shared/event-bus";
import { ActivatedRoute } from '@angular/router';
import { environment } from "environments/environment";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { debounceTime, distinctUntilChanged, map } from 'rxjs/operators';

@Component({
    templateUrl: "listIDO.component.html",
    animations: [slideFromBottom()]
})

export class ListIDOComponent extends ComponentBase implements OnInit, OnDestroy {

    constructor(private http: HttpClient,
        private eventBus: EventBus) {
        super();
    }

    account: string;

    public tabType: string = "active";
    public nowTimeStamp: number = Math.floor(Date.now() / 1000);

    existPools: any = new Array();
    allowedPools: any = new Array();
    allowedAddresses: string[] = [];
    poolsConfig: any;

    public selectedPoolAddress: string;

    public loadingData: boolean = false;

    //private urlPoolAddress: string;
    //private urlStakingAddress: string;
    //private urlPoolTokenAddress: string;

    public acceptTerms: boolean = false;

    async ngOnInit() {
        this.eventBus.loginEvent.subscribe(result => {
            console.log('loginEvent subscription:' + result);
            this.eventLogin(result);
        });

        this.eventBus.logoutEvent.subscribe(result => {
            console.log('logoutEvent subscription:' + result);
            this.eventLogout();
        });

        if (!this.acceptTerms) {
            this.showUnverifiedIDOsMessage();
            this.acceptTerms = true;
        }

        //this.route
        //    .queryParams
        //    .subscribe(params => {
        //        this.urlPoolAddress = params['pool'];
        //        this.urlStakingAddress = params['stakingToken'];
        //        this.urlPoolTokenAddress = params['poolToken'];
        //        console.log(`urlPoolAddress ${this.urlPoolAddress}`);
        //        console.log(`urlStakingAddress ${this.urlStakingAddress}`);
        //        console.log(`urlPoolTokenAddress ${this.urlPoolTokenAddress}`);
        //    });

        await this.web3Service.initWeb3();
        if (this.web3Service.web3) {
            console.log('idoMasterAddress: ' + this.idoMasterAddress);
            //TODO: unlock getPools();
            //this.getPools();
        }
    }

    async ngOnDestroy() {
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
        //this.updateAllData();
    }

    eventLogout(): void {
        console.log('signOut')
        this.account = "";
        //this.existPools = new Array();
        //this.allowedPools = new Array();

        //this.web3.eth.clearSubscriptions((error, resp) => {
        //    console.log('clearSubscriptions');
        //    console.log(resp);
        //    console.error(error);
        //});
    }


    getPools(): void {
        this.loadingData = true;
        this.nowTimeStamp = Math.floor(Date.now() / 1000);
        this.getAllowedPools()
            .subscribe(result => {
                console.log(result);
                this.poolsConfig = result;
                this.allowedAddresses = result.verifiedPoolAddresses.map(x => x.toLowerCase());

                var web3ForEvents = this.web3Service.getWeb3ForEvents;
                var masterContract = new web3ForEvents.eth.Contract(this.idoMasterAbi, this.idoMasterAddress);
                masterContract.getPastEvents("IDOCreated", { fromBlock: this.stakeStartBlock, toBlock: 'latest' }).then((resp) => {
                    console.log('IDOCreated');
                    console.log(resp);
                    this.loadingData = false;
                    for (let i = 0; i < resp.length; i++) {
                        let event: any = resp[i];
                        this.web3Service.GetContractSymbol(event.returnValues.rewardToken).then((resp) => {
                            this.existPools.unshift(event);
                            event.rewardSymbol = resp;
                            if (event.returnValues.startTimestamp < this.nowTimeStamp && event.returnValues.finishTimestamp > this.nowTimeStamp)
                                this.allowedPools.unshift(event);
                        });
                    }
                })
            });
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


    updatePools() {

        console.log('updatePools');
        console.log(this.tabType);


        if (this.tabType == "upcoming") {
            this.allowedPools = this.existPools.filter(pool => pool.returnValues.startTimestamp > this.nowTimeStamp);
        }
        else if (this.tabType == "active") {
            this.allowedPools = this.existPools.filter(pool => pool.returnValues.startTimestamp < this.nowTimeStamp && pool.returnValues.finishTimestamp > this.nowTimeStamp);
        }
        else if (this.tabType == "finished") {
            this.allowedPools = this.existPools.filter(pool => pool.returnValues.finishTimestamp <= this.nowTimeStamp);
        }

        //if (this.showUnverifiedPools) {
        //    this.allowedPools = this.existPools;
        //}
        //else {
        //    this.allowedPools = this.existPools.filter(pool => this.allowedAddresses.includes(pool.returnValues.pool.toLowerCase()));
        //}
    }

    search = (text$: Observable<string>) =>
        text$.pipe(
            debounceTime(200),
            distinctUntilChanged(),
            map(term => term.length < 2 ? []
                : this.allowedPools.filter(v => v.stakingTokenSymbol.toLowerCase().startsWith(term.toLocaleLowerCase())
                    || v.poolTokenSymbol.toLowerCase().startsWith(term.toLocaleLowerCase())
                    || v.returnValues.stakingToken.toLowerCase().startsWith(term.toLocaleLowerCase())
                    || v.returnValues.poolToken.toLowerCase().startsWith(term.toLocaleLowerCase())
                    || v.returnValues.pool.toLowerCase().startsWith(term.toLocaleLowerCase()))
                    .splice(0, 10))
        )
}