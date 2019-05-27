const _ = require('lodash');
const winston = require('winston');
const mkdirp = require('mkdirp');

import * as util from 'util'
import {appendDelim, newLine, capFirst, subStrAfter, show, hasText } from './StringUtils';
import {objToYaml, def, ensureHasVal, hasValue, translateErrorObj} from './SysUtils';
import { nowAsLogFormat, timeToShortDateTimeHyphenatedMs} from './DateTimeUtils';
import { changeExtension } from './FileUtils';
// force loading of module
import * as fs from 'fs';
import * as path from 'path';

import { emitMessageIfSocketAssigned } from './SeleniumIpcServer';

let ipcLogs = 0;
var projectDirSingleton: string | null = null;

export enum PopControl {
  NoAction = 0,
  PushFolder = 1,
  PopFolder = -1
};


// may have issues loading so duplicated from FileUtils
function combineDuplicate(root : string, ...childPaths : Array < string >) {
  return path.join(root, ...childPaths);
}

function forceDirectoryDuplicate(path : string) : string {
  mkdirp.sync(path);
  return path;
}

export interface FullLogAttributes {
                              additionalInfo?: string,
                              subType: LogSubType,
                              popControl: PopControl,
                              link?: string,
                              callstack: any
                            };

export type LogAttributes = Partial<FullLogAttributes>

function defAttributes(): LogAttributes {
  return {
    subType: 'Message'
  };
}

export const log : LogFunction = (message, additionalInfo, attr) => globaLoggingFunctions.log(message, additionalInfo, attr);
export const logWarning : LogFunction = (message, additionalInfo, attr) => globaLoggingFunctions.logWarning(message, additionalInfo, attr);
export const logError: LogFunction = (message, additionalInfo, attr) => globaLoggingFunctions.logError(message, additionalInfo, attr);
export const logLink = (message: string, link: string, additionalInfo?: string, attrs?: LogAttributes) => {
  attrs = attrs == null ? {} : attrs;
  attrs.subType = def(<any>attrs.subType, 'Message');
  attrs.link = link;
  globaLoggingFunctions.log(message + ': ' + link, additionalInfo, attrs);
}

export const notImplementedWarning = (str?: string) => logWarning(str == null ? 'NOT IMPLEMENTED' : 'NOT IMPLEMENTED: ' + str);

const specialMessage = (subType: LogSubType, popControl: PopControl = PopControl.NoAction): LogFunction => specialLog(subType, log, popControl);
const specialError = (subType: LogSubType, popControl: PopControl = PopControl.NoAction): LogFunction => specialLog(subType, logError, popControl);

export const pushLogFolder = (folderLabel: string) => specialMessage('Message', PopControl.PushFolder)(folderLabel);
export const popLogFolder = () => specialMessage('Message', PopControl.PopFolder)('Pop Folder');

export const expectDefect = (defectInfo: string, active: boolean = true) => specialMessage('StartDefect')(appendDelim('Defect Expected', ': ', defectInfo), {active: active});
export const endDefect = () => specialMessage('EndDefect')('End Defect');
export const logStartInteraction = () => specialMessage('InteractorStart', PopControl.PushFolder)('Start Interaction');
export const logEndInteraction = (
                                  apState: any,
                                  mocked: boolean) => specialMessage('InteractorEnd', PopControl.PopFolder)('End Interaction', {mocked: mocked, apState: apState});

export const logPrepValidationInfoStart = () => specialMessage('PrepValidationInfoStart')('Start Validation Prep');
export const logPrepValidationInfoEnd = (dState: any) => specialMessage('PrepValidationInfoEnd')('End Validation Prep', {dState: dState});

export const logValidationStart = (valTime: moment$Moment, dState: any) => specialMessage('ValidationStart', PopControl.PushFolder)('Start Validation', {
                                                                                                                                    valTime: timeToShortDateTimeHyphenatedMs(valTime),
                                                                                                                                    dState: dState
                                                                                                                                  });

export const logValidationEnd = () => specialMessage('ValidationEnd', PopControl.PopFolder)('End Validation');

export const logStartValidator = (name: string) => specialMessage('ValidatorStart', PopControl.PushFolder)(name);
export const logEndValidator = (name: string) => specialMessage('ValidatorEnd', PopControl.PopFolder)(name);

