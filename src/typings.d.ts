///<reference path="../node_modules/@types/jquery/index.d.ts"/>

/* SystemJS module definition */
declare var module: NodeModule;
interface NodeModule {
  id: string;
}

declare var App: any; //Related to Metronic
declare var Layout: any; //Related to Metronic

/**
 * jQuery components
 */

interface JQuery {
    activity(...any): any;
    modal(...any): any;
}
