//@flow

import {debug, areEqual, yamlToObj, reorderProps, def, fail, ensure} from '../lib/SysUtils';
import type { PopControl, LogSubType, LogLevel, LogEntry } from '../lib/Logging';
import { RECORD_DIVIDER, FOLDER_NESTING } from '../lib/Logging';
import { newLine, toString, subStrBefore, replace, hasText } from '../lib/StringUtils';
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
    warnings: 0
  };
}

export type State = {|
  runStats: Stats,
  filterLog: {[string]: string},
  runName: string,
  runConfig: {},
  inRun: boolean,

  inTest: boolean,
  testWarning: boolean,
  testError: boolean,
  testKnownDefect: boolean,

  inIteration: boolean,
  inInteractor: boolean,
  inValidation: boolean,

  iterationSummary: string,
  indent: number,
  testConfig: {},
  iterationConfig: {},

  expectError: boolean,
  errorExpectation: string,
  expectedErrorEncoutered: false,

  iterationSummary: string,
  apstate: {},
  validationInfo: {},
  logItems: [],

  errors: Array<LogEntry>,
  warnings: Array<LogEntry>,
  expectedErrors: Array<LogEntry>,
  type2Errors: Array<LogEntry>,
  logItems: Array<LogEntry>
|};

export const initalState: () => State = () => {
  return {
    runStats: nullStats(),
    filterLog: {},
    runName: '',
    runConfig: {},

    inRun: false,

    inTest: false,
    testWarning: false,
    testError: false,
    testKnownDefect: false,

    inIteration: false,
    inInteractor: false,
    inValidation: false,

    iterationSummary: '',

    indent: 0,
    testConfig: {},
    iterationConfig: {},

    expectError: false,
    errorExpectation: '',
    expectedErrorEncoutered: false,

    iterationSummary: '',
    apstate: {},
    validationInfo: {},

    errors: [],
    warnings: [],
    expectedErrors: [],
    type2Errors: [],
    logItems: []
  };
}


//todo: mocks
//todo: rewrite with summary
//todo: issues
//todo: summary


// this is were things get concrete
export function defaultStep(rawPath: string, destDir?: string): (State, LogEntry) => State {

  const RAW_FRAG = '.raw.';
  const subSteam = (s) => {
    let resultPath = replace(rawPath, RAW_FRAG, '.' + s + '.'),
        fileName = fileOrFolderName(resultPath);

    resultPath = combine(def(destDir, logFile()), fileName);
    console.log(`log path- ${resultPath}`)
    let result =  fs.createWriteStream(resultPath);
    return result;
  }


  ensure(hasText(rawPath, RAW_FRAG, true), `rawPath does not conform to naming conventions (should contain ${RAW_FRAG}) ${rawPath}`)

  let fullStream = subSteam('full');

  function writeFull(data) {
    let str = toString(data);
    fullStream.write(str + newLine());
  }

  const startRun = (state: State) => {
    debug(state);
    let config = _.cloneDeep(state.runConfig);
    config.runItems = [];
    writeFull(config);
    console.log('Item written');
  }

  const startTest = (state: State) => {

  }

  const startIteration = (state: State) => {

  }

  const endIteration = (state: State) => {

  }


  const endTest = (state: State) => {

  }

  const endRun = (state: State) => {
    console.log('before end');
    fullStream.end('run Complete');
    console.log('end');
  }

  return makeStep(processEntry,
                  reset,
                  startRun,
                  startTest,
                  startIteration,
                  endIteration,
                  endTest,
                  endRun);
}