export const logException = (message: string, exceptionObj?: any) => {
  let errobj = translateErrorObj(exceptionObj, message);
  logError(message,
      show(exceptionObj),
      {
       additionalInfo: show(exceptionObj),
       subType: 'Exception',
       popControl: PopControl.NoAction,
       callstack: _.isObject(errobj) ? errobj.stack : undefined
     }
    );
}

export const logFilterLog = (filterLog: {[k:string]: string}) => specialMessage('FilterLog')('Filter Log', objToYaml(filterLog));
export const logStartRun = (runName: string, runConfig: any) => specialMessage('RunStart', PopControl.PushFolder)(
                                                                                            `Test Run: ${runName}`,
                                                                                             objToYaml(runConfig));

export const logEndRun = (runName: string) => specialMessage('RunEnd', PopControl.PopFolder)(`End Run: ${runName}`);

export const logStartTest = (testName: string, when: string, then: string, testConfig: {}) =>
                                                                                                    {
                                                                                                      let plainName = changeExtension(testName, ''),
                                                                                                          addInfo = _.defaults(
                                                                                                                                {script: plainName},
                                                                                                                                testConfig
                                                                                                                              );

                                                                                                      return specialMessage('TestStart', PopControl.PushFolder)(
                                                                                                      `Test: ${plainName} - When ${when} then ${then}`,
                                                                                                       objToYaml(addInfo));
                                                                                                     }

export const logEndTest = (testName: string) => specialMessage('TestEnd', PopControl.PopFolder)(`End Test ${testName}`, objToYaml({testName: testName}));

export const logStartIteration = (id: number, testName: string, when: string, then: string, item: {}) => specialMessage('IterationStart', PopControl.PushFolder)(
                                                                                                      `Iteration: ${id}: ${testName} - When ${when} then ${then}`,
                                                                                                       objToYaml(item));

export const logEndIteration = (id: number) => specialMessage('IterationEnd', PopControl.PopFolder)(`End Iteration ${id}`, objToYaml({id: id}))

export type LogFunction = (message?: string, additionalInfo?: string | {}, attrs?: LogAttributes) => void

export type LoggingFunctions = {
   log: LogFunction,
   logWarning: LogFunction,
   logError: LogFunction
}

export type LogSubType = "Message" |
                          "FilterLog" |
                          "RunStart" |
                          "TestStart" |
                          "IterationStart" |
                          "IterationEnd" |
                          "TestEnd" |
                          "PrepValidationInfoStart" |
                          "PrepValidationInfoEnd" |
                          "StartSummary" |
                          "Summary" |
                          "RunEnd" |
                          "StartDefect" |
                          "EndDefect" |
                          "Exception" |
                          "InteractorStart" |
                          "InteractorEnd" |
                          "ValidationStart" |
                          "ValidationEnd" |
                          "ValidatorStart" |
                          "ValidatorEnd" |
                          "CheckPass" |
                          "CheckFail";

function specialLog(subType: LogSubType, baseFunction: LogFunction, popControl: PopControl = PopControl.NoAction): LogFunction {
  return function logSpecial(message?: string, additionalInfo?: string | {}, attr?: LogAttributes) {
    attr = attr == null ? {} : attr;
    attr.subType = subType;
    attr.popControl = popControl;
    baseFunction(show(message), additionalInfo == null ? additionalInfo: show(additionalInfo), attr);
  }
}

export const logCheckFailure: LogFunction = specialError('CheckFail');
export const logCheckPassed: LogFunction = specialMessage('CheckPass');

const isCheckPointSubType = (subType?: LogSubType) =>  subType != null && ['CheckFail', 'CheckPass'].includes(subType);

function consoleLog(label: string) : LogFunction {
  return function logWithlabel (message: string = '', additionalInfo?: string | {}, attr?: LogAttributes) : void {
    let fullMessage = _.toUpper(label) + ': ' + message;
    console.log(appendDelim(fullMessage, newLine(), additionalInfo == null ? additionalInfo : show(additionalInfo)));
  }
}

export const PLAIN_CONSOLE_LOGGING_FUNCTIONS: LoggingFunctions = {
   log: consoleLog('message'),
   logWarning: consoleLog('warning'),
   logError: consoleLog('error')
}

