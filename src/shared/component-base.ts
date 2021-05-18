import swal from "sweetalert2"
import * as moment from 'moment';
declare var toastr;
import stakeMaster from 'assets/abi/StakeMaster.json';
import stakingPool from 'assets/abi/StakingPool.json';
import stakingPoolV2 from 'assets/abi/StakingPoolV2.json';
import IERC20 from 'assets/abi/IERC20.json';
import ERC20Basic from 'assets/abi/ERC20Basic.json';
import UniswapV2Factory from 'assets/abi/UniswapV2Factory.json';
import UniswapV2Pair from 'assets/abi/UniswapV2Pair.json';
import UniswapV2Router from 'assets/abi/UniswapV2Router.json';
import idoMaster from 'assets/abi/IDOMaster.json';
import idoCreator from 'assets/abi/IDOCreator.json';

import idoPool from 'assets/abi/IDOPool.json';

import bscTransit from 'assets/abi/BSCTosDisTransit.json';
import ethTransit from 'assets/abi/ETHTosDisTransit.json';

import BigNumber from "bignumber.js";
import { environment } from "../environments/environment";
import { injector } from "main";
import { Web3Service } from "./web3-service";

import oldPoolsBSC from 'assets/pools/poolsBSC.json';
import oldPoolsETH from 'assets/pools/poolsETH.json';
import { StakingPoolDTO } from "../service-proxies/service-proxies";


export abstract class ComponentBase {

    public MetamaskName: string = "metamask";
    public WalletconnectName: string = "walletconnect";

    public readonly disDecimals: number = 18;
    public readonly disSymbol: string = "DIS";

    public isWeb3Disabled: boolean = false;

    public longTimeUpdate: number = 60000;
    public expectedBlockTime: number = 30000;

    public readonly stakeMasterAbi: any;
    public readonly stakingPoolAbi: any;
    public readonly stakingPoolAbiV2: any;
    public readonly IERC20Abi: any;
    public readonly ERC20BasicAbi: any;
    public readonly UniswapV2FactoryAbi: any;
    public readonly UniswapV2PairAbi: any;
    public readonly UniswapV2RouterAbi: any;
    public readonly idoMasterAbi: any;
    public readonly idoCreatorAbi: any;
    public readonly idoPoolAbi: any;
    public readonly bscTransitAbi: any;
    public readonly ethTransitAbi: any;


    public readonly lpTokenSymbols: string[] = ["UNI-V2", "Cake-LP", "BLP", "SLP"];


    //TODO: chack network
    public get chainId(): string {
        return this.web3Service.chainId;
    };

    public get chainIdNumber(): number {
        return parseInt(this.web3Service.chainId);
    };

    public web3Service: Web3Service;

    constructor() {
        this.web3Service = injector.get(Web3Service);
        this.stakeMasterAbi = stakeMaster.abi;
        this.stakingPoolAbi = stakingPool.abi;
        this.stakingPoolAbiV2 = stakingPoolV2.abi;
        this.IERC20Abi = IERC20.abi;
        this.ERC20BasicAbi = ERC20Basic.abi;
        this.UniswapV2FactoryAbi = UniswapV2Factory.abi;
        this.UniswapV2PairAbi = UniswapV2Pair.abi;
        this.UniswapV2RouterAbi = UniswapV2Router.abi;
        this.idoMasterAbi = idoMaster.abi;
        this.idoCreatorAbi = idoCreator.abi;
        this.idoPoolAbi = idoPool.abi;

        this.bscTransitAbi = bscTransit.abi;
        this.ethTransitAbi = ethTransit.abi;
    }


    public get isBNBChain(): boolean {
        //                                  testnet bsc
        if (this.chainId === '0x38' || this.chainId === '0x61') {
            return true;
        }
        return false;
    }


    public get isETHChain(): boolean {
        if (this.chainId === '0x01' || this.chainId === '0x1' || this.chainId === '0x2a') {
            return true;
        }
        return false;
    }

