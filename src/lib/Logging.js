// @flow

import * as _ from 'lodash';
import * as winston from 'winston';
import * as util from 'util'
import {appendDelim, newLine, capFirst, subStrAfter, toString } from '../lib/StringUtils';
import {fail, objToYaml, debug, def, ensureHasVal, hasValue} from '../lib/SysUtils';
import { nowAsLogFormat, nowFileFormatted, timeToShortDateTimeHyphenatedMs} from '../lib/DateTimeUtils';
import { changeExtension } from '../lib/FileUtils';
// force loading of module
import * as fs from 'fs';
import * as path from 'path';
import * as mkdirp from 'mkdirp';


// may have issues loading so duplicated from FileUtils
function combineDuplicate(root : string, ...childPaths : Array < string >) {
  return path.join(root, ...childPaths);
}

function forceDirectoryDuplicate(path : string) : string {
  mkdirp.sync(path);
  return path;
}

// error: 0, warn: 1, info: 2, verbose: 3, debug: 4, silly: 5
export const FOLDER_NESTING = {
  NoAction: 0,
  PushFolder: 1,
  PopFolder: -1
};

export type PopControl =  $Keys<typeof FOLDER_NESTING>;

export type FullLogAttributes = {
                              additionalInfo: ?string,
                              subType: LogSubType,
                              popControl: PopControl,
                              link: ?string,
                              callstack: any
                            };

export type LogAttributes = $Supertype<FullLogAttributes>

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
  attrs.subType = def(attrs.subType, 'Message');
  attrs.link = link;
  globaLoggingFunctions.log(message + ': ' + link, additionalInfo, attrs);
}

export const notImplementedWarning = (str: ?string) => logWarning(str == null ? 'NOT IMPLEMENTED' : 'NOT IMPLEMENTED: ' + str);

const specialMessage = (subType: LogSubType, popControl: PopControl = 'NoAction'): LogFunction => specialLog(subType, log, popControl);
const specialError = (subType: LogSubType, popControl: PopControl = 'NoAction'): LogFunction => specialLog(subType, logError, popControl);

export const pushLogFolder = (folderLabel: string) => specialMessage('Message', 'PushFolder')(folderLabel);
export const popLogFolder = () => specialMessage('Message', 'PopFolder')('Pop Folder');

export const expectDefect = (defectInfo: string, active: boolean = true) => specialMessage('StartDefect')(appendDelim('Defect Expected', ': ', defectInfo), {active: active});
export const endDefect = () => specialMessage('EndDefect')('End Defect');
export const logStartInteraction = () => specialMessage('InteractorStart', 'PushFolder')('Start Interaction');
export const logEndInteraction = (
                                  apState: any,
                                  mocked: boolean) => specialMessage('InteractorEnd', 'PopFolder')('End Interaction', {mocked: mocked, apState: apState});

export const logPrepValidationInfoStart = () => specialMessage('PrepValidationInfoStart')('Start Validation Prep');
export const logPrepValidationInfoEnd = (valState: any) => specialMessage('PrepValidationInfoEnd')('End Validation Prep', {valState: valState});

export const logStartIterationSummary = () => specialMessage('StartSummary')('Start Summary');
export const logIterationSummary = (summary: string) => specialMessage('Summary')(summary);
export const logValidationStart = (valTime: moment$Moment, valState: any) => specialMessage('ValidationStart', 'PushFolder')('Start Validation', {
                                                                                                                                    valTime: timeToShortDateTimeHyphenatedMs(valTime),
                                                                                                                                    valState: valState
                                                                                                                                  });

export const logValidationEnd = () => specialMessage('ValidationEnd', 'PopFolder')('End Validation');

export const logStartValidator = (name: string) => specialMessage('ValidatorStart', 'PushFolder')(name);
export const logEndValidator = (name: string) => specialMessage('ValidatorEnd', 'PopFolder')(name);

export const logException = (message: string, exceptionObj: any) =>
                                                                  logError(message,
                                                                      toString(exceptionObj),
                                                                      {
                                                                       additionalInfo: toString(exceptionObj),
                                                                       subType: 'Exception',
                                                                       popControl: 'NoAction',
                                                                       callstack: exceptionObj.stack
                                                                     }
                                                                    );

export const logFilterLog = (filterLog: {[string]: string}) => specialMessage('FilterLog')('Filter Log', objToYaml(filterLog));
export const logStartRun = (runName: string, runConfig: mixed) => specialMessage('RunStart', 'PushFolder')(
                                                                                            `Test Run: ${runName}`,
                                                                                             objToYaml(runConfig));

export const logEndRun = (runName: string) => specialMessage('RunEnd', 'PopFolder')(`End Run: ${runName}`);

export const logStartTest = (testName: string, when: string, then: string, testConfig: {}) =>
                                                                                                    {
                                                                                                      let plainName = changeExtension(testName, ''),
                                                                                                          addInfo = _.defaults(
                                                                                                                                {script: plainName},
                                                                                                                                testConfig
                                                                                                                              );

                                                                                                      return specialMessage('TestStart', 'PushFolder')(
                                                                                                      `Test: ${plainName} - When ${when} then ${then}`,
                                                                                                       objToYaml(addInfo));
                                                                                                     }

export const logEndTest = (testName: string) => specialMessage('TestEnd', 'PopFolder')(`End Test ${testName}`, objToYaml({testName: testName}));

export const logStartIteration = (id: number, testName: string, when: string, then: string, item: {}) => specialMessage('IterationStart', 'PushFolder')(
                                                                                                      `Iteration: ${id}: ${testName} - When ${when} then ${then}`,
                                                                                                       objToYaml(item));

