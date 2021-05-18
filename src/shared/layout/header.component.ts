import { Component, OnInit, ViewEncapsulation, EventEmitter, Output } from "@angular/core";
import { Router } from "@angular/router";
import { UserSessionProvider } from "shared/user-session-provider";
import { ComponentBase } from "shared/component-base";
import { EventBus } from "shared/event-bus";
import { TranslateService } from "@ngx-translate/core";
import { environment } from "../../environments/environment";
import { ChainError } from "../web3-service";
import { Chain } from "@angular/compiler";

declare const window: any;

@Component({
    templateUrl: "./header.component.html",
    selector: "header-strip",
    encapsulation: ViewEncapsulation.None
})

export class HeaderComponent extends ComponentBase implements OnInit {
    selectedLangName = "";
    constructor(private userSessionProvider: UserSessionProvider,
        private router: Router,
        private translate: TranslateService,
        private eventBus: EventBus) {
        super();
        var lang = userSessionProvider.getLang;
        if (!lang)
            lang = 'en';
        // this language will be used as a fallback when a translation isn't found in the current language
        translate.setDefaultLang('en');

        // the lang to use, if the lang isn't available, it will use the current loader to get them
        translate.use(lang);
        this.selectedLangName = lang;
        this.isLightMode = userSessionProvider.getIsLightMode;
        this.isBSC = userSessionProvider.getIsBSC;
    }

    @Output() loginEvent: EventEmitter<any> = new EventEmitter<any>();
    @Output() logoutEvent: EventEmitter<any> = new EventEmitter<any>();

    account: string;
    account_hide: string;
    isLightMode: boolean = false;
    isBSC: boolean = false;

    async ngOnInit() {
        if (this.userSessionProvider.username) {
            if (this.userSessionProvider.providerName == this.MetamaskName) {
                await this.unlockMetamask();
            }
            else if (this.userSessionProvider.providerName == this.WalletconnectName) {
                await this.unlockWalletconnect();
            }
            else {
                await this.unlockMetamask();
            }
        }
        if (this.isLightMode) {
            $('body').removeClass('dark');
        }

        this.eventBus.accountsChanged.subscribe(result => {
            console.log('accountsChanged subscription:' + result);
            location.reload();
        });

        this.eventBus.chainChanged.subscribe(chainId => {
            console.log('chainChanged subscription:' + chainId);
            this.showSuccess("Chain was changed");
            //alert('chainChanged subscription:' + chainId);

            if (chainId != this.chainId) {
                //if new chain is Ethereum 
                if (chainId === '0x01' || chainId === '0x2a') {
                    this.userSessionProvider.setETHNetwork();
                }
                //if new chain is BSC
                else if (chainId === '0x38' || chainId === '0x61') {
                    this.userSessionProvider.setBSCNetwork();
                }
            }

            //location.reload();
        });

        this.eventBus.walletDisconnect.subscribe(result => {
            console.log('walletDisconnect subscription:' + result);
            this.userSessionProvider.finishSession();
            //this.signOut(false);
        });
    }

    public changeLang(culture: string) {
        console.log('changeLang: ' + culture);
        this.userSessionProvider.setLang(culture);
        this.translate.use(culture);

        //var selectedLang = this.GetLangByKey(culture);
        //this.selectedLangName = selectedLang.name;

        this.selectedLangName = culture;
    }

    //private provider: any;


    public async unlockMetamaskClick() {
        await this.unlockMetamask(true);
        //$('#unlockWalletModal').modal('hide');
    }

    public async unlockWalletconnectClick() {
        await this.unlockWalletconnect(true);
        //$('#unlockWalletModal').modal('hide');
    }

    //async unlockWallet(): Promise<void> {
    public async unlockWalletconnect(reload = false) {

        try {
            var data = await this.web3Service.WalletConnect();
            this.account = data[0];
            this.userSessionProvider.startSession(this.account, this.WalletconnectName);
            this.loginEvent.emit(this.account);
            this.eventBus.loginEvent.emit(this.account);
            this.account_hide = this.account.substring(0, 4) + "..." + this.account.substring(this.account.length - 4, this.account.length);

            if (reload) {
                location.reload();
            }
        }
        catch (err) {
            console.error(err);
            //TODO: not warked instanceof ChainError
            if (err.name === "ChainError") {// instanceof ChainError) {
                this.showErrorModal(err.message);
            }
            //else {
            //this.showErrorModal("Error"); 
            //}
            this.userSessionProvider.finishSession();
        }
        return;
    }