    public get chainSymbol(): string {
        if (this.chainId === '0x01' || this.chainId === '0x1' || this.chainId === '0x2a') {
            return "ETH";
        }
        //                                  testnet bsc
        else if (this.chainId === '0x38' || this.chainId === '0x61') {
            return "BNB";
        }
    }

    

    public get getDisAddress(): string {
        //                             testnet kovan
        if (this.chainId === '0x01' || this.chainId === '0x1' || this.chainId === '0x2a') {
            return "0x220b71671b649c03714da9c621285943f3cbcdc6"
        }
        //                                  testnet bsc
        else if (this.chainId === '0x38' || this.chainId === '0x61') {
            return "0x57efFdE2759b68d86C544e88F7977e3314144859"
        }
    }

    public get stakeMasterAddress(): string {
        //                             testnet kovan
        if (this.chainId === '0x01' || this.chainId === '0x1' || this.chainId === '0x2a') {
            return environment.eth.stakeMasterAddress
        }
        //                                  testnet bsc
        else if (this.chainId === '0x38' || this.chainId === '0x61') {
            return environment.bsc.stakeMasterAddress
        }
    }

    public get stakeStartBlock(): string {
        //                             testnet kovan
        if (this.chainId === '0x01' || this.chainId === '0x1' || this.chainId === '0x2a') {
            return environment.eth.stakeStartBlock
        }
        //                                  testnet bsc
        else if (this.chainId === '0x38' || this.chainId === '0x61') {
            return environment.bsc.stakeStartBlock
        }
    }


    public get idoStartBlock(): string {
        //                             testnet kovan
        if (this.chainId === '0x01' || this.chainId === '0x1' || this.chainId === '0x2a') {
            return environment.eth.idoStartBlock
        }
        //                                  testnet bsc
        else if (this.chainId === '0x38' || this.chainId === '0x61') {
            return environment.bsc.idoStartBlock
        }
    }
    

    public get UniswapV2Factory(): string {
        //                             testnet kovan
        if (this.chainId === '0x01' || this.chainId === '0x1' || this.chainId === '0x2a') {
            return environment.eth.UniswapV2Factory
        }
        //                                  testnet bsc
        else if (this.chainId === '0x38' || this.chainId === '0x61') {
            return environment.bsc.UniswapV2Factory
        }
    }

    public get UniswapV2Router02(): string {
        //                             testnet kovan
        if (this.chainId === '0x01' || this.chainId === '0x1' || this.chainId === '0x2a') {
            return environment.eth.UniswapV2Router02
        }
        //                                  testnet bsc
        else if (this.chainId === '0x38' || this.chainId === '0x61') {
            return environment.bsc.UniswapV2Router02
        }
    }

    public get WETHAddress(): string {
        //                             testnet kovan
        if (this.chainId === '0x01' || this.chainId === '0x1' || this.chainId === '0x2a') {
            return environment.eth.WETHAddress
        }
        //                                  testnet bsc
        else if (this.chainId === '0x38' || this.chainId === '0x61') {
            return environment.bsc.WETHAddress
        }
    }


    public get idoMasterAddress(): string {
        //                             testnet kovan
        if (this.chainId === '0x01' || this.chainId === '0x1' || this.chainId === '0x2a') {
            return environment.eth.idoMasterAddress
        }
        //                                  testnet bsc
        else if (this.chainId === '0x38' || this.chainId === '0x61') {
            return environment.bsc.idoMasterAddress
        }
    }

    public get bridgeMasterAddress(): string {
        //                             testnet kovan
        if (this.chainId === '0x01' || this.chainId === '0x1' || this.chainId === '0x2a') {
            return environment.eth.bridgeAddress
        }
        //                                  testnet bsc
        else if (this.chainId === '0x38' || this.chainId === '0x61') {
            return environment.bsc.bridgeAddress
        }
    }

    public get explorerURL(): string {
        //                             testnet kovan
        if (this.chainId === '0x01' || this.chainId === '0x1' || this.chainId === '0x2a') {
            return environment.eth.explorerURL
        }
        //                                  testnet bsc
        else if (this.chainId === '0x38' || this.chainId === '0x61') {
            return environment.bsc.explorerURL
        }
    }


