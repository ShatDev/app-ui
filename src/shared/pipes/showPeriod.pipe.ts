import { Pipe, PipeTransform } from "@angular/core";
import { BigNumber } from "bignumber.js";
/**
 * Pipe для преобразования дат.
 * Используется ка workaround вместо date для Edge и IE (см. https://github.com/angular/angular/issues/9524)
 * !!! Формат отличается от обычного date: например, "DD.MM.YYYY" вместо "dd.MM.yyyy" (подробнее см. форматы библиотеки moment)
 */
@Pipe({
    name: "showPeriod"
})
export class ShowPeriod implements PipeTransform {
    transform(value: number): string {

        var timerViewDays = Math.floor(value / (3600 * 24));
        var timerViewHours = Math.floor(value % (3600 * 24) / 3600);
        var timerViewMin = Math.floor(value % 3600 / 60);
        var timerViewSec = Math.floor(value % 60);
        var stringData = "";
        if (timerViewDays)
            stringData += `${timerViewDays} d `;
        if (timerViewHours)
            stringData += `${timerViewHours} hours `;
        if (timerViewMin)
            stringData += `${timerViewMin} min `;
        if (timerViewSec)
            stringData += `${timerViewSec} ss `;
        return stringData;
    }
}