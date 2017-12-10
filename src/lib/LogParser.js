//@flow

import {debug, areEqual, yamlToObj, reorderProps, def, fail, ensure, objToYaml, forceArray, seekInObj } from '../lib/SysUtils';
import type { PopControl, LogSubType, LogLevel, LogEntry } from '../lib/Logging';
import { RECORD_DIVIDER, FOLDER_NESTING } from '../lib/Logging';
import { newLine, toString, subStrBefore, replace, hasText, appendDelim} from '../lib/StringUtils';
import * as _ from 'lodash';
import * as fs from 'fs';
import { combine, logFile, fileOrFolderName, eachLine, toTemp, fileToString } from '../lib/FileUtils';
import type { RunSummary, FullSummaryInfo, RunStats, TestSummary, WithScript, TestStats, ErrorsWarningsDefects,
              StateStage, IssuesList, RunState } from '../lib/LogParserTypes';
import { summaryBlock } from '../lib/LogFormatter';
import * as DateTime from '../lib/DateTimeUtils';
import moment from 'moment';


export function parseElements(summary: FullSummaryInfo) {
  let  {
      rawFile,
      elementsFile,
      runSummary
    } = summary;

  let fullWriter = fileRecordWriter(destPath(rawFile, 'raw', 'full'));

  fullWriter(summaryBlock(summary))


//  logSplitter(elementsFile, itemParser: string => void )
}

export const EXECUTING_INTERACTOR_STR = 'Executing Interactor';

 function fileRecordWriter(destPath: string): (content: {} | string) => void {
    let writer = fileWriter(destPath);
    return function writeToFile(content: {} | string) {
        writer(content, 0, newLine() + RECORD_DIVIDER + newLine(), false, false);
    }
 }

 function emptyTestStats() {
   return {
     iterations: 0,
     passedIterations: 0,
     failedIterations: 0,
     iterationsWithType2Errors: 0,
     iterationsWithWarnings: 0,
     iterationsWithKnownDefects: 0
   };
 }

 function summariseLog(rawPath: string, fullSummary: FullSummaryInfo): (RunState, LogEntry) => RunState {

   let resultPath = destPath(rawPath, 'raw', 'elements'),
      // Here separating writer and summariser
       writeToFile = fileRecordWriter(resultPath),
       statsLog: TestStats = emptyTestStats();

   fullSummary.rawFile = rawPath;
   fullSummary.elementsFile = resultPath;
   function calcUpdateTestStats(state): TestStats {
      let runStats = state.runStats,
          result =  emptyTestStats();

       result = _.mapValues(result, (v, k) => runStats[k] - statsLog[k]);
       statsLog = _.pick(runStats, _.keys(statsLog));
       return result;
   }

   function logOutOfTestErrors(state: RunState) {
      if (listHasIssues(state.outOfTestIssues)){
         let issues = {
                        elementType: 'OutOfTestErrors',
                        issues: state.outOfTestIssues.filter(i => hasIssues(i))
                     };
         writeToFile(issues);
      }
   }


   return function step(state: RunState, entry: LogEntry): RunState {

     switch (entry.subType) {
       case 'IterationEnd':
         logOutOfTestErrors(state);
         let issues: Array<ErrorsWarningsDefects> = forceArray(state.inTestIssues, state.validatorIssues);
             issues = issues.filter(i => hasIssues(i));
         let iterationInfo = {
           summary: state.iterationSummary,
           startTime: state.iterationStart,
           endTime: def(entry.timestamp, ''),
           elementType: 'InterationInfo',
           testConfig: state.testConfig,
           item: state.testItem,
           apState: state.apstate,
           passedValidators: state.passedValidators,
           issues: issues
         };
         writeToFile(iterationInfo);
         break;

       case 'TestEnd':
         let
            cfg = def(state.testConfig, {script: 'LOG ERROR CONFIG NOT DEFINED'}),
            testInfo = {
               testConfig: cfg,
               startTime: state.testStart,
               endTime:  def(entry.timestamp, ''),
               stats: calcUpdateTestStats(state)
             };
          fullSummary.testSummaries[cfg.script] = testInfo;
          break;

       case 'RunEnd':
         fullSummary.runSummary = {
              runConfig: state.runConfig,
              startTime: state.timestamp,
              endTime: def(entry.timestamp, ''),
              filterLog: state.filterLog,
              stats: state.runStats
          };
          logOutOfTestErrors(state);
          break;

       default:
         break;
     }

     updateState(state, entry)
     return state;
   }
 }

function listHasIssues(issuesList: IssuesList, includeKnownDefects: boolean = true): boolean {
   let issueExists : ErrorsWarningsDefects => boolean  = (i: ErrorsWarningsDefects) => hasIssues(i, includeKnownDefects);
   return issuesList.some(issueExists);
}