    /**
     * Блокирует UI, отображая бизи-индикатор
     */
    public blockUI() {
        App.blockUI({ animate: true });
    }

    /**
     * Выполняет разблокировку UI, скрывая бизи-индикатор
     */
    public unblockUI() {
        App.unblockUI();
    }

    /**
     * Показывает всплывающее сообщение об ошибке
     * @param message Текст сообщения
     */
    public showError(message: string) {
        toastr.error(message);
    }

    /**
     * Показывает сообщение об ошибке в модальном окне
     * @param message Текст сообщения
     */
    public showErrorModal(message: string) {
        swal.fire({
            text: message,
            icon: "error"
        });
    }

    /**
     * Показывает всплывающее сообщение с предупреждением
     * @param message Текст сообщения
     */
    public showWarning(message: string) {
        toastr.warning(message);
    }

    /**
     * Показывает сообщение с предупреждением в модальном окне
     * @param message Текст сообщения
     */
    public showWarningModal(message: string) {
        swal.fire({
            text: message,
            icon: 'warning'
        });
    }

    /**
     * Показывает всплывающее сообщение с информацией
     * @param message Текст сообщения
     */
    public showInfo(message: string) {
        toastr.info(message);
    }

    /**
     * Показывает сообщение с информацией в модальном окне
     * @param message Текст сообщения
     */
    public showInfoModal(message: string) {
        swal.fire({
            text: message,
            icon: "info"
        });
    }

    /**
     * Показывает всплывающее сообщение об успехе
     * @param message Текст сообщения
     */
    public showSuccess(message: string) {
        toastr.success(message);
    }

    /**
     * Показывает сообщение об ошибке в модальном окне
     * @param message Текст сообщения
     */
    public showSuccessModal(message: string) {
        swal.fire({
            text: message,
            icon: "success"
        });
    }

    public showInfoHTMLModal(message: string, confirmButtonText: string) {
        swal.fire({
            html: message,
            icon: "info",
            confirmButtonText: confirmButtonText
        });
    }

    public showWarningHTMLModal(message: string, confirmButtonText: string) {
        swal.fire({
            html: message,
            icon: "warning",
            confirmButtonText: confirmButtonText,
            allowEscapeKey: false,
            allowOutsideClick: false
        });
    }

    public showUnverifiedPoolsMessage() {
        var stringHTML = '<b>BE CAREFUL WHILE STAKING</b> <p>Anyone can create a token, including creating fake tokens that claim to represent projects. Thus, anyone can create a pool on TosDis and offer high APYs.</p><p>If you are staking, please do your due diligence before purchasing and staking the token.</p>';
        this.showWarningHTMLModal(stringHTML, "Accept");
    }


    public showUnverifiedIDOsMessage() {
        var stringHTML = '<p>Anyone can create a token, including fake tokens that claim to represent projects. Thus, anyone can create an IDO pool and conduct token sales.</p><p>If you are taking part in any token sale, please do your due diligence before contributing to any pool on TosLab.</p>';
        this.showWarningHTMLModal(stringHTML, "Accept");
    }
                      
    showTransactionSumbited(txId: string) {
        let subResp = 'Transaction Submitted';
        let closeResp = 'Close';
        let viewResp = 'View on Etherscan';
        if (this.isBNBChain)
            viewResp = 'View on BscScan';
        var stringHTML = `<p class="trans_submitted">${subResp}</p><a href="${this.explorerURL}${txId}" target="_blank" class="view_etherscan">${viewResp}</a>`;

        this.showInfoHTMLModal(stringHTML, closeResp);
        //translate.get('Transaction Submitted')
        //    .subscribe((subResp: string) => {
        //        translate.get('View on Etherscan')
        //            .subscribe((viewResp: string) => {
        //                translate.get('Close')
        //                    .subscribe((closeResp: string) => {
        //                        var stringHTML = `<p class="trans_submitted">${subResp}</p><a href="https://etherscan.io/tx/${txId}" target="_blank" class="view_etherscan">${viewResp}</a>`;

        //                        this.showInfoHTMLModal(stringHTML, closeResp);
        //                    });
        //            });
        //    });
    }