export interface LogEntry {
  timestamp?: string,
  level: LogLevel,
  subType: LogSubType,
  popControl: PopControl,
  message?: string,
  link?: string,
  callstack?: string,
  additionalInfo?: string
}

/*===================  Winston Logging  ========================*/



 const SynchFileLogger = winston.transports.SynchFileLogger = function (options: Map<string | number, string| number>) {
   //
   // Name this logger
   const anyOps = <any>options;

   this.name = <any>anyOps.name;

   //
   // Set the level from your options
   //
   this.level = anyOps.level || 'info';
   this.timestamp = anyOps.timestamp || nowAsLogFormat;

   //$FlowFixMe
   this.fd = fs.openSync(anyOps.filename, 'w+');

   //
   // Configure your storage backing as you see fit
   //
 };


  //
  // Inherit from `winston.Transport` so you can take advantage
  // of the base functionality and `.handleExceptions()`.
  //
  util.inherits(SynchFileLogger, winston.Transport);

  SynchFileLogger.prototype.log = function (level: any, msg: any, meta: any, callback: any) {
    //
    // Store this message and metadata, maybe use some custom logic
    // then callback indicating success.

    let logMessage = formatFileLog({
      timestamp: this.timestamp,
      level: level,
      message: msg,
      meta: meta
    });

    fs.write(this.fd, logMessage + newLine(), (err, fd) => {
     // => [Error: EISDIR: illegal operation on a directory, open <directory>]
    });

    // not sure what this is for
    callback(null, true);
  };


  const IPCLogger = winston.transports.IPCLogger = function (options: Map<string | number, string| number>) {
    //
    // Name this logger
   const anyOps = <any>options;

    this.name = anyOps.name;

    //
    // Set the level from your options
    //
    this.level = anyOps.level || 'info';
    this.timestamp = anyOps.timestamp || nowAsLogFormat;

    //
    // Configure your storage backing as you see fit
    //
  };

 //
 // Inherit from `winston.Transport` so you can take advantage
 // of the base functionality and `.handleExceptions()`.
 //
 util.inherits(IPCLogger, winston.Transport);

 IPCLogger.prototype.log = function (level: any, msg: any, meta: any, callback: any) {
   //
   // Store this message and metadata, maybe use some custom logic
   // then callback indicating success.

  emitMessageIfSocketAssigned('Log', {
     level: level,
     message: msg,
     meta: meta
   });

   // not sure wha
   callback(null, true);
 };


let rawTimeStampLogDir: string = '',
    rawTimeStampLogFilePath: string = '';

export const logger = newWinstton();

export const latestRawPath = () => logFileBaseDuplicate('latest.raw.yaml');
export const timeStampedRawPath = () => rawTimeStampLogFilePath;
export const timeStampedLogDir = () => rawTimeStampLogDir;

function nowLogFormatted() {
  let d = new Date(),
      pad = (i: number) => i < 10 ? '0' + i.toString() : i.toString();
  return [ d.getFullYear(),
            d.getMonth() + 1,
            d.getDate(),
            d.getHours(),
            d.getMinutes(),
            d.getSeconds(),
            d.getMilliseconds()
          ].map(pad).join('-');
}

