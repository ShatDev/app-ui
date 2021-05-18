import * as Raven from 'raven-js';
import { BrowserModule } from "@angular/platform-browser";
import { ErrorHandler, NgModule } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { HttpModule } from "@angular/http";
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { RouterModule } from "@angular/router";
import { HashLocationStrategy, LocationStrategy } from '@angular/common';
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { AppComponent } from "./app.component";
import { AppRouteGuard } from "shared/auth-route-guard";
import { UserSessionProvider } from "shared/user-session-provider";
import { environment } from "environments/environment";
import { BrowserStorageProvider } from "@shared/browser-storage-provider";
import { RavenErrorHandler } from "@shared/raven-catch";
import { ServiceProxyModule } from "service-proxies/service-proxy.module";
import { API_BASE_URL } from "service-proxies/service-proxies";

import { ClipboardModule } from 'ngx-clipboard';

import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { EventBus } from '../shared/event-bus';
import { Web3Service } from '../shared/web3-service';


//if (environment.sentryKey && environment.sentryProject) {
//    Raven
//        .config(`https://${environment.sentryKey}@sentry.io/${environment.sentryProject}`)
//        .install();
//}

// AoT requires an exported function for factories
export function createTranslateLoader(http: HttpClient) {
    return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}



@NgModule({
    declarations: [
        AppComponent
    ],
    imports: [
        BrowserModule,
        FormsModule,
        HttpModule,
        HttpClientModule,
        ServiceProxyModule, 
        TranslateModule.forRoot({
            loader: {
                provide: TranslateLoader,
                useFactory: createTranslateLoader,
                deps: [HttpClient]
            }
        }),
        BrowserAnimationsModule,
        ClipboardModule,
        RouterModule.forRoot([
           //{
           //     path: "",
           //     component: AppComponent,
           //     canActivate: [AppRouteGuard]
           // },
            {
                path: "",
                loadChildren: "app/customer/customer.module#CustomerModule", //Lazy load customer module
                data: { preload: true },
                canActivate: [AppRouteGuard],
                canActivateChild: [AppRouteGuard]
            },
            { path: "**", redirectTo: ""}], { useHash: false })
    ],
    exports: [TranslateModule],
    providers: [
        AppRouteGuard,
        BrowserStorageProvider,
        UserSessionProvider,
        EventBus,
        Web3Service,
        { provide: API_BASE_URL, useValue: environment.remoteServiceBaseUrl } // выставляем url web api для проксей
        // { provide: LocationStrategy ,useClass: HashLocationStrategy },
        //{ provide: ErrorHandler, useClass: RavenErrorHandler }
    ],
    bootstrap: [AppComponent]
})
export class AppModule { }