    //public showConfirm(message: string): Promise<any> {
    //return swal({
    //    text: message,
    //    type: "question",
    //    showCancelButton: true,
    //    confirmButtonColor: "#22b794",
    //    cancelButtonColor: "#d33",
    //    confirmButtonText: "Yes",
    //    cancelButtonText: "No",
    //    buttonsStyling: true
    //});
    //}

    //public getCookie(name: string) {
    //    let ca: Array<string> = document.cookie.split(';');
    //    let caLen: number = ca.length;
    //    let cookieName = `${name}=`;
    //    let c: string;

    //    for (let i: number = 0; i < caLen; i += 1) {
    //        c = ca[i].replace(/^\s+/g, '');
    //        if (c.indexOf(cookieName) == 0) {
    //            return c.substring(cookieName.length, c.length);
    //        }
    //    }
    //    return '';
    //}

    //public setCookie(domain: string, cookieName: string, cookieValue) {
    //    var today = new Date();
    //    var expiry = new Date(new Date().setDate(today.getDate() + 365));
    //    document.cookie = `${cookieName}=${cookieValue};path=/;domain=${domain}; expires=${expiry.toUTCString()}`;
    //}

    //public getTokenName(): string {
    //    return environment.tokenName;
    //}

    /**
  * Создаёт корректный moment для даты (для избежания проблем на сервере с часовым поясом)
  * @param date
  */
    toMomentDate(date: Date): moment.Moment | undefined {
        if (!date)
            return undefined;
        let momentDate = moment(date);
        return moment.utc(momentDate.format("DD.MM.YYYY"), "DD.MM.YYYY");
    }

    toNumberFromWei(input: string, decimals: number) {
        return new BigNumber(input).shiftedBy(-decimals).toNumber()
    }

    //decimalPlaces: number, roundingMode?: BigNumber.RoundingMode
    toNumberFromWeiFixed(input: string, decimals: number, decimalPlaces: number = 2, roundingMode: BigNumber.RoundingMode = 1) {
        return parseFloat(new BigNumber(input).shiftedBy(-decimals).toFixed(decimalPlaces, roundingMode))
    }

    getOldPools() {
        if (environment.production) {
            if (this.isBNBChain)
                return this.getOldBSCPools();
            else if (this.isETHChain)
                return this.getOldETHPools();
        }
        else return [];
    }

    getOldBSCPools() {
        return oldPoolsBSC;
    }

    getOldETHPools() {
        return oldPoolsETH;
    }




