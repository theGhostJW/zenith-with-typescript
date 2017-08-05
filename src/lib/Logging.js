// @flow


import Color from "color";
import * as _ from 'lodash';
import {appendDelim, newLine} from '../lib/StringUtils';



export type LogAttributes = {
  backColor: ?Color,
  bold: ?boolean,
  fontColor: ?Color,
  italic: ?boolean,
  strikeOut: ?boolean,
  underline: ?boolean
}

type StrictLogAttributes = {
  backColor: Color,
  bold: boolean,
  fontColor: Color,
  italic: boolean,
  strikeOut: boolean,
  underline: boolean
}

export const log : LogFunction = (message: string, additionalInfo: ?string, link: ?string, attr: ?LogAttributes) => {globaLoggingFunctions.log(message, additionalInfo, link, attr);}
export const logWarning : LogFunction = (message: string, additionalInfo: ?string, link: ?string, attr: ?LogAttributes) => {globaLoggingFunctions.logWarning(message, additionalInfo, link, attr);}
export const logError: LogFunction = (message: string, additionalInfo: ?string, link: ?string, attr: ?LogAttributes) => {globaLoggingFunctions.logError(message, additionalInfo, link, attr);}

const BLUE : Color = new Color('#00008B');
const WHITE  : Color = Color('#FFFFFF');

function defaultAttributes(providedAttributes: LogAttributes) : StrictLogAttributes {
  const DEFAULT_ATTRIBUTES: StrictLogAttributes = {
    backColor: WHITE,
    bold: false,
    fontColor: BLUE,
    italic: false,
    strikeOut: false,
    underline: false
  }
  return _.extend(DEFAULT_ATTRIBUTES, providedAttributes);
}

export type LogFunction = (message: string, additionalInfo: ?string, link: ?string, attr: ?LogAttributes) => void

export type LoggingFunctions = {
   log: LogFunction,
   logWarning: LogFunction,
   logError: LogFunction
}

function consoleLog(label: string) : (message: string, additionalInfo: ?string, link: ?string, attr: ?LogAttributes) => void {
  return function logWithlabel (message: string, additionalInfo: ?string,  link: ?string, attr: ?LogAttributes) : void {
    let fullMessage = _.toUpper(label) + ': ' + message;
    console.log(appendDelim(fullMessage, newLine(), additionalInfo));
  }
}

export const DEFAULT_LOGGING_FUNCTIONS: LoggingFunctions = {
   log: consoleLog('message'),
   logWarning: consoleLog('warning'),
   logError: consoleLog('error')
}

let globaLoggingFunctions: LoggingFunctions = DEFAULT_LOGGING_FUNCTIONS;
export function setLoggingFunctions(loggingFunctions: LoggingFunctions): void {
  globaLoggingFunctions = loggingFunctions;
}
