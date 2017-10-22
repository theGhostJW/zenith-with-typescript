//@flow

import {debug, areEqual, yamlToObj, reorderProps, def, fail, ensure, objToYaml } from '../lib/SysUtils';
import type { PopControl, LogSubType, LogLevel, LogEntry } from '../lib/Logging';
import { RECORD_DIVIDER, FOLDER_NESTING } from '../lib/Logging';
import { newLine, toString, subStrBefore, replace, hasText} from '../lib/StringUtils';
import * as _ from 'lodash';
import * as fs from 'fs';
import { combine, logFile, fileOrFolderName, eachLine } from '../lib/FileUtils';

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

export type Stats = {|
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
  knownDefects: number,

  outOfTestErrors: number,
  outOfTestWarnings: number,

  expectedErrors: number,
  type2Errors: number,
  warnings: number
|}

const nullStats = () => {

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
    knownDefects: 0,

    outOfTestErrors: 0,
    outOfTestWarnings: 0,

    expectedErrors: 0,
    type2Errors: 0,
    warnings: 0
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

export type VaidatorInfo = {
  name: string,
  warnings: Array<LogEntry>,
  errors: Array<LogEntry>,
  type2Errors: Array<LogEntry>
}

function emptyValidatorInfo(name: ?string): VaidatorInfo {
  return {
    name: def(name, 'Unamed Validator'),
    warnings: [],
    errors: [],
    type2Errors: []
  }
}

export type State = {|
  runStats: Stats,
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

  validatorItems: Array<VaidatorInfo>,

  activeValidator: ?VaidatorInfo,
  activeInteractor: ?VaidatorInfo,
  outOfTest: ?VaidatorInfo,
  activeErrorInfo: ?VaidatorInfo
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

export const initalState: () => State = () => {
  let result = {
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
                validatorItems: [],

                //this are flipped depending on what state we are in
                activeValidator: null,
                activeInteractor: null,
                outOfTest: null,
                activeErrorInfo: null
              };

  switchErrorInfoStage(result, 'outOfTest', 'out of test');
  return result;
}

type StateStage = 'activeValidator' | 'activeInteractor' | 'outOfTest';

function switchErrorInfoStage(state: State, stage: StateStage, name: string): void {
  state.activeValidator = null;
  state.activeInteractor = null;
  state.outOfTest = null;

  let newStageRec = emptyValidatorInfo(name);
  state[stage] = newStageRec;
  state.activeErrorInfo = newStageRec;
  if (stage === 'activeValidator'){
    state.validatorItems.push(newStageRec);
  }
}

function clearErrorInfo(state: State): void {
  state.activeValidator = null;
  state.activeInteractor = null;
  state.outOfTest = null;
}


//todo: mocks
//todo: rewrite with summary
//todo: issues
//todo: summary


// this is were things get concrete
export function logGenerationStep(rawPath: string, destDir?: string): (State, LogEntry) => State {

  const RAW_FRAG = '.raw.';
  function fileWriter(filePart){
    let resultPath = replace(rawPath, RAW_FRAG, '.' + filePart + '.'),
        fileName = fileOrFolderName(resultPath);

    resultPath = combine(def(destDir, logFile()), fileName);
    let fd = fs.openSync(resultPath, 'w');

    return function writer(data, indent: number, prefix = newLine(), inArray: boolean = false, arrayLineSeparator: boolean = false) {
      let str = toString(data);

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

  let writeFull = fileWriter('full'),
      headerWritten = false;

  ensure(hasText(rawPath, RAW_FRAG, true), `rawPath does not conform to naming conventions (should contain ${RAW_FRAG}) ${rawPath}`)

  function startRun(state: State) {
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

   function writeOutOfTestErrorsWarnings(state: State, addSeparatorLine: boolean): boolean {
     let {type2Errors, errors, warnings, indent} = state,
         errorWriter = makeErrorWriter('out of test', indent, addSeparatorLine);

     return errorWriter('errors', errors) ||
            errorWriter('type2Errors', type2Errors) ||
            errorWriter('warnings', warnings);
   }

  function startTest(state: State) {
    let {id, when, then, script} = state.testConfig,
        hasOutOfTestInfo = writeOutOfTestErrorsWarnings(state, false),
        info = `test: ${id} - ${script} - When ${when} then ${then}` + newLine() +
                `timestamp: ${state.timestamp}` + newLine() +
                'iterations:'

    writeFull(info, state.indent, newLine(), true, state.runStats.testCases > 0 || hasOutOfTestInfo);
  }

  function iterationInfo(state: State){

    let testConfig = state.testConfig,
        iterationConfig = state.iterationConfig,
        when = def(iterationConfig.when, testConfig.when),
        then = def(iterationConfig.then, testConfig.then),
        data =
          `iteration: ${testConfig.id} / ${iterationConfig.id} - When ${when} then ${then}` + newLine() +
          `validations: ${toString(state)}`;
    return data;
  }

  function startIteration(state: State) {
    writeOutOfTestErrorsWarnings(state, true);
  }

  function endIteration(state: State) {
    writeFull(iterationInfo(state), state.indent + 1, newLine(), true, state.iterationIndex > 0);
  }

  function endTest(state: State) {

  }

  function endRun(state: State) {
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

// update the state without resetting anything
function stateChangeStep(state: State, entry: LogEntry): State {

  let stats = state.runStats;
  state.timestamp = def(entry.timestamp, state.timestamp);

  state.indent = entry.popControl === 'PopFolder' ? state.indent + FOLDER_NESTING[entry.popControl] : state.indent;
  state.logItems.push(entry);

  switch (entry.level) {
    case 'error':
      if (state.errorExpectation != null) {
        state.expectedErrors.push(entry);
        stats.expectedErrors++;
      }
      else {
        state.errors.push(entry);
        if (state.inTest){
          stats.inTestErrors++;
        }
        else {
          stats.outOfTestErrors++;
        }
      }

      break;

    case 'warn':
      state.warnings.push(entry);
      stats.warnings++;
      break;

    default:
      break;
  }

  function configObj(ent: LogEntry) {
    return entry.additionalInfo == null ? {} : yamlToObj(entry.additionalInfo);
  }

  function pushInTestErrorWarning(state: State, entry: LogEntry, isType2: boolean = false): void {
    let level = entry.level,
        errorSink = state.activeErrorInfo;

    if(errorSink == null){
      fail( `parser error - no active error / wanring sink at entry: ${toString(entry)}`);
    }
    else {
      let {warnings, errors, type2Errors} = errorSink,
          errArrray = isType2 ? type2Errors :
                        level === 'error' ? errors :
                        level === 'warn' ? warnings : null;

      if (errArrray == null){
        fail('pushInTestErrorWarning - not an not in valid state: ' + toString(entry))
      }
      else {
        errArrray.push(entry);
      }
    }
  }

  function resetDefectExpectation() {
    if (state.errorExpectation != null && !state.expectedErrorEncoutered){
      stats.type2Errors++;
      state.type2Errors.push(state.errorExpectation);
      pushInTestErrorWarning(state, entry, true);
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

    case 'Summary':
      // other state changes handled in reseter
      state.inValidation = false;
      state.iterationSummary = def(entry.message, '');
      break;

    case 'InteractorStart':
      state.activeInteractor = emptyValidatorInfo('Interactor');
      break;

    case 'ValidationStart':
      state.inValidation = true;
      state.validationInfo = configObj(entry);
      break;

    case 'ValidationEnd':
      state.inValidation = false;
      break;

    case 'IterationEnd':
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

    case 'ValidatorStart':
      state.validatorItems = def(state.validatorItems, []);
      let valItem = emptyValidatorInfo(entry.message)
      state.activeValidator = valItem;
      state.validatorItems.push(valItem);
      break;

    case 'ValidatorEnd':
      state.activeValidator = null;
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

function reset(state: State, entry: LogEntry): State {

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
    state.validatorItems = [];
  }

  function iterationCommonReset() {
    state.apstate = {};
    state.validationInfo = {};
    state.iterationSummary = '';
    state.logItems = [];
    state.expectedErrorEncoutered = false;
    state.inValidation = false;
    state.activeInteractor = null;
    validationReset();
    errorCommonReset();
  }

  function testCommonReset() {
    state.expectedErrorEncoutered = false;
    state.logItems = [];
    state.testWarning = false;
    state.testError = false;
    state.testKnownDefect = false;
    state.validatorItems = [];
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
      switchErrorInfoStage(state, 'outOfTest', 'out of test');
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