    public async ConvertPoolDTO(pool: any): Promise<StakingPoolDTO> {

        //this.transactionHash = _data["transactionHash"];
        //this.chainId = _data["chainId"];
        //this.blockNumber = _data["blockNumber"];
        //this.ownerAddress = _data["ownerAddress"];
        //this.poolAddress = _data["poolAddress"];
        //this.stakingToken = _data["stakingToken"];
        //this.poolToken = _data["poolToken"];
        //this.startTime = _data["startTime"];
        //this.finishTime = _data["finishTime"];
        //this.poolTokenAmount = _data["poolTokenAmount"];
        //this.stakingTokenDecimals = _data["stakingTokenDecimals"];
        //this.stakingTokenName = _data["stakingTokenName"];
        //this.stakingTokenSymbol = _data["stakingTokenSymbol"];
        //this.poolTokenDecimals = _data["poolTokenDecimals"];
        //this.poolTokenName = _data["poolTokenName"];
        //this.poolTokenSymbol = _data["poolTokenSymbol"];


        //    "isBlockPool": true,
        //"address": "0x57b15bcF4b1604518B910aA6FA1F6c78a0813E21",
        //"blockNumber": 5126318,
        //"transactionHash": "0x849ae943f38baaa1fd10d68490c6456f708f6081e2b95c189f4440cbddb5692e",
        //"transactionIndex": 46,
        //"blockHash": "0xf320dfd9c82129e1de68e1574515822a41866b30a9d298426ac4e6b7e53992c6",
        //"logIndex": 224,
        //"removed": false,
        //"id": "log_d1c9f5b6",
        //"returnValues": {
        //  "0": "0x2D22436025b861cfa6f9A627eE13dBc246a35cb5",
        //  "1": "0xDfe77eb152D20eCF3980D3d120490E6BFE370CB9",
        //  "2": "0x4B0F1812e5Df2A09796481Ff14017e6005508003",
        //  "3": "0x4B0F1812e5Df2A09796481Ff14017e6005508003",
        //  "4": "5126400",
        //  "5": "5176400",
        //  "6": "10000000000000000000",
        //  "owner": "0x2D22436025b861cfa6f9A627eE13dBc246a35cb5",
        //  "pool": "0xDfe77eb152D20eCF3980D3d120490E6BFE370CB9",
        //  "stakingToken": "0x4B0F1812e5Df2A09796481Ff14017e6005508003",
        //  "poolToken": "0x4B0F1812e5Df2A09796481Ff14017e6005508003",
        //  "startBlock": "5126400",
        //  "finishBlock": "5176400",
        //  "poolTokenAmount": "10000000000000000000"
        //},

        var itemDTO = new StakingPoolDTO();
        itemDTO.transactionHash = pool.transactionHash;
        //TODO: set chainId
        //itemDTO.chainId = 0;
        itemDTO.blockNumber = pool.blockNumber;
        //TODO: set ownerAddress
        //itemDTO.ownerAddress = _data["ownerAddress"];
        itemDTO.poolAddress = pool.returnValues.pool;
        itemDTO.stakingToken = pool.returnValues.stakingToken;
        itemDTO.poolToken = pool.returnValues.poolToken;


        if (pool.isBlockPool) {
            itemDTO.isBlockPool = true;
            itemDTO.startTime = parseInt( pool.returnValues.startBlock);
            itemDTO.finishTime = parseInt(pool.returnValues.finishBlock);
        }
        else {
            itemDTO.isBlockPool = false;
            itemDTO.startTime = pool.returnValues.startTime;
            itemDTO.finishTime = pool.returnValues.finishTime;
        }

        itemDTO.poolTokenAmount = pool.returnValues.poolTokenAmount;


        //itemDTO.stakingTokenDecimals = _data["stakingTokenDecimals"];
        //itemDTO.stakingTokenName = _data["stakingTokenName"];
        itemDTO.stakingTokenSymbol = await this.web3Service.GetContractSymbol(pool.returnValues.stakingToken);
        //itemDTO.poolTokenDecimals = _data["poolTokenDecimals"];
        //itemDTO.poolTokenName = _data["poolTokenName"];
        itemDTO.poolTokenSymbol = await this.web3Service.GetContractSymbol(pool.returnValues.poolToken);

        return itemDTO;
    }

    //#region isMobile

    Opera(): boolean {
        return navigator.userAgent.match(/Opera Mini/i) != null;
    }
    Android(): boolean {
        return navigator.userAgent.match(/Android/i) != null;
    }
    iOS(): boolean {
        return navigator.userAgent.match(/iPhone|iPad|iPod/i) != null;
    }
    Windows(): boolean {
        return navigator.userAgent.match(/IEMobile/i) != null || navigator.userAgent.match(/WPDesktop/i) != null;
    }

    isMobile(): boolean {
        return (this.Android() || this.iOS() || this.Opera() || this.Windows());
    }
    //#endregion isMobile


    sortByDesc(items: any, prop: string) {
        return items.sort((a: any, b: any) => a[prop] > b[prop] ? -1 : a[prop] === b[prop] ? -1 : 0);
    }

    sortBy(items: any, prop: string) {
        return items.sort((a: any, b: any) => a[prop] > b[prop] ? -1 : a[prop] === b[prop] ? 0 : -1);
    }
}