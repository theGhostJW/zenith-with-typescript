//@flow

import {debug, areEqual, yamlToObj, reorderProps, def, fail, ensure, objToYaml } from '../lib/SysUtils';
import type { PopControl, LogSubType, LogLevel, LogEntry } from '../lib/Logging';
import { RECORD_DIVIDER, FOLDER_NESTING } from '../lib/Logging';
import { newLine, toString, subStrBefore, replace, hasText, appendDelim} from '../lib/StringUtils';
import * as _ from 'lodash';
import * as fs from 'fs';
import { combine, logFile, fileOrFolderName, eachLine, toTemp } from '../lib/FileUtils';
import * as DateTime from '../lib/DateTimeUtils';
import moment from 'moment';

/*
timestamp: '2017-10-01 13:46:27'
level: info
subType: RunStart
popControl: PushFolder
message: 'Test Run: Test Test Run',
link: ?string,
callstack: any
additionalInfo: |
  name: Test Test Run
  country: Australia
  environment: TST
  testCases: []
  depth: Regression
 */

// Need this info to pattern match
// - after type erasure
 const RUN_ELEMENT_TYPE = {
   RunSummary: 0,
   TestSummary: 1,
   Iteration: 2,
   OutOfTestIssues: 3
 };

 type RunElementType = $Keys<typeof RUN_ELEMENT_TYPE>

 export type RunSummary = {|
   name: string,
   elementType: 0,
   rawLog: string,
   runConfig: {},
   startTime: string,
   endTime:  string,
   duration: string,
   filterLog: {[string]: string},
   stats: RunStats
 |}

 export type TestSummary = {|
   file: string,
   elementType: 1,
   testConfig: {},
   startTime: string,
   endTime:  string,
   duration: string,
   stats: TestStats
 |}

 const STATE_STAGE = {
   Validation: 'validation',
   InTest: 'in test',
   OutOfTest: 'out of test'
 };

 type StateStage = $Keys<typeof STATE_STAGE>;

 export type ErrorsWarningsDefects = {
   name: string,
   infoType: StateStage,
   warnings: Array<LogEntry>,
   errors: Array<LogEntry>,
   type2Errors: Array<LogEntry>,
   knownDefects: Array<LogEntry>
 }

 export type IssuesList = Array<ErrorsWarningsDefects>;

 export type Iteration = {|
   startTime: moment$Moment,
   endTime:  moment$Moment,
   duration: moment$Moment,
   elementType: 2,
   testFile: string,
   testConfig: {},
   item: {},
   summary: string,
   apState: {},
   issues: IssuesList,

   stats: TestStats
 |}

 export type OutOfTestIssues = {
   elementType: 3,
   issues: IssuesList
 };

export type RunElement = RunSummary | TestSummary | Iteration | OutOfTestIssues;

export type FullSummaryInfo = {
  testSummaries: {[string]: TestSummary},
  runSummary: ?RunSummary
}

// create a log file of run elements and a summary object
// for second pass
function firstPassElementHandler(destPath: string): (e: RunElement) => FullSummaryInfo {

   let result: FullSummaryInfo = {
                                   testSummaries: {},
                                   runSummary: null
                                };

   let writer = fileWriter(destPath),
       write = (data) => writer(data, 0, newLine() + RECORD_DIVIDER + newLine(), false, false);

   return function nextElement(element: RunElement): FullSummaryInfo {

     switch (element.elementType) {
      case 0: // RunSummary
         result.runSummary = element;
      break;

      case 1: // TestSummary ;
         result.testSummaries[element.file] = element;
      break;

      default: // Iteration | OutOfTestIssues;
        write(element);
     }
     
     return result;
   }
}

export type TestStats = {|
  iterations: number,
  passedIterations: number,
  failedIterations: number,
  iterationsWithWarning: number,
  iterationsWithKnownDefects: number
|};

type RunStats =  {|
  testCases: number,
  passedTests: number,
  failedTests: number,
  testsWithWarning: number,
  testsWithKnownDefects: number,

  iterations: number,
  passedIterations: number,
  failedIterations: number,
  iterationsWithWarning: number,
  iterationsWithKnownDefects: number,

  inTestErrors: number,
  inTestWarnings: number,
  outOfTestErrors: number,
  outOfTestWarnings: number,

  knownDefects: number,
  type2Errors: number
|};

