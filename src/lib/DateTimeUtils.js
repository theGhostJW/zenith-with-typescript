// @flow

import moment from 'moment';
import { debug } from '../lib/SysUtils';
import {  } from '../lib/StringUtils';

export const LOG_TO_SEC_FORMAT = "YYYY-MM-DD HH:mm:ss";
export const LOG_FILE_MS_SEC_FORMAT = "YYYY-MM-DD HH-mm-ss-SSS";
export const SHORT_DATE_TIME = "DD/MM/YYYY HH:mm:ss";
export const DATE_TIME_HYPHENATED_MS = "YYYY-MM-DD HH:mm:ss.SSS";
export const SHORT_DATE_TIME_MS = "DD/MM/YYYY HH:mm:ss.SSS";
export const SHORT_DATE = "DD/MM/YYYY";




export function testFormatter(year: number, month: number, day: number, hr24: number = 0, minute: number = 0, second: number = 0, milliSecond: number = 0, formatString: string): string {
  // moment zero bases months WTF
  return time(year, month, day, hr24, minute, second, milliSecond).format(formatString);
}

export function duration(from: moment$Moment | string, to: moment$Moment | string, format: ?string): moment$MomentDuration {
  const forceToMoment = (val: moment$Moment | string): moment$Moment => typeof val == 'string' ? strToMoment(val, format) : val;
  return moment.duration(forceToMoment(to).diff(forceToMoment(from)));
}

// returns duration as Hrs:Mins:Secs.Ms
export function durationFormatted(from: moment$Moment | string, to: moment$Moment | string, wantMS: bool = false, formatIn: ?string  ): string {
  let dur = duration(from, to, formatIn),
      zPad = (n: number, l: number = 2) => Math.abs(n).toString().padStart(l, '0');

  return `${dur.asMilliseconds() < 0 ? '-' : ''}${zPad(Math.trunc(dur.asHours()))}:${zPad(dur.minutes())}:${zPad(dur.seconds())}${wantMS ? '.' + zPad(dur.milliseconds(), 3): ''}`;
}

export function nowAsLogFormat(): string {
  return nowFormatted(LOG_TO_SEC_FORMAT);
}

export function nowFormatted(formatString: string): string {
  return moment().format(formatString);
}

export function timeToShortDateTimeHyphenatedMs(dateTime: moment$Moment): string {
  return dateTime.format(DATE_TIME_HYPHENATED_MS);
}

export function timeToFormattedMs(dateTime: moment$Moment): string {
  return dateTime.format(LOG_FILE_MS_SEC_FORMAT);
}

export function nowFileFormatted(): string {
  return timeToFormattedMs(moment());
}

export function toMoment(jsDateTime: Date): moment$Moment {
  return moment(jsDateTime);
}

export function strToMoment(dateTimeStr: string, format: ?string): moment$Moment {
  return moment(dateTimeStr, format);
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
