import { NgModule } from "@angular/core";

import * as ApiServiceProxies from "./service-proxies";

@NgModule({
    providers: [
        ApiServiceProxies.TransitEventServiceProxy,
        ApiServiceProxies.PaybackEventsServiceProxy,
        ApiServiceProxies.StakingPoolServiceProxy,
        ApiServiceProxies.IdoPoolServiceProxy
    ]
})
export class ServiceProxyModule { }
