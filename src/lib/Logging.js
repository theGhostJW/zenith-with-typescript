// @flow

import Color from "color";
import * as _ from 'lodash';
import * as winston from 'winston';
import {appendDelim, newLine, capFirst, subStrAfter } from '../lib/StringUtils';
import {fail, objToYaml, debug, def, ensureHasVal, hasValue} from '../lib/SysUtils';
import { nowAsLogFormat, nowFileFormatted } from '../lib/DateTimeUtils';
// force loading of module
import * as fs from 'fs';
import * as path from 'path';

export type LogAttributes = { [string]: any };

function defAttributes(): LogAttributes {
  return {};
}

type StrictLogAttributes = {
  backColor: Color,
  bold: boolean,
  fontColor: Color,
  italic: boolean,
  strikeOut: boolean,
  underline: boolean
}

export const log : LogFunction = (message: string, additionalInfo: ?string, attr: ?LogAttributes) => globaLoggingFunctions.log(message, additionalInfo, attr);
export const logWarning : LogFunction = (message: string, additionalInfo: ?string, attr: ?LogAttributes) => globaLoggingFunctions.logWarning(message, additionalInfo, attr);
export const logError: LogFunction = (message: string, additionalInfo: ?string, attr: ?LogAttributes) => globaLoggingFunctions.logError(message, additionalInfo, attr);

const specialMessage = (subType: LogSubType): LogFunction => specialLog(subType, log);
const specialError = (subType: LogSubType): LogFunction => specialLog(subType, logError);

const BLUE : Color = new Color('#00008B');
const WHITE  : Color = Color('#FFFFFF');

export type LogFunction = (message: string, additionalInfo: ?string, attrs: ?LogAttributes) => void

export type LoggingFunctions = {
   log: LogFunction,
   logWarning: LogFunction,
   logError: LogFunction
}

export type LogSubType = "Message" |
                          "RunStart" |
                          "TestStart" |
                          "IterationStart" |
                          "IterationEnd" |
                          "TestEnd" |
                          "RunEnd" |
                          "StartDefect" |
                          "EndDefect" |
                          "CheckPass" |
                          "CheckFail";

function specialLog(subType: LogSubType, baseFunction: LogFunction): LogFunction {
  return function logSpecial(message: string, additionalInfo: ?string, attr: ?LogAttributes) {
    attr = attr == null ? {} : attr;
    attr.subType = subType;
    baseFunction(message, additionalInfo, attr);
  }
}

export const logCheckFailure: LogFunction = specialError('CheckFail');
export const logCheckPassed: LogFunction = specialMessage('CheckPass');

const isCheckPointSubType = (subType: ?LogSubType) =>  subType != null && ['CheckFail', 'CheckPass'].includes(subType);

function consoleLog(label: string) : LogFunction {
  return function logWithlabel (message: string, additionalInfo: ?string, attr: ?LogAttributes) : void {
    let fullMessage = _.toUpper(label) + ': ' + message;
    console.log(appendDelim(fullMessage, newLine(), additionalInfo));
  }
}

export const PLAIN_CONSOLE_LOGGING_FUNCTIONS: LoggingFunctions = {
   log: consoleLog('message'),
   logWarning: consoleLog('warning'),
   logError: consoleLog('error')
}

/*===================  Winston Logging  ========================*/

export const logger = newWinstton();


function newWinstton() {
  if (logger) {
    logger.close();
  }

  return new (winston.Logger)({
    transports: [
      consoleLogger(),
      fileLogger('latest.yaml'),
      fileLogger(`log ${nowFileFormatted()}.yaml`),
    ]
  });
}

function deleteRecreateFile(filePath: string) {
  if (fs.existsSync(filePath)) {
    console.log(filePath);
    fs.unlinkSync(filePath);
  }
  fs.writeFileSync(filePath, '');
}

