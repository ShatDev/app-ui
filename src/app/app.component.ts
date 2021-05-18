import { Component, OnInit } from "@angular/core";
import { tryCatch } from "@shared/raven-catch";

declare var jQuery: any;
declare var ga: any;

@Component({
    selector: "app-root",
    templateUrl: "./app.component.html",
    styleUrls: ["./app.component.css"]
})
export class AppComponent implements OnInit {
    ngOnInit(): void {
        //$('body').activity({
        //    'achieveTime': 60
        //    , 'testPeriod': 10
        //    , useMultiMode: 1
        //    , callBack: function (e) {
        //        tryCatch(ga, 'send', 'event', 'Activity', '60_sec');
        //    }
        //});
    }
}