const nullStats: () => RunStats = () => {

  return {
    testCases: 0,
    passedTests: 0,
    failedTests: 0,
    testsWithWarning: 0,
    testsWithKnownDefects: 0,

    iterations: 0,
    passedIterations: 0,
    failedIterations: 0,
    iterationsWithWarning: 0,
    iterationsWithKnownDefects: 0,

    inTestErrors: 0,
    inTestWarnings: 0,

    outOfTestErrors: 0,
    outOfTestWarnings: 0,

    knownDefects: 0,
    type2Errors: 0
  };
}

export type LogTestConfig = {
  id: number,
  when: string,
  then: string,
  script: string,
}

export type LogIterationConfig = {
  id: number,
  when: string,
  then: string
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

function hasIssues(val: ErrorsWarningsDefects, includeKnownDefects: boolean = true) {
  return  val.errors.length > 0 ||
          val.warnings.length > 0 ||
          val.type2Errors.length > 0 ||
          (includeKnownDefects && val.knownDefects.length > 0);
}

export type RunState = {|
  runStats: RunStats,
  filterLog: {[string]: string},
  runName: string,
  runConfig: {},
  timestamp: string,
  inRun: boolean,

  inTest: boolean,
  testWarning: boolean,
  testError: boolean,
  testKnownDefect: boolean,

  inIteration: boolean,
  inValidation: boolean,

  iterationSummary: string,
  indent: number,
  testConfig: LogTestConfig,
  iterationConfig: LogIterationConfig,

  errorExpectation: ?LogEntry,
  expectedErrorEncoutered: false,

  iterationIndex: number,
  iterationSummary: string,
  apstate: {},
  validationInfo: {},
  logItems: [],

  errors: Array<LogEntry>,
  warnings: Array<LogEntry>,
  expectedErrors: Array<LogEntry>,
  type2Errors: Array<LogEntry>,
  logItems: Array<LogEntry>,

  validatorIssues: Array<ErrorsWarningsDefects>,
  inTestIssues: Array<ErrorsWarningsDefects>,
  outOfTestIssues: Array<ErrorsWarningsDefects>,

  activeIssues: ?ErrorsWarningsDefects
|};


function emptyTestConfig() {
  return {
           id: -99999,
           when: '',
           then: '',
           script: ''
         };
}

function emptyIterationConfig() {
  return {
           id: -99999,
           when: '',
           then: '',
         };
}

export const initalState: () => RunState = () => {
  let result: RunState = {
                runStats: nullStats(),
                filterLog: {},
                runName: '',
                runConfig: {},
                timestamp: '',

                inRun: false,

                inTest: false,
                testWarning: false,
                testError: false,
                testKnownDefect: false,

                inIteration: false,
                inValidation: false,

                iterationSummary: '',

                indent: 0,
                testConfig: emptyTestConfig(),

                iterationConfig: emptyIterationConfig(),

                errorExpectation: null,
                expectedErrorEncoutered: false,

                iterationIndex: 0,
                apstate: {},
                validationInfo: {},

                errors: [],
                warnings: [],
                expectedErrors: [],
                type2Errors: [],

                logItems: [],
                validatorIssues: [],
                inTestIssues: [],
                outOfTestIssues: [],

                //this are flipped depending on what state we are in
                activeIssues: null

              };

  switchErrorInfoStage(result, 'OutOfTest', 'out of test');
  return result;
}

function switchErrorInfoStage(state: RunState, stage: StateStage, name: string): void {

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


//todo: mocks
//todo: rewrite with summary
//todo: issues
//todo: summary
//


function valToStr(val: ?ErrorsWarningsDefects): ?string {
  if (val == null) {
    return null;
  }

  let {
        errors,
        type2Errors,
        warnings,
        knownDefects
      } = val,
      result = {
        errors: errors,
        'type 2 errors': type2Errors,
        warnings: warnings,
        knownDefects: knownDefects
      },
      pairs = _.chain(result)
                    .toPairs()
                    .filter(p => p[1].length > 0)
                    .value();

    if ( pairs.length == 0 ) {
      return null;
    }
    else {
      let nonNull = _.pick(result, _.map(pairs, p => p[0]));
      debug(JSON.stringify(pairs), 'Pairs');
      debug(JSON.stringify(nonNull), 'NonNull');

      return objToYaml(
       val.name == null ? nonNull : {
        [val.name]: nonNull
      });
    }
}


let done = false;

// function validationText(state: RunState): string {
//
//   if (!done)
//     toTemp(state);
//
//   let {
//       validatorIssues,
//       inTestIssues,
//
//       activeInteractor,
//       outOfTestIssues
//     } = state,
//     resultObj = {};
//
//   function addItemsToResult(items, propName) {
//     let strs = _.compact(items.map(valToStr));
//     if (strs.length > 0){
//       resultObj[propName] = strs;
//     }
//   }
//
//   function addSingleValToResult(item, propName) {
//     let str = valToStr(item);
//     if (str != null){
//       resultObj[propName] = str;
//     }
//   }
//
//   addSingleValToResult(activeInteractor, 'interactor issues');
//   addItemsToResult(validatorIssues, 'validators');
//   debug(resultObj, 'validators');
//   addItemsToResult(inTestIssues, 'other test errors');
//   addSingleValToResult(outOfTest, 'out of test errors');
//
//   done = true;
//   return objToYaml(resultObj);
// }
//
//   function iterationInfo(state: RunState){
  //
  //   let testConfig = state.testConfig,
  //       iterationConfig = state.iterationConfig,
  //       when = def(iterationConfig.when, testConfig.when),
  //       then = def(iterationConfig.then, testConfig.then),
  //       data =
  //         `iteration: ${testConfig.id} / ${iterationConfig.id} - When ${when} then ${then}` + newLine() +
  //         `validations: \n\t ${validationText(state)}`;
  //   return data;
  // }

function destPath(rawPath: string, sourceFilePart: string, destFilePart: string, destDir?: string): string {
  sourceFilePart = '.' + sourceFilePart + '.';

  ensure(hasText(rawPath, sourceFilePart, true), `rawPath does not conform to naming conventions (should contain ${sourceFilePart}) ${rawPath}`);

  let resultPath = replace(rawPath, sourceFilePart, '.' + destFilePart + '.'),
      fileName = fileOrFolderName(resultPath);

  return combine(def(destDir, logFile()), fileName);
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

// this is were things get concrete
export function logGenerationStep(rawPath: string, destDir?: string): (RunState, LogEntry) => RunState {

  let rsltPath = destPath(rawPath, 'raw', 'full', destDir),
      writeFull = fileWriter(rsltPath),
      headerWritten = false;

  function startRun(state: RunState) {
    let {logItems, runConfig, errors, warnings} = state,
        timestamp: string = state.timestamp,
        entry = {
          'run configuration': runConfig,
          preRunErrors: errors.length > 0 ? errors : undefined,
          preRunWarnings: warnings.length > 0 ? warnings:  undefined
        },
        str = `start time: ${timestamp}` + newLine(2) +
              objToYaml(entry) + newLine() +
              'tests:';

        writeFull(str, state.indent, '', false);
   }

   function makeErrorWriter(prefix: string, indent: number, addSeparatorLine: boolean): (string, Array<LogEntry>) => boolean {
      return function writeError(tag: string, logItems: Array<LogEntry>) {
        let hasItems = logItems.length > 0;
        if (hasItems){
          let info = {},
              lineCount = addSeparatorLine ? 1 : 2;
          info[`${prefix} ${tag}`] = logItems;
          writeFull(info, indent, newLine(lineCount), true)
        }
        return hasItems;
      }
   }

   function writeOutOfTestErrorsWarnings(state: RunState, addSeparatorLine: boolean): boolean {
     let {type2Errors, errors, warnings, indent} = state,
         errorWriter = makeErrorWriter('out of test', indent, addSeparatorLine);

     return errorWriter('errors', errors) ||
            errorWriter('type2Errors', type2Errors) ||
            errorWriter('warnings', warnings);
   }

  function startTest(state: RunState) {
    let {id, when, then, script} = state.testConfig,
        hasOutOfTestInfo = writeOutOfTestErrorsWarnings(state, false),
        info = `test: ${id} - ${script} - When ${when} then ${then}` + newLine() +
                `timestamp: ${state.timestamp}` + newLine() +
                'iterations:'

    writeFull(info, state.indent, newLine(), true, state.runStats.testCases > 0 || hasOutOfTestInfo);
  }


  function startIteration(state: RunState) {
    writeOutOfTestErrorsWarnings(state, true);
  }

  function endIteration(state: RunState) {
    //writeFull(iterationInfo(state), state.indent + 1, newLine(), true, state.iterationIndex > 0);
  }

  function endTest(state: RunState) {

  }

  function endRun(state: RunState) {
    writeFull({
                'filter log': state.filterLog
              }, 0, newLine(2));
  }

  return makeStep(stateChangeStep,
                  reset,
                  startRun,
                  startTest,
                  startIteration,
                  endIteration,
                  endTest,
                  endRun);
}


function pushTestErrorWarning(state: RunState, entry: LogEntry, isType2: boolean = false): void {
  let level = entry.level,
      errorSink = state.activeIssues,
      stats = state.runStats;

  if(errorSink == null){
    fail( `parser error - no active error / wanring sink at entry: ${toString(entry)}`);
  }
  else {

    let {warnings, errors, type2Errors, knownDefects} = errorSink,
        errArrray = [],
        stage = errorSink.infoType,
        inTest = stage !== 'outOfTest';

    if (isType2) {
      stats.type2Errors++;
      errArrray = type2Errors;
    }
    else if (level === 'error' && state.errorExpectation != null){
      //toDo: include errorExpectation
      stats.knownDefects++;
      errArrray = knownDefects;
    }
    else if (level === 'error'){
      if (inTest){
        stats.inTestErrors++;
      }
      else {
        stats.outOfTestErrors++;
      }
      errArrray = errors;
    }
    else if (level === 'warn'){
      if (inTest){
        stats.inTestWarnings++;
      }
      else {
        stats.outOfTestWarnings++;
      }
      errArrray = warnings;
    }
    else {
      fail('pushTestErrorWarning - not an not in valid state: ' + toString(entry));
    }

    errArrray.push(entry);
  }
}

// update the state without resetting anything
function stateChangeStep(state: RunState, entry: LogEntry): RunState {

  let stats = state.runStats;
  state.timestamp = def(entry.timestamp, state.timestamp);

  state.indent = entry.popControl === 'PopFolder' ? state.indent + FOLDER_NESTING[entry.popControl] : state.indent;
  state.logItems.push(entry);

  switch (entry.level) {
    case 'error':
    case 'warn':
      pushTestErrorWarning(state, entry);
      break;

    default:
      break;
  }

  function configObj(ent: LogEntry) {
    return entry.additionalInfo == null ? {} : yamlToObj(entry.additionalInfo);
  }

  function resetDefectExpectation() {
    if (state.errorExpectation != null && !state.expectedErrorEncoutered){
      stats.type2Errors++;
      state.type2Errors.push(state.errorExpectation);
      pushTestErrorWarning(state, entry, true);
    }
    state.errorExpectation = null;
  }

  let additionalInfo = entry.additionalInfo == null ? '' : entry.additionalInfo;
  const infoObj = () => yamlToObj(additionalInfo);
  switch (entry.subType) {
    case 'FilterLog':
      state.filterLog = filterLog(additionalInfo);
      break;

    case 'RunStart':
      // other state changes handled in reseter
      resetDefectExpectation();
      state.runConfig = configObj(entry);
      state.runName = state.runConfig.name;
      break;

    case 'TestStart':
      // other state changes handled in reseter
      resetDefectExpectation();
      const defEmpty = (s?: string) => def(s, '');
      let testConfig = _.pick(infoObj(), ['id', 'when', 'then','script']);
      state.testConfig = testConfig;
      state.iterationIndex = -1;
      break;

    case 'IterationStart':
      // other state changes handled in reseter
      resetDefectExpectation();
      state.iterationConfig = _.pick(infoObj(), ['id', 'when', 'then']);
      state.iterationIndex++;
      break;

    case 'InteractorStart':
      switchErrorInfoStage(state, 'InTest', 'Executing Interactor');
      break;

    case 'PrepValidationInfo':
      switchErrorInfoStage(state, 'InTest', 'Preparing Validator State');
      break;

    case 'ValidationStart':
      switchErrorInfoStage(state, 'OutOfTest', 'Before Validator');
      state.inValidation = true;
      state.validationInfo = configObj(entry);
      break;

    case 'ValidatorStart':
      switchErrorInfoStage(state, 'Validation', def(entry.message, 'unnamed validator'));
      break;

    case 'ValidatorEnd':
      switchErrorInfoStage(state, 'OutOfTest', 'After Validator');
      break;

    case 'ValidationEnd':
      state.inValidation = false;
      break;

    case 'StartSummary':
      // other state changes handled in reseter
      switchErrorInfoStage(state, 'InTest', 'Generating Summary');
      state.inValidation = false;

    case 'Summary':
      state.iterationSummary = def(entry.message, '');
      break;

    case 'IterationEnd':
      switchErrorInfoStage(state, 'OutOfTest', 'After Iteration');
      stats.iterations++;
      break;

    case 'TestEnd':
      stats.testCases++;
      break;

    case 'RunEnd':
      resetDefectExpectation();

    case 'Message':
    case 'CheckPass':
    case 'CheckFail':
    case 'Exception':
      // actions handled in reset / message handled by earlier code
      break;

    case "StartDefect":
      state.errorExpectation = entry;
      break;

    case "EndDefect":
      resetDefectExpectation();
      break;

    default:
      fail(`Incomplete case expresssion, missing subType: ${entry.subType}`);
      break;
  }

  return state;
}

function reset(state: RunState, entry: LogEntry): RunState {

  state.indent = entry.popControl === 'PushFolder' ? state.indent + FOLDER_NESTING[entry.popControl] : state.indent;

  function errorCommonReset() {
    state.errorExpectation = null;
    state.expectedErrorEncoutered = false;
    state.errors = [];
    state.warnings = [];
    state.expectedErrors = [];
    state.type2Errors = [];
  }

  function validationReset() {
    state.validatorIssues = [];
  }

  function iterationCommonReset() {
    state.apstate = {};
    state.validationInfo = {};
    state.iterationSummary = '';
    state.logItems = [];
    state.expectedErrorEncoutered = false;
    state.inValidation = false;
    validationReset();
    errorCommonReset();
  }

  function testCommonReset() {
    state.expectedErrorEncoutered = false;
    state.logItems = [];
    state.testWarning = false;
    state.testError = false;
    state.testKnownDefect = false;
    state.validatorIssues = [];
    validationReset();
    errorCommonReset();
  }

  switch (entry.subType) {
    case 'RunStart':
      state.indent = 1;
      state.inRun = true;
      break;

    case 'RunEnd':
      state.indent = 0;
      state.inRun = false;
      break;

    case 'TestStart':
      state.indent = 3;
      state.inTest = true;
      testCommonReset();
      break;

    case 'TestEnd':
      state.indent = 1;
      state.inTest = false;
      state.testConfig = emptyTestConfig();
      testCommonReset();
      break;

    case 'IterationStart':
      state.indent = 3;
      state.inIteration = true;
      break;

    case 'IterationEnd':
      state.indent = 2;
      state.inIteration = false;
      state.iterationConfig = emptyIterationConfig();
      iterationCommonReset();
      clearErrorInfo(state);
      switchErrorInfoStage(state, 'OutOfTest', 'out of test');
      break;

    default:
      break;
  }

  return state;
}


function makeStep<S>(onEntry:(S, LogEntry) => S,
                    afterEntry:(S, LogEntry) => S,
                    startRun: S => void,
                    startTest: S => void,
                    startIteration: S => void,
                    endIteration: S => void,
                    endTest: S => void,
                    endRun: S => void): (S, LogEntry) => S {

  return function step(state, entry) {

    let newState: S = onEntry(state, entry);


    switch (entry.subType) {
      case 'IterationStart':
        startIteration(state);
        break;

      case 'TestStart':
        startTest(state);
        break;

      case 'RunStart':
        startRun(state);
        break;

      case 'IterationEnd':
        endIteration(newState);
        break;

      case 'TestEnd':
        endTest(newState);
        break;

      case 'RunEnd':
        endRun(newState);
        break;

      default:
        break;
    }

    return afterEntry(newState, entry);
  }
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


export const parseLogDefault = (fullPath: string) => parseLog(fullPath, logGenerationStep(fullPath), initalState());

export const parseLog = <S>(fullPath: string, step: (S, LogEntry) => S, initState: S) => logSplitter(fullPath, parser(step, initState) );

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
    if (line == RECORD_DIVIDER){
      processBuffer();
    }
    else {
      buffer.push(line);
    }
  }

  eachLine(fullPath, processLine);
}
