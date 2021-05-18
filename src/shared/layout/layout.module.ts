import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { HttpModule } from "@angular/http";
import { RouterModule } from "@angular/router";
//import { ModalModule } from "ngx-bootstrap/modal";
import { HeaderComponent } from "shared/layout/header.component";
import { TranslateModule } from '@ngx-translate/core';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        //ModalModule,
        RouterModule,
        TranslateModule
    ],
    exports: [
        HeaderComponent
    ],
    declarations: [
        HeaderComponent
    ],
    providers: [
    ]
})
export class LayoutModule {
}