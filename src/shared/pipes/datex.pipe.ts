import { Pipe, PipeTransform } from "@angular/core";
import * as moment from "moment";

/**
 * Pipe для преобразования дат.
 * Используется ка workaround вместо date для Edge и IE (см. https://github.com/angular/angular/issues/9524)
 * !!! Формат отличается от обычного date: например, "DD.MM.YYYY" вместо "dd.MM.yyyy" (подробнее см. форматы библиотеки moment)
 */
@Pipe({
  name: "datex"
})
export class DatexPipe implements PipeTransform {
  transform(value: any, format: string = ""): string {
    // Try and parse the passed value.
    var momentDate = moment(value);

    // If moment didn't understand the value, return it unformatted.
    if (!momentDate.isValid()) return value;

    // Otherwise, return the date formatted as requested.
    return momentDate.format(format);
  }
}