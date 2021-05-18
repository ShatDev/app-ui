import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { FormsModule } from "@angular/forms";

import { LayoutModule } from "shared/layout/layout.module";
//import { ModalModule } from "ngx-bootstrap/modal";
import { PipesModule } from "shared/pipes/pipes.module";
import { StakeComponent } from "./stake.component";
import { TranslateModule } from '@ngx-translate/core';
import { PoolViewComponent } from "./poolview.component";
import { CreatePoolComponent } from "./createPool.component";
import { NgbTypeaheadModule } from '@ng-bootstrap/ng-bootstrap';
import { MiningComponent } from "./mining.component";
import { CreateIDOComponent } from "./createIDO.component";
import { ListIDOComponent } from "./listIDO.component";
import { IDOViewComponent } from "./idoview.component";
import { IDOComponent } from "./idopage.component";
import { GuideComponent } from "./guide.component";
import { BridgeComponent } from "./bridge.component";
import { poolPageComponent } from "./poolPage.component";

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        //ModalModule.forRoot(),
        LayoutModule,
        PipesModule,
        TranslateModule,
        NgbTypeaheadModule,
        RouterModule.forChild([
            {
                path: "stake",
                component: StakeComponent
            },
            {
                path: "farming",
                component: MiningComponent
            },
            {
                path: "poolView",
                component: poolPageComponent
            },
            {
                path: "create-pool",
                component: CreatePoolComponent
            },
            {
                path: "create-ido",
                component: CreateIDOComponent
            },
            {
                path: "ido",
                component: ListIDOComponent
            },
            {
                path: "ido-detail",
                component: IDOComponent
            },
            {
                path: "bridge",
                component: BridgeComponent
            },
            {
                path: "guide",
                component: GuideComponent
            },
            
            { path: "**", redirectTo: "stake" }
        ])
    ],
    declarations: [
        StakeComponent,
        MiningComponent,
        poolPageComponent,
        CreatePoolComponent,
        CreateIDOComponent,
        ListIDOComponent,
        IDOComponent,
        PoolViewComponent,
        IDOViewComponent,
        BridgeComponent,
        GuideComponent
    ],
    providers: [
    ]
})
export class CustomerModule {
}