    public async unlockMetamask(reload = false) {
        if (typeof window.ethereum == 'undefined') {
            this.translate.get('No provider was found').subscribe((langResp: string) => {
                this.showError(langResp);
            });
            return false;
        }

        let chainId = await window.ethereum.request({ method: 'eth_chainId' });
        console.log('chainId: ' + chainId);
        console.log('web3Service chainId: ' + this.web3Service.chainId);
        if (chainId === "0x1")
            chainId = "0x01";
        if (this.web3Service.chainId != chainId) {
            if (this.userSessionProvider.getIsBSC)
                this.showErrorModal(`Select BSC Network in your wallet.`);
            else
                this.showErrorModal(`Select Mainnet Network in your wallet.`);

            this.userSessionProvider.finishSession();
            return false;
        }

        //if (environment.production) {
        //    if (chainId != '0x01' && chainId != '0x1' && chainId != '0x38') {
        //        this.showErrorModal(`Select Mainnet or BSC Network in MetaMask.`);
        //        //this.translate.get('select_right_metamask_network').subscribe((langResp: string) => {
        //        //    this.showErrorModal(langResp);
        //        //});
        //        return false;
        //    }
        //}
        //else {
        //    console.log(chainId);
        //    if (chainId != '0x2a' && chainId != '0x61') {
        //        this.showErrorModal(`Select Kovan or BSC Test Network in MetaMask.`);
        //        return false;
        //    }
        //}



        window.ethereum.enable().then((data) => {
            console.log("enabled");
            console.log(data);

            if (data.length > 0) {
                this.account = data[0];
                this.userSessionProvider.startSession(this.account, this.MetamaskName);
                this.loginEvent.emit(this.account);
                this.eventBus.loginEvent.emit(this.account);
                this.account_hide = this.account.substring(0, 4) + "..." + this.account.substring(this.account.length - 4, this.account.length);

                //TOOD: that = this;
                var that = this;
                if (window.ethereum) {
                    window.ethereum.on('accountsChanged', function (accounts) {
                        console.log('accountsChanged');
                        console.log(accounts);
                        location.reload();
                    })
                    window.ethereum.on('chainChanged', function (chainId) {
                        console.log('chainChanged');
                        console.log(chainId);
                        if (chainId === "0x1")
                            chainId = "0x01";
                        if (chainId != that.chainId) {
                            //if new chain is Ethereum 
                            if (chainId === '0x01' || chainId === '0x2a') {
                                that.userSessionProvider.setETHNetwork();
                            }
                            //if new chain is BSC
                            else if (chainId === '0x38' || chainId === '0x61') {
                                that.userSessionProvider.setBSCNetwork();
                            }
                        }

                        location.reload();
                    })
                }

                //TODO: remove reload, add eventBus
                if (reload) {
                    location.reload();
                }
            }
        }, (reason) => {
            console.log("My Permission to connect to Metamask was denied");
            console.log(reason);
        })
    }

    async signOutClick() {
        await this.signOut();
        this.eventBus.logoutEvent.emit(true);
    }

    async signOut() {
        console.log('signOut');
        this.userSessionProvider.finishSession();
        await this.web3Service.WalletDisconnect();
        location.reload();
        return;
        this.account_hide = "";
        this.account = "";
        this.logoutEvent.emit();
        //try {
        //    window.web3.eth.clearSubscriptions();
        //}
        //catch (error) {
        //}
    }

    setDarkMode(): void {
        this.isLightMode = false;
        this.userSessionProvider.setDarkMode();
        $('body').addClass('dark');
    }

    setLightMode(): void {
        this.isLightMode = true;
        this.userSessionProvider.setLightMode();
        $('body').removeClass('dark');
    }


    selectETHChain(event): void {
        event.preventDefault();
        if (this.isETHChain) {
            return;
        }
        if (this.account) {
            this.showInfoModal("Change network to Ethereum Mainnet in your wallet");
        }
        else {
            this.isBSC = false;
            this.userSessionProvider.setETHNetwork();
            location.reload();
        }
    }

    //TODO: move to base class
    async selectBSCChain(event): Promise<boolean> {
        event.preventDefault();
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