// update the state without resetting anything
function processEntry(state: State, entry: LogEntry): State {

  let stats = state.runStats;
  state.indent = state.indent + FOLDER_NESTING[entry.popControl];
  state.logItems.push(entry);

  switch (entry.level) {
    case 'error':
      if (state.expectError) {
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

  function configObj(ent: LogEntry) {
    return entry.additionalInfo == null ? {} : yamlToObj(entry.additionalInfo);
  }

  switch (entry.subType) {
    case 'FilterLog':
      state.filterLog = filterLog(entry.additionalInfo == null ? '' : entry.additionalInfo);
      break;

    case 'RunStart':
      // other state changes handled in reseter
      state.runConfig = configObj(entry);
      state.runName = state.runConfig.name;
      break;

    case 'TestStart':
      // other state changes handled in reseter
      state.testConfig = configObj(entry);
      break;

    case 'IterationStart':
      // other state changes handled in reseter
      state.iterationConfig = configObj(entry);
      break;

    case 'IterationStart':
        // other state changes handled in reseter
        state.iterationConfig = configObj(entry);
        break;

    case 'Summary':
        // other state changes handled in reseter
        state.inValidation = false;
        state.iterationSummary = def(entry.message, '');
        break;

    case 'InteractorStart':
        state.inInteractor = true;
        break;

    case 'ValidationStart':
        state.inValidation = true;
        state.inInteractor = false;
        state.validationInfo = configObj(entry);
        break;

    case 'IterationEnd':
    case 'TestEnd':
    case 'RunEnd':
    case 'Message':
    case 'CheckPass':
    case 'CheckFail':
    case 'Exception':
      // actions handled in reset / message handled by earlier code
      break;

    case "StartDefect":
      state.expectError = true;
      state.errorExpectation = def(entry.message, '');
      break;

    case "EndDefect":
      state.expectError = false;
      state.errorExpectation = '';
      break;

    default:
      fail(`Incomplete case expresssion, missing subType: ${entry.subType}`);
      break;
  }

  return state;
}

function reset(state: State, entry: LogEntry): State {

  function errorCommonReset() {
    state.expectError = false;
    state.errorExpectation = '';
    state.expectedErrorEncoutered = false;
    state.errors = [];
    state.warnings = [];
    state.expectedErrors = [];
    state.type2Errors = [];
  }

  function iterationCommonReset() {
    state.apstate = {};
    state.validationInfo = {};
    state.iterationSummary = '';
    state.logItems = [];
    state.iterationConfig = {};
    state.expectedErrorEncoutered = false;
    state.inValidation = false;
    state.inInteractor = false;
    errorCommonReset();
  }

  function testCommonReset() {
    state.expectedErrorEncoutered = false;
    state.logItems = [];
    state.testWarning = false;
    state.testError = false;
    state.testKnownDefect = false;
    errorCommonReset();
  }

  switch (entry.subType) {
    case 'RunStart':
      state.indent = 0;
      state.inRun = true;
      break;

    case 'RunEnd':
      state.indent = 0;
      state.inRun = false;
      break;

    case 'TestStart':
      state.indent = 1;
      state.inTest = true;
      testCommonReset();
      break;

    case 'TestEnd':
      state.indent = 0;
      state.inTest = false;
      state.testConfig = {};
      testCommonReset();
      break;

    case 'IterationStart':
      state.indent = 2;
      state.inIteration = true;
      iterationCommonReset();
      break;

    case 'IterationEnd':
      state.indent = 1;
      state.inIteration = false;
      iterationCommonReset();
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

      default:
        break;
    }

    let newState: S = onEntry(state, entry);

    switch (entry.subType) {
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



export const parseLogDefault = (fullPath: string) => parseLog(fullPath, defaultStep(fullPath), initalState());

export const parseLog = <S>(fullPath: string, step: (S, LogEntry) => S, initState: S) => logSplitter(fullPath, parser(step, initState) );

function parser<S>(step: (S, LogEntry) => S, initialState: S): (str: string) => void {
  let currentState = initialState;

  return (str: string) => {
    try {
      let entry = yamlToObj(str);
      currentState = step(currentState, entry);
    } catch (e) {
      fail('Log parser failure - could not process: '
              +  newLine()
              + str + newLine(2)
              + 'Exception was:' + newLine()
              + toString(e)
             )
    }
  }
}

export function logSplitter(fullPath: string, itemParser: string => void ): void {
  var lineNumber = 0,
      buffer = [];

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