export function consoleLogger() {
  return new (winston.transports.Console)({
      timestamp: nowAsLogFormat,
      colorize: true,
      level: 'info',
      formatter: formatConsoleLog
    });
}


export function fileLogger(fileNameNoPath: string) {
  let filePath = logFile(fileNameNoPath);
  deleteRecreateFile(filePath);
  return new (winston.transports.File)({
      name: fileNameNoPath,
      timestamp: nowAsLogFormat,
      filename: filePath,
      level: 'info',
      colorize: true,
      json: false,
      options: {flags: 'a'},
      formatter: formatFileLog
    });
}

// don't know how to call directly as modules aren't loaded if call in FileUtils
// when winston is loading

function logFile(fileName: string): string {
  return path.join(projectDirDuplicate(), 'logs', fileName);
}

function projectDirDuplicate() : string {
  const SENTINAL_PROJECT_FILE_DUPLICATE: string = 'package.json';
  let tried = [];
  function isProjectDir(dir : string): boolean {
    let fullPath = path.join(dir, SENTINAL_PROJECT_FILE_DUPLICATE);
    tried.push(fullPath);
    return fs.existsSync(fullPath);
  }

  let seedName = module.filename,
    projFolder = seekFolderDuplicate(seedName, isProjectDir);

  return ensureHasVal(projFolder, `Cannot find project file path when searching up from: ${seedName} - tried: ${tried.join(', ')}`);
}


function seekFolderDuplicate(startFileOrFolder : string, pathPredicate : (filePath : string) => boolean) :
  ? string {
    return hasValue(startFileOrFolder)
      ? pathPredicate(startFileOrFolder)
        ? startFileOrFolder
        : _.isEqual(path.dirname(startFileOrFolder), startFileOrFolder)
          ? null
          : seekFolderDuplicate(path.dirname(startFileOrFolder), pathPredicate): null;
  }

/*
 It's general properties are: timestamp, level, message, meta. Depending on the transport type, there may be additional properties.
 */
function formatFileLog(options) {
  let meta = options.meta;
  let logItem = {
    timestamp: options.timestamp(),
    [options.level]: options.message,
    additionalInfo: meta.additionalInfo,
    link: meta.link,
    callstack: meta.callstack == null ?  meta.callstack : subStrAfter(meta.callstack, 'Error\n')
  }
  return objToYaml(logItem) + '--------';
}

function formatConsoleLog(options) {
  // Return string will be passed to logger.
  let meta = options.meta,
      header = isCheckPointSubType(meta.subType) ? options.message : appendDelim(capFirst(options.level), ': ', options.message);
  return winston.config.colorize(options.level, appendDelim(header , newLine(), def(options.meta, {}).additionalInfo));
}

// error: 0, warn: 1, info: 2, verbose: 3, debug: 4, silly: 5
const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2
};

type LogLevel = $Keys<typeof LOG_LEVELS>;

type WinstonLogFunc = (LogLevel, string, {}) => void;

export const DEFAULT_LOGGING_FUNCTIONS: LoggingFunctions = {
   log: logFunction('info', false),
   logWarning: logFunction('warn', true),
   logError: logFunction('error', true)
}

let winstonLogFuncs = {
  error: logger.error,
  warning: logger.warn,
  message: logger.info
}

function logFunction(level: LogLevel, callStack: boolean) : LogFunction {

  return function logWithlabel (message: string, additionalInfo: ?string, attrs: ?LogAttributes) : void {
    attrs = attrs == null ? defAttributes() : attrs;
    let meta: LogAttributes = _.clone(attrs);
    meta.additionalInfo = additionalInfo;
    if (callStack) {
      meta.callstack = new Error().stack;
    }

    logger.log(level, message, meta);
  }

}

let globaLoggingFunctions: LoggingFunctions = DEFAULT_LOGGING_FUNCTIONS;

export function setLoggingFunctions(loggingFunctions: LoggingFunctions): void {
  globaLoggingFunctions = loggingFunctions;
}