function newWinstton() {

  let rightNow = nowLogFormatted(), // have to use local method as not all modules loaded
      subDir = combineDuplicate(logFileBaseDuplicate(), rightNow);
  rawTimeStampLogFilePath = combineDuplicate(subDir, `log ${rightNow}.raw.yaml`);

  forceDirectoryDuplicate(subDir);

  let isWebDriverProcess = hasText((<any>process).mainModule.filename, '@wdio');
  return new (winston.Logger)({
                  transports: isWebDriverProcess ? [ ipcLogger() ] : [
                                                    consoleLogger(),
                                                    fileLogger(logFileBaseDuplicate('latest.raw.yaml')),
                                                    fileLogger(rawTimeStampLogFilePath)
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

const rawLogFilePaths: string[] = [];

// base name of a full path ~ duplicated because of load timing issues
function fileOrFolderNameDuplicate(fullPath: string): string {
  let parts = path.parse(fullPath);
  return parts.base;
}

export function fileLogger(filePath: string) {
  return new (winston.transports.SynchFileLogger)({
      name: fileOrFolderNameDuplicate(filePath),
      timestamp: nowAsLogFormat,
      filename: filePath,
      level: 'info',
      colorize: true,
      json: false,
      options: {flags: 'a'},
      formatter: formatFileLog
    });
}

export function ipcLogger() {
  return new (winston.transports.IPCLogger)({
      name: `ipc logger ${(ipcLogs++).toString()}`,
      timestamp: nowAsLogFormat,
      level: 'info',
      colorize: true,
      json: false,
      options: {flags: 'a'},
      formatter: formatFileLog
    });
}



// don't know how to call directly as modules aren't loaded if call in FileUtils
// when winston is loading

function logFileBaseDuplicate(fileName: string = ''): string {
  return path.join(projectDirDuplicate(), 'logs', fileName);
}

function projectDirTry(seedName: string, sentinalProjectFile: string) : [string, string[]] {

  let tried: string[] = [];
  function isProjectDir(dir : string): boolean {
    let fullPath =  path.join(dir, sentinalProjectFile);
    tried.push(fullPath);
    return fs.existsSync(fullPath);
  }

  let projFolder = seekFolderDuplicate(seedName, isProjectDir);
  return [<any>projFolder, tried];
}

function projectDirDuplicate() : string {

  if (projectDirSingleton == null){
    let seedName = module.filename,
        try1 = projectDirTry(seedName, 'ZwtfProjectBase.txt'),
        dir1 = try1[0];

    if (dir1 != null){
      return dir1;
    }

    // assume framework testing fall back to package.json
    let try2 = projectDirTry(seedName, 'package.json'),
        dir2 = try2[0];

    projectDirSingleton = ensureHasVal(dir2, `Cannot find project file path when searching up from: ${seedName} - tried: ${try1[1].concat(try2[1]).join(', ')}`);
  }

  return projectDirSingleton;
}

function seekFolderDuplicate(startFileOrFolder : string, pathPredicate : (filePath : string) => boolean) : string | null {
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
function formatFileLog(options: any) {
  let meta = options.meta;
  let logItem = {
    timestamp: options.timestamp(),
    level: options.level,
    subType: meta.subType,
    popControl: meta.popControl,
    message: options.message,
    additionalInfo: meta.additionalInfo,
    link: meta.link,
    callstack: meta.callstack == null ?  meta.callstack : subStrAfter(meta.callstack, 'Error\n')
  }
  return objToYaml(logItem) + RECORD_DIVIDER;
}

function formatConsoleLog(options: any) {
  // Return string will be passed to logger.
  let meta = options.meta,
      header = isCheckPointSubType(meta.subType) ? options.message : appendDelim(capFirst(options.level), ': ', options.message);
  return winston.config.colorize(options.level, appendDelim(header , newLine(), (<any>def(options.meta, {})).additionalInfo));
}

export const RECORD_DIVIDER = '-------------------------------';

// error: 0, warn: 1, info: 2, verbose: 3, debug: 4, silly: 5
export enum LogLevel {
  Error = 0,
  Warn = 1,
  Info = 2
};

export const DEFAULT_LOGGING_FUNCTIONS: LoggingFunctions = {
   log: logFunction(LogLevel.Info, false),
   logWarning: logFunction(LogLevel.Warn, true),
   logError: logFunction(LogLevel.Error, true)
}

let winstonLogFuncs = {
  error: logger.error,
  warning: logger.warn,
  message: logger.info
}

function logFunction(level: LogLevel, callStack: boolean) : LogFunction {

  return function logWithlabel (message?: string, additionalInfo?: string | {}, attrs?: LogAttributes) : void {
    attrs = attrs == null ? defAttributes() : attrs;
    let meta: LogAttributes = _.clone(attrs);
    meta.additionalInfo = additionalInfo == null ? additionalInfo: show(additionalInfo) ;
    if (callStack) {
      meta.callstack = new Error().stack;
    }

    logger.log(level, message, meta);
  }

}


export function lowLevelLogging(level: LogLevel, message: string | null, meta: LogAttributes) {
  logger.log(level, message, meta);
}



let globaLoggingFunctions: LoggingFunctions = DEFAULT_LOGGING_FUNCTIONS;

export function setLoggingFunctions(loggingFunctions: LoggingFunctions): void {
  globaLoggingFunctions = loggingFunctions;
}
