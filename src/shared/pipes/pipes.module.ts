import { NgModule } from "@angular/core";
import { DatexPipe } from "shared/pipes/datex.pipe";
import { ShiftDecimals } from "./shiftDecimals.pipe";
import { ShortAddressPipe } from "./shortAddress.pipe";
import { ShowPeriod } from "./showPeriod.pipe";
import { SortByPipe } from "./SortByPipe .pipe";
import { YesNoPipe } from "./YesNo.pipe";

@NgModule({
  exports: [
        DatexPipe,
        SortByPipe,
        ShortAddressPipe,
        YesNoPipe,
        ShiftDecimals,
        ShowPeriod
  ],
  declarations: [
      DatexPipe,
      SortByPipe,
      ShortAddressPipe,
      YesNoPipe,
      ShiftDecimals,
      ShowPeriod
  ],
  providers: [
  ]
})
export class PipesModule {
}