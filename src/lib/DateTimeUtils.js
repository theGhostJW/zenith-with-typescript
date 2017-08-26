// @flow

import moment from 'moment';
import { debug } from '../lib/SysUtils';

export const LOG_TO_SEC_FORMAT = "YYYY-MM-DD HH:mm:ss";
export const LOG_FILE_MS_SEC_FORMAT = "YYYY-MM-DD HH-mm-ss-SSS";

export function testFormatter(year: number, month: number, day: number, hr24: number = 0, minute: number = 0, second: number = 0, milliSecond: number = 0, formatString: string): string {
  // moment zero bases months WTF
  return time(year, month, day, hr24, minute, second, milliSecond).format(formatString);
}

export function nowAsLogFormat(): string {
  return nowFormatted(LOG_TO_SEC_FORMAT);
}

export function nowFormatted(formatString: string): string {
  return moment().format(formatString);
}

export function nowFileFormatted(): string {
  return moment().format(LOG_FILE_MS_SEC_FORMAT);
}

export function now(): moment$Moment {
  return moment();
}

export function today(): moment$Moment {
  return moment().startOf('date');
}

export function time(year: number, month: number, day: number, hr24: number = 0, minute: number = 0, second: number = 0, milliSecond: number = 0): moment$Moment {
  // moment zero bases months WTF
  return moment({y: year, M: (month - 1), d: day, h: hr24, m: minute, s: second, ms: milliSecond});
}

export const date = (year: number, month: number, day: number) => time(year, month, day);

export const datePlus = (base: moment$Moment, daysToAdd: number) => base.add(daysToAdd, 'days');

export const todayPlus = (daysToAdd: number) => datePlus(today(), daysToAdd);