const nullStats: () => RunStats = () => {

  return {
    testCases: 0,
    passedTests: 0,
    failedTests: 0,
    testsWithWarnings: 0,
    testsWithKnownDefects: 0,
    testsWithType2Errors: 0,

    iterations: 0,
    passedIterations: 0,
    failedIterations: 0,
    iterationsWithWarnings: 0,
    iterationsWithType2Errors: 0,
    iterationsWithKnownDefects: 0,

    outOfTestErrors: 0,
    outOfTestWarnings: 0,
    outOfTestType2Errors: 0,
    outOfTestType2Errors: 0,
    outOfTestKnownDefects: 0
  };
}

function emptyValidatorInfo(infoType: StateStage, name: string): ErrorsWarningsDefects {
  return {
    name: name,
    infoType: infoType,
    warnings: [],
    errors: [],
    type2Errors: [],
    knownDefects: []
  }
}

export function hasIssues(val: ErrorsWarningsDefects, includeKnownDefects: boolean = true) {
  return  val.errors.length > 0 ||
          val.warnings.length > 0 ||
          val.type2Errors.length > 0 ||
          (includeKnownDefects && val.knownDefects.length > 0);
}

export function initalState(rawFilePath: string): RunState {
  let result: RunState = {
                runStats: nullStats(),
                filterLog: {},
                runName: '',
                rawFile: rawFilePath,
                runConfig: {},
                timestamp: '',
                iterationSummary: '',
                iterationStart: '',

                indent: 0,
                testConfig: null,
                testStart: '',

                iterationConfig: null,

                errorExpectation: null,
                expectedErrorEncoutered: false,

                apstate: {},
                validationInfo: {},
                testItem: {},

                logItems: [],
                valTime: '',
                validatorIssues: [],
                inTestIssues: [],
                outOfTestIssues: [],
                passedValidators: [],

                testErrorLogged: false,
                testWarningLogged: false,
                testKnownDefectLogged: false,
                testType2ErrorLogged: false,

                iterationErrorLogged: false,
                iterationWarningLogged: false,
                iterationKnownDefectLogged: false,
                iterationType2ErrorLogged: false,

                //this are flipped depending on what state we are in
                activeIssues: null
              };

  switchErrorInfoStage(result, 'OutOfTest', 'out of test');
  return result;
}

function switchErrorInfoStage(state: RunState, stage: StateStage, name: string): void {
   // cardinality problem here
  // !!!
  let newStageRec = emptyValidatorInfo(stage, name),
      propMap = {
        Validation: state.validatorIssues,
        InTest: state.inTestIssues,
        OutOfTest: state.outOfTestIssues
      };
  state.activeIssues = newStageRec;
  propMap[stage].push(newStageRec);
}

function clearErrorInfo(state: RunState): void {
  state.validatorIssues = [];
  state.inTestIssues = [];
  state.outOfTestIssues = [];
  state.activeIssues = null;
}

function destPath(rawPath: string, sourceFilePart: string, destFilePart: string, destDir?: string): string {
  sourceFilePart = '.' + sourceFilePart + '.';

  ensure(hasText(rawPath, sourceFilePart, true), `rawPath does not conform to naming conventions (should contain ${sourceFilePart}) ${rawPath}`);

  let resultPath = replace(rawPath, sourceFilePart, '.' + destFilePart + '.'),
      fileName = fileOrFolderName(resultPath);

  return combine(def(destDir, logFile()), fileName );
}

function fileWriter(destPath: string){
   let fd = fs.openSync(destPath, 'w');

   return function writer(data, indent: number, prefix = newLine(), inArray: boolean = false, arrayLineSeparator: boolean = false) {
     let str = toString(data);

     // depricate this ??
     if (indent > 0){
       let iStr = '  '.repeat(indent),
           nStr = iStr;

       if (inArray) {
         iStr = (arrayLineSeparator ? newLine() : '') + iStr + '- ';
         nStr = nStr + '  ';
       }
       str = _.map(str.split(newLine()), (s, i) => (i === 0 ? iStr : nStr) + s).join(newLine());
     }

     //$FlowFixMe
     fs.writeSync(fd, prefix + str);
   }
}

