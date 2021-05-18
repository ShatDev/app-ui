import { Component, OnInit, OnDestroy } from "@angular/core";
import { slideFromBottom } from "shared/animation";
import { ComponentBase } from "shared/component-base";

@Component({
    templateUrl: "guide.component.html",
    animations: [slideFromBottom()]
})

export class GuideComponent extends ComponentBase implements OnInit, OnDestroy {
    constructor() {
        super();
    }

    async ngOnInit() {
    
    }

    async ngOnDestroy() {
    
    }
}