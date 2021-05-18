import { enableProdMode, Injector } from "@angular/core";
import { platformBrowserDynamic } from "@angular/platform-browser-dynamic";

import { AppModule } from "./app/app.module";
import { environment } from "./environments/environment";
import * as moment from "moment";
declare var toastr;

/**
* Глобальный иньектор приложения
*/
export var injector: Injector;

// настраиваем toastr
toastr.options.positionClass = "toast-bottom-right";

// устанавливаем локаль для moment.js
moment.locale("ru");

if (environment.production) {
    enableProdMode();
}

platformBrowserDynamic().bootstrapModule(AppModule).then(ngModuletRef => {
    injector = ngModuletRef.injector;
});