function pushTestErrorWarning(state: RunState, entry: LogEntry, isType2: boolean = false): void {
  let level = entry.level,
      errorSink = state.activeIssues;

  if(errorSink == null){
    fail( `parser error - no active error / wanring sink at entry: ${toString(entry)}`);
  }
  else {

    let {warnings, errors, type2Errors, knownDefects} = errorSink,
        errArrray = [],
        stage = errorSink.infoType,
        inTest = stage !== 'outOfTest';

    if (isType2) {
      errArrray = type2Errors;
    }
    else if (level === 'error' && state.errorExpectation != null){
      errArrray = knownDefects;
    }
    else if (level === 'error'){
      errArrray = errors;
    }
    else if (level === 'warn'){
      errArrray = warnings;
    }
    else {
      fail('pushTestErrorWarning - not an not in valid state: ' + toString(entry));
    }

   if (isType2 && state.errorExpectation != null){
     let info = _.cloneDeep(entry),
         exStr = objToYaml(
                     _.pick(state.errorExpectation,
                                             'message',
                                             'additionalInfo'
                                          ));
     info.additionalInfo =  exStr;
     errArrray.push(info);
   }
   else {
    errArrray.push(entry);
   }
  }
}

// update the state then reset if required
function updateState(state: RunState, entry: LogEntry): RunState {

  let stats = state.runStats;
  state.timestamp = def(entry.timestamp, state.timestamp);

  state.indent = entry.popControl === 'PopFolder' ? state.indent + FOLDER_NESTING[entry.popControl] : state.indent;
  state.logItems.push(entry);

  let inIteration = state.iterationConfig != null,
      inTest = inIteration || state.testConfig != null;

  switch (entry.level) {
    case 'error':
      if (state.errorExpectation == null){
        if (inIteration && !state.iterationErrorLogged){
           stats.failedIterations++;
           state.iterationErrorLogged = true;
        }

        if (inTest && !state.testErrorLogged){
           stats.failedTests++;
           state.testErrorLogged = true;
        }


        if (!inTest && !inIteration){
          stats.outOfTestErrors++;
        }

        pushTestErrorWarning(state, entry);
      }
      else {
         state.expectedErrorEncoutered = true;
      }
      break;

    case 'warn':
      if (inIteration && !state.iterationWarningLogged){
         stats.iterationsWithWarnings++;
         state.iterationWarningLogged = true;
      }

      if (inTest && !state.testWarningLogged){
         stats.testsWithWarnings++;
         state.testWarningLogged = true;
      }

      if (!inTest && !inIteration){
       stats.outOfTestWarnings++;
      }

      pushTestErrorWarning(state, entry);
      break;

    default:
      break;
  }

  function configObj(ent: LogEntry) {
    return entry.additionalInfo == null ? {} : yamlToObj(entry.additionalInfo);
  }

  function resetDefectExpectationUpdateStats() {
    // type 2 error
    if (state.errorExpectation != null && !state.expectedErrorEncoutered){
         if (inIteration && !state.iterationType2ErrorLogged){
            stats.iterationsWithType2Errors++;
            state.iterationType2ErrorLogged = true;
         }

         if (inTest && !state.testType2ErrorLogged) {
            stats.testsWithType2Errors++;
            state.testType2ErrorLogged = true;
         }

         if (!inIteration && !inTest){
           stats.outOfTestType2Errors++;
         }
         pushTestErrorWarning(state, entry, true);
      }
      else if (state.errorExpectation != null && state.expectedErrorEncoutered) {
         if (inIteration && !state.iterationKnownDefectLogged){
            stats.iterationsWithKnownDefects++;
            state.iterationKnownDefectLogged = true;
         }

         if (inTest && !state.testKnownDefectLogged){
            stats.testsWithKnownDefects++;
            state.testKnownDefectLogged = true;
         }

         if (!inIteration && !inTest){
           stats.outOfTestKnownDefects++;
         }
    }

    state.errorExpectation = null;
    state.expectedErrorEncoutered = false;
  }

   function iterationCommonReset() {
      state.apstate = {};
      state.validationInfo = {};
      state.iterationSummary = '';
      state.logItems = [];
      state.expectedErrorEncoutered = false;
      state.iterationErrorLogged = false;
      state.iterationWarningLogged = false;
      state.iterationType2ErrorLogged = false;
      state.validatorIssues = [];
      state.passedValidators = [];
   }

   function testCommonReset() {
      state.testErrorLogged = false;
      state.testType2ErrorLogged = false;
      iterationCommonReset() ;
   }

  let additionalInfo = entry.additionalInfo == null ? '' : entry.additionalInfo;
  const infoObj = () => yamlToObj(additionalInfo);
  switch (entry.subType) {
    case 'FilterLog':
      state.filterLog = filterLog(additionalInfo);
      break;

    case 'RunStart':
      // other state changes handled in reseter
      resetDefectExpectationUpdateStats();
      state.runConfig = configObj(entry);
      state.runName = state.runConfig.name;
      state.indent = 1;
      break;

    case 'TestStart':
      // other state changes handled in reseter
      resetDefectExpectationUpdateStats();
      const defEmpty = (s?: string) => def(s, '');
      state.testConfig = infoObj();
      state.testStart = def(entry.timestamp, '');
      state.testKnownDefectLogged = false;
      state.indent = 3;
      testCommonReset();
      break;

    case 'IterationStart':
      // other state changes handled in reseter
      resetDefectExpectationUpdateStats();
      let info = infoObj();
      state.iterationStart = def(entry.timestamp, '');
      state.iterationKnownDefectLogged = false;
      state.iterationConfig = _.pick(info, ['id', 'when', 'then']);
      state.testItem = info;
      break;

    case 'InteractorStart':
      switchErrorInfoStage(state, 'InTest', EXECUTING_INTERACTOR_STR);
      state.indent = 3;
      break;

    case 'PrepValidationInfoStart':
      switchErrorInfoStage(state, 'InTest', 'Preparing Validator State');
      break;

    case 'ValidationStart':
      switchErrorInfoStage(state, 'OutOfTest', 'Before Validator');
      state.validationInfo = configObj(entry);
      break;

    case 'ValidatorStart':
      switchErrorInfoStage(state, 'Validation', def(entry.message, 'unnamed validator'));
      break;

    case 'ValidatorEnd':
      let activeIssues = state.activeIssues;
      if (activeIssues != null && !hasIssues(activeIssues, false)){
        state.passedValidators.push(activeIssues.name);
      }
      switchErrorInfoStage(state, 'OutOfTest', 'After Validator');
      break;

    case 'ValidationEnd':
      break;

    case 'StartSummary':
      // other state changes handled in reseter
      switchErrorInfoStage(state, 'InTest', 'Generating Summary');

    case 'Summary':
      state.iterationSummary = def(entry.message, '');
      break;

    case 'IterationEnd':
      if (!state.iterationErrorLogged){
         stats.passedIterations++;
      }
      switchErrorInfoStage(state, 'OutOfTest', 'After Iteration');
      stats.iterations++;
      state.indent = 2;
      state.iterationConfig = null;
      iterationCommonReset();
      clearErrorInfo(state);
      switchErrorInfoStage(state, 'OutOfTest', 'out of test');
      break;

    case 'TestEnd':
      stats.testCases++;
      if (!state.testErrorLogged){
         stats.passedTests++;
      }
      state.indent = 1;
      state.testConfig = null;
      testCommonReset();
      break;

    case 'RunEnd':
      resetDefectExpectationUpdateStats();
      state.indent = 0;
      break;

    case "StartDefect":
      let isActive = seekInObj(infoObj(), 'active');
      // only enable defect expectation if it is active
      if (isActive == null || isActive){
        state.errorExpectation = entry;
      }
      break;

    case "EndDefect":
      resetDefectExpectationUpdateStats();
      break;

    case 'Message':
    case 'CheckPass':
    case 'CheckFail':
    case 'Exception':
    case 'InteractorEnd':
    case 'PrepValidationInfoEnd':
      break;

    default:
      fail(`Incomplete case expresssion, missing subType: ${entry.subType}`);
      break;
  }

  state.indent = entry.popControl === 'PushFolder' ? state.indent + FOLDER_NESTING[entry.popControl] : state.indent;
  return state;
}

