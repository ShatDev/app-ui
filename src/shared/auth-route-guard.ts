import { Injectable } from "@angular/core";
import {
    CanActivate, Router,
    ActivatedRouteSnapshot,
    RouterStateSnapshot,
    CanActivateChild
} from "@angular/router";
import { UserSessionProvider } from "shared/user-session-provider";

@Injectable()
export class AppRouteGuard implements CanActivate, CanActivateChild {

    constructor(private sessionProvider: UserSessionProvider, private router: Router) {
    }

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {

        return true;

        //if (!this.sessionProvider.isSessionStarted) {
        //    this.router.navigate(["/login"]);
        //    return false;
        //}

        //if (route.data != undefined && route.data["role"] != undefined) {
        //    var allowedRole: UserRole = route.data["role"];
        //    if (allowedRole === this.sessionProvider.role)
        //        return true;
        //}

        //if (this.sessionProvider.role == UserRole.User) {
        //    this.router.navigate(["/customer"]);
        //    return false;
        //}
        
        //return true;
    }

    canActivateChild(childRoute: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
        return this.canActivate(childRoute, state);
    }

}