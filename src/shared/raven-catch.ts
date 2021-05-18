import * as Raven from "raven-js";
import {ErrorHandler} from "@angular/core";
import {environment} from "../environments/environment";

export class RavenErrorHandler implements ErrorHandler {
  handleError(err:any) : void {
    Raven.captureException(err);
    if (environment.logging) console.error(err);
  }
}

export function tryCatchRaven(f, ...args) {
    try {
        f(...args);
    } catch (err) {
        Raven.captureException(err);
        if (environment.logging) console.error(err);
    }
}


export function tryCatch(f, ...args) {
    try {
        f(...args);
    } catch (err) {
    }
}