function filterLog(str: string) {

  function cleanUpKey(acc, val, key) {
    acc[subStrBefore(key, '.js')] = val;
    return acc;
  }

  let filterLog = yamlToObj(str),
      result = _.reduce(filterLog, cleanUpKey, {}),
      logKeys = _.keys(result).sort();

   return reorderProps(result, ...logKeys);
}

export function parseLogDefault(fullPath: string): FullSummaryInfo {
  let fullSummary: FullSummaryInfo = {
    rawFile: '',
    elementsFile: '',
    testSummaries: {},
    runSummary: null
  };
  parseLog(fullPath, summariseLog(fullPath, fullSummary), initalState(fullPath));
  return fullSummary;
}

export function parseLog<S>(fullPath: string, step: (S, LogEntry) => S, initState: S){
   logSplitter(fullPath, parser(step, initState) );
}

function parser<S>(step: (S, LogEntry) => S, initialState: S): (str: string) => void {
  let currentState = initialState;
  return (str: string) => {

    let yml = false;
    try {
      let entry = yamlToObj(str);

      yml = true;
      currentState = step(currentState, entry);

    } catch (e) {
      fail(`Log parser failure - could not process log item - ${yml ? 'Failed processing step' : 'failed parsing YAML'}: `
              +  newLine()
              + str + newLine(2)
              + 'Exception was:' + newLine()
              + toString(e)
             )
    }
  }
}

export function logSplitter(fullPath: string, itemParser: string => void ): void {
  let buffer = [];

  function processBuffer() {
    let entry = buffer.join(newLine());
    itemParser(entry);
    buffer = [];
  }

  function processLine(line) {
    if (line.startsWith(RECORD_DIVIDER)){
      processBuffer();
    }
    else {
      buffer.push(line);
    }
  }

  eachLine(fullPath, processLine);
}