export const logEndIteration = (id: number) => specialMessage('IterationEnd', 'PopFolder')(`End Iteration ${id}`, objToYaml({id: id}))

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

function specialLog(subType: LogSubType, baseFunction: LogFunction, popControl: PopControl = 'NoAction'): LogFunction {
  return function logSpecial(message?: string, additionalInfo?: string | {}, attr?: LogAttributes) {
    attr = attr == null ? {} : attr;
    attr.subType = subType;
    attr.popControl = popControl;
    baseFunction(toString(message), additionalInfo == null ? additionalInfo: toString(additionalInfo), attr);
  }
}

export const logCheckFailure: LogFunction = specialError('CheckFail');
export const logCheckPassed: LogFunction = specialMessage('CheckPass');

const isCheckPointSubType = (subType: ?LogSubType) =>  subType != null && ['CheckFail', 'CheckPass'].includes(subType);

function consoleLog(label: string) : LogFunction {
  return function logWithlabel (message: string = '', additionalInfo?: string | {}, attr?: LogAttributes) : void {
    let fullMessage = _.toUpper(label) + ': ' + message;
    console.log(appendDelim(fullMessage, newLine(), additionalInfo == null ? additionalInfo : toString(additionalInfo)));
  }
}

export const PLAIN_CONSOLE_LOGGING_FUNCTIONS: LoggingFunctions = {
   log: consoleLog('message'),
   logWarning: consoleLog('warning'),
   logError: consoleLog('error')
}

export type LogEntry = {
  timestamp?: string,
  level: LogLevel,
  subType: LogSubType,
  popControl: PopControl,
  message: ?string,
  link: ?string,
  callstack: ?string,
  additionalInfo: ?string
}

/*===================  Winston Logging  ========================*/



 var CustomLogger = winston.transports.CustomLogger = function (options: {}) {
   //
   // Name this logger

   //$FlowFixMe
   this.name = options.name;

   //
   // Set the level from your options
   //
   this.level = options.level || 'info';
   this.timestamp = options.timestamp || nowAsLogFormat;

   //$FlowFixMe
   this.fd = fs.openSync(options.filename, 'w+');

   //
   // Configure your storage backing as you see fit
   //
 };

 //
 // Inherit from `winston.Transport` so you can take advantage
 // of the base functionality and `.handleExceptions()`.
 //
 util.inherits(CustomLogger, winston.Transport);

 CustomLogger.prototype.log = function (level, msg, meta, callback) {
   //
   // Store this message and metadata, maybe use some custom logic
   // then callback indicating success.

   let logMessage = formatFileLog({
     timestamp: this.timestamp,
     level: level,
     message: msg,
     meta: meta
   });

   //$FlowFixMe
   fs.write(this.fd, logMessage + newLine(), (err, fd) => {
    // => [Error: EISDIR: illegal operation on a directory, open <directory>]
   });

   callback(null, true);
 };


let rawTimeStampLogDir: string = '',
    rawTimeStampLogFilePath: string = '';
export const logger = newWinstton();

export const latestRawPath = () => logFileBaseDuplicate('latest.raw.yaml');
export const timeStampedRawPath = () => rawTimeStampLogFilePath;
export const timeStampedLogDir = () => rawTimeStampLogDir;

function newWinstton() {
  if (logger) {
    logger.close();
  }

  let rightNow = nowFileFormatted(),
      subDir = combineDuplicate(logFileBaseDuplicate(), rightNow);
  rawTimeStampLogFilePath = combineDuplicate(subDir, `log ${rightNow}.raw.yaml`);
  forceDirectoryDuplicate(subDir);
  return new (winston.Logger)({
    transports: [
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

const rawLogFilePaths: Array<string> = [];

// base name of a full path ~ duplicated because of load timing issues
function fileOrFolderNameDuplicate(fullPath: string): string {
  let parts = path.parse(fullPath);
  return parts.base;
}

export function fileLogger(filePath: string) {
  return new (winston.transports.CustomLogger)({
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



// don't know how to call directly as modules aren't loaded if call in FileUtils
// when winston is loading

function logFileBaseDuplicate(fileName: string = ''): string {
  return path.join(projectDirDuplicate(), 'logs', fileName);
}

function projectDirTry(seedName: string, sentinalProjectFile: string) : [?string, Array<string>] {

  let tried = [];
  function isProjectDir(dir : string): boolean {
    let fullPath =  path.join(dir, sentinalProjectFile);
    tried.push(fullPath);
    return fs.existsSync(fullPath);
  }

  let projFolder = seekFolderDuplicate(seedName, isProjectDir);
  return [projFolder, tried];
}

let projectDirSingleton: ?string = null;
export function projectDirDuplicate() : string {

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

function formatConsoleLog(options) {
  // Return string will be passed to logger.
  let meta = options.meta,
      header = isCheckPointSubType(meta.subType) ? options.message : appendDelim(capFirst(options.level), ': ', options.message);
  return winston.config.colorize(options.level, appendDelim(header , newLine(), def(options.meta, {}).additionalInfo));
}

export const RECORD_DIVIDER = '-------------------------------';

// error: 0, warn: 1, info: 2, verbose: 3, debug: 4, silly: 5
export const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2
};

export type LogLevel = $Keys<typeof LOG_LEVELS>;

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

  return function logWithlabel (message?: string, additionalInfo?: string | {}, attrs?: LogAttributes) : void {
    attrs = attrs == null ? defAttributes() : attrs;
    let meta: LogAttributes = _.clone(attrs);
    meta.additionalInfo = additionalInfo == null ? additionalInfo: toString(additionalInfo) ;
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
