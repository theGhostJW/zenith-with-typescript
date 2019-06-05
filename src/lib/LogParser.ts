import {yamlToObj, reorderProps, def, fail, ensure, objToYaml, forceArray, seekInObj, failInfoObj} from './SysUtils';

import { RECORD_DIVIDER, timeStampedRawPath,
         PopControl, LogLevel, LogEntry } from './Logging';

import { newLine, show, subStrBefore, replaceAll, hasText} from './StringUtils';

import * as fs from 'fs';
import { combine, logFile, fileOrFolderName, eachLine, toMock } from './FileUtils';
import { FullSummaryInfo, RunStats, TestStats, ErrorsWarningsDefects,
              StateStage, IssuesList, RunState, Iteration, OutOfTestIssues } from '../lib/LogParserTypes';
import { summaryBlock, iteration, outOfTestError, script, filterLogText } from './LogFormatter';
const _ = require('lodash');

interface IterationInfo extends Iteration {
  passedValidators: string[],
 }

type IterationLogElement = IterationInfo | OutOfTestIssues;

export function elementsToFullMock<R>(summary: FullSummaryInfo, mockFileNameFunc: ((n: number, s: string, r: R) => string)): void {
  let  {
      rawFile,
      elementsFile,
      runSummary
    } = summary;

  let timeStampedPath = timeStampedRawPath(),
      fullWriter = fileRecordWriter(destPath(rawFile, 'raw', 'full'), newLine(2)),
      fullWriterTimestamped = fileRecordWriter(destPath(timeStampedPath, 'raw', 'full'), newLine(2)),
      issuesWriter = fileRecordWriter(destPath(rawFile, 'raw', 'issues'), newLine(2)),
      issuesWriterTimestamped = fileRecordWriter(destPath(timeStampedPath, 'raw', 'issues'), newLine(2));

  function writeAll(entry: string, writeIssue: boolean) {

    fullWriter(entry);
    fullWriterTimestamped(entry);

    if (writeIssue){
      issuesWriter(entry);
      issuesWriterTimestamped(entry);
    }

  }

  writeAll(summaryBlock(summary), true);

  let lastScript: string | null | undefined = '',
      logText = '';

  function processElement(elementStr: string) {
    let element = <IterationLogElement>yamlToObj(elementStr),
        isIssue = false,
        wantWriteMock = false;

    if ((<IterationInfo>element).passedValidators)  {
      logText = iteration(<any>element, summary, lastScript);
      lastScript = script(<any>element), 'script';
      let issuesList = element.issues;
      isIssue = issuesList != null && listHasIssues(issuesList);
      wantWriteMock = true;
    }
    else if (element.issues) {
      logText = outOfTestError(element);
      isIssue = true;
    }
    else {
      logText = `PARSER ERROR UNHANDLED ELEMENT TYPE \nElement Type: ${show(element)}\n\nFullElement:\n${show(element)}`
    }

    writeAll(logText, isIssue);

    if (wantWriteMock){
      let runConfig: R | undefined = (<any>def(runSummary, {})).runConfig;
      if (runConfig == null){
        writeAll(objToYaml(failInfoObj('elementsToFullMock parsing error ~ RunConfig is null')), isIssue);
      }
      else {
        writeMock(<any>element, runConfig, mockFileNameFunc)
      }
    }
  }

  logSplitter(elementsFile, processElement);
  writeAll(filterLogText(summary), true);
}

function writeMock<R>(iteration: Iteration, runConfig: R, mockFileNameFunc: (itemId: number, testName: string, r: R) => string) {

 let item = def(seekInObj(iteration, 'item'), {}),
     script = show(def(seekInObj(iteration, 'testConfig', 'script'), 'ERR_NO_SCRIPT')),
     id = (<any>item).id,
     destFile = mockFileNameFunc(id, script + '.js', runConfig),  // script has extension removed TODO: investigate fix properly - what if we leave it on
     mockInfo = {
                 runConfig: runConfig,
                 apState: seekInObj(iteration, 'apState'),
                 item: item
               };
    toMock(mockInfo, destFile);
}

export const EXECUTING_INTERACTOR_STR = 'Executing Interactor';

 function fileRecordWriter(destPath: string, separator: string = '\n' + RECORD_DIVIDER + '\n' ): (content: {} | string, overrideSeparator?: string) => void {
    let writer = fileWriter(destPath);
    return function writeToFile(content: {} | string, overrideSeparator?: string) {
        writer(content, 0, def(overrideSeparator, separator), false, false);
    }
 }

 function emptyTestStats(): TestStats {
   return {
     iterations: 0,
     passedIterations: 0,
     iterationsWithErrors: 0,
     iterationsWithType2Errors: 0,
     iterationsWithWarnings: 0,
     iterationsWithKnownDefects: 0
   };
 }

 function rawToElements(rawPath: string, fullSummary: FullSummaryInfo): (rs:RunState, le:LogEntry) => RunState {

   let resultPath = destPath(rawPath, 'raw', 'elements'),
       writeToFile = fileRecordWriter(resultPath),
       lastRunStats: RunStats = nullRunStats();

   fullSummary.rawFile = rawPath;
   fullSummary.elementsFile = resultPath;

   function calcUpdateTestStats(state: RunState): TestStats {
      let runStats = state.runStats;

      function runStatsDelta(testStasKey: string) {
        let result = (<any>runStats)[testStasKey] - (<any>lastRunStats)[testStasKey];
        return result;
      }

      let result = _.mapValues(emptyTestStats(), (v:any, k:any) => runStatsDelta(k));
      lastRunStats = _.cloneDeep(runStats);
      return result;
   }

   function logOutOfTestIssues(state: RunState) {
      if (listHasIssues(state.outOfTestIssues)){
         let issues: OutOfTestIssues = {
                        issues: state.outOfTestIssues.filter(i => hasIssues(i))
                     };
         writeToFile(issues);
      }
   }


   return function step(state: RunState, entry: LogEntry): RunState {

     switch (entry.subType) {
       case 'IterationEnd':
        logOutOfTestIssues(state);

         let issues: ErrorsWarningsDefects[] = forceArray(state.inTestIssues, state.validatorIssues);
         issues = issues.filter(i => hasIssues(i));

         let iterationInfo: IterationInfo = {
           startTime: state.iterationStart,
           endTime: def(entry.timestamp, <string>''),
           testConfig: <any>state.testConfig, // assume defined by now coerce to non null value
           item: <any>state.testItem, // assume defined by now coerce to non null value
           mocked: state.mocked,
           dState: def(seekInObj(state, 'validationInfo', 'dState'), ''),
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
               endTime:  def(entry.timestamp, <string>''),
               stats: calcUpdateTestStats(state)
             };
          fullSummary.testSummaries[cfg.script] = testInfo;
          break;

       case 'RunEnd':
         fullSummary.runSummary = {
              runConfig: state.runConfig,
              startTime: state.runStart,
              endTime: def(entry.timestamp, <string>''),
              filterLog: state.filterLog,
              stats: state.runStats
          };
          logOutOfTestIssues(state);
          break;

       default:
         break;
     }

     updateState(state, entry)
     return state;
   }
 }

function listHasIssues(issuesList: IssuesList, includeKnownDefects: boolean = true): boolean {
   let issueExists : (e:ErrorsWarningsDefects) => boolean  = (i: ErrorsWarningsDefects) => hasIssues(i, includeKnownDefects);
   return issuesList.some(issueExists);
}

const nullRunStats: () => RunStats = () => {

  return {
    testCases: 0,
    passedTests: 0,
    failedTests: 0,
    testsWithWarnings: 0,
    testsWithKnownDefects: 0,
    testsWithType2Errors: 0,

    iterations: 0,
    passedIterations: 0,
    iterationsWithErrors: 0,
    iterationsWithWarnings: 0,
    iterationsWithType2Errors: 0,
    iterationsWithKnownDefects: 0,

    outOfTestErrors: 0,
    outOfTestWarnings: 0,
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
                runStats: nullRunStats(),
                filterLog: {},
                runName: '',
                rawFile: rawFilePath,
                runConfig: {},
                timestamp: '',
                iterationStart: '',
                runStart: '',

                indent: 0,
                testConfig: null,
                testStart: '',

                iterationConfig: null,

                errorExpectation: null,
                expectedErrorEncoutered: false,

                apstate: {},
                mocked: false,
                validationInfo: {},
                testItem: null,

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

  switchErrorInfoStage(result, StateStage.OutOfTest, 'out of test');
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
  switch (stage) {
    case StateStage.InTest:
      propMap.InTest.push(newStageRec);
      break;
  
    case StateStage.Validation:
      propMap.Validation.push(newStageRec);
      break;
  
    case StateStage.OutOfTest:
      propMap.OutOfTest.push(newStageRec);
      break;
  
    default:
      fail("unknown StateStage " + stage);
  }
  
}

function clearErrorInfo(state: RunState): void {
  state.validatorIssues = [];
  state.inTestIssues = [];
  state.outOfTestIssues = [];
  state.activeIssues = null;
}

export function destPath(rawPath: string, sourceFilePart: string, destFilePart: string, destDir?: string): string {
  sourceFilePart = '.' + sourceFilePart + '.';

  ensure(hasText(rawPath, sourceFilePart, true), `rawPath does not conform to naming conventions (should contain ${sourceFilePart}) ${rawPath}`);

  let resultPath = replaceAll(rawPath, sourceFilePart, '.' + destFilePart + '.');

  return destDir == null ? resultPath : combine(logFile(), fileOrFolderName(resultPath));
}

function fileWriter(destPath: string){
   let fd = fs.openSync(destPath, 'w');

   return function writer(data: any, indent: number, suffix = newLine(), inArray: boolean = false, arrayLineSeparator: boolean = false) {
     let str = show(data);

     // depricate this ??
     if (indent > 0){
       let iStr = '  '.repeat(indent),
           nStr = iStr;

       if (inArray) {
         iStr = (arrayLineSeparator ? newLine() : '') + iStr + '- ';
         nStr = nStr + '  ';
       }
       str = _.map(str.split(newLine()), (s: string, i : number) => (i === 0 ? iStr : nStr) + s).join(newLine());
     }

     fs.writeSync(fd, str + suffix);
   }
}

function pushTestErrorWarning(state: RunState, entry: LogEntry, isType2: boolean = false): void {
  let level = entry.level,
      errorSink = state.activeIssues;

  if(errorSink == null){
    fail( `parser error - no active error / wanring sink at entry: ${show(entry)}`);
  }
  else {

    let {warnings, errors, type2Errors, knownDefects} = errorSink,
        errArrray = [];

    if (isType2) {
      errArrray = type2Errors;
    }
    else if (level === "error" && state.errorExpectation != null){
      errArrray = knownDefects;
    }
    else if (level === "error"){
      errArrray = errors;
    }
    else if (level === "warn"){
      errArrray = warnings;
    }
    else {
      fail('pushTestErrorWarning - not in valid state: ' + show(entry));
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

function resetDefectExpectationUpdateStats(state: RunState, entry: LogEntry, inTest: boolean, inIteration: boolean) {
  // type 2 error
  let stats = state.runStats;
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

function updateStateForErrorsAndWarnings(state: RunState, entry: LogEntry, inTest: boolean, inIteration: boolean) {
  let stats = state.runStats;
  switch (entry.level) {
    case "error":
      if (state.errorExpectation == null){
        if (inIteration && !state.iterationErrorLogged){
           stats.iterationsWithErrors++;
           state.iterationErrorLogged = true;
        }

        if (inTest && !state.testErrorLogged){
           stats.failedTests++;
           state.testErrorLogged = true;
        }


        if (!inTest && !inIteration){
          stats.outOfTestErrors++;
        }
      }
      else {
         state.expectedErrorEncoutered = true;
      }
      pushTestErrorWarning(state, entry);
      break;

    case "warn":
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
}

function configObj(entry: LogEntry) {
  return entry.additionalInfo == null ? {} : yamlToObj(entry.additionalInfo);
}

function iterationCommonReset(state: RunState) {
   state.apstate = {};
   state.validationInfo = {};
   state.expectedErrorEncoutered = false;
   state.iterationErrorLogged = false;
   state.iterationWarningLogged = false;
   state.iterationType2ErrorLogged = false;
   state.mocked = false;
   state.validatorIssues = [];
   state.passedValidators = [];
}

function testCommonReset(state: RunState) {
   state.testErrorLogged = false;
   state.testType2ErrorLogged = false;
   iterationCommonReset(state);
}

// update the state then reset if required
function updateState(state: RunState, entry: LogEntry): RunState {

  let stats = state.runStats;
  state.timestamp = def(entry.timestamp, state.timestamp);

  state.indent = entry.popControl === PopControl.PopFolder ? state.indent + entry.popControl : state.indent;

  let inIteration = state.iterationConfig != null,
      inTest = inIteration || state.testConfig != null,
      resetDefectAndStats = () => resetDefectExpectationUpdateStats(state, entry, inTest, inIteration);

  updateStateForErrorsAndWarnings(state, entry, inTest, inIteration)

  let additionalInfo = entry.additionalInfo == null ? '' : entry.additionalInfo;
  const infoObj = () => yamlToObj(additionalInfo);
  switch (entry.subType) {
    case 'FilterLog':
      state.filterLog = filterLog(additionalInfo);
      break;

    case 'RunStart':
      // other state changes handled in reseter
      resetDefectAndStats();
      state.runConfig = configObj(entry);
      state.runStart = state.timestamp;
      state.runName = (<any>state.runConfig).name;
      state.indent = 1;
      break;

    case 'TestStart':
      // other state changes handled in reseter
      resetDefectAndStats();
      const defEmpty = (s?: string) => def(s, <string>'');
      state.testConfig = <any>infoObj();
      state.testStart = def(entry.timestamp, <string>'');
      state.testKnownDefectLogged = false;
      state.indent = 3;
      testCommonReset(state);
      break;

    case 'IterationStart':
      // other state changes handled in reseter
      resetDefectAndStats();
      let info = infoObj();
      state.iterationStart = def(entry.timestamp, <string>'');
      state.iterationKnownDefectLogged = false;
      state.iterationConfig = _.pick(info, ['id', 'when', 'then']);
      state.testItem = <any>info;
      break;

    case 'InteractorStart':
      switchErrorInfoStage(state, StateStage.InTest, EXECUTING_INTERACTOR_STR);
      state.indent = 3;
      break;

    case 'InteractorEnd':
      state.apstate = <any>def(seekInObj(infoObj(), 'apState'), {});
      state.mocked = <any>(seekInObj(infoObj(), 'mocked'), false);
      state.indent = 2; // ??
      break;

    case 'PrepValidationInfoStart':
      switchErrorInfoStage(state, StateStage.InTest, 'Preparing Validator State');
      break;

    case 'ValidationStart':
      switchErrorInfoStage(state, StateStage.OutOfTest, 'Before Validator');
      state.validationInfo = configObj(entry);
      break;

    case 'ValidatorStart':
      switchErrorInfoStage(state, StateStage.Validation, def(entry.message, <string>'unnamed validator'));
      break;

    case 'ValidatorEnd':
      let activeIssues = state.activeIssues;
      if (activeIssues != null && !hasIssues(activeIssues, false)){
        state.passedValidators.push(activeIssues.name);
      }
      switchErrorInfoStage(state, StateStage.OutOfTest, 'After Validator');
      break;

    case 'ValidationEnd':
      break;

    // case 'StartSummary':
    //   // other state changes handled in reseter
    //   switchErrorInfoStage(state, StateStage.InTest, 'Generating Summary');

    // case 'Summary':
    //   state.iterationSummary = def(entry.message, <string>'');
    //   break;

    case 'IterationEnd':
      if (!state.iterationErrorLogged){
         stats.passedIterations++;
      }
      switchErrorInfoStage(state, StateStage.OutOfTest, 'After Iteration');
      stats.iterations++;
      state.indent = 2;
      state.iterationConfig = null;
      iterationCommonReset(state);
      clearErrorInfo(state);
      switchErrorInfoStage(state, StateStage.OutOfTest, 'out of test');
      break;

    case 'TestEnd':
      stats.testCases++;
      if (!state.testErrorLogged){
         stats.passedTests++;
      }
      state.indent = 1;
      state.testConfig = null;
      testCommonReset(state);
      break;

    case 'RunEnd':
      resetDefectAndStats();
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
      resetDefectAndStats();
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

  state.indent = entry.popControl === PopControl.PushFolder ? state.indent + entry.popControl : state.indent;
  return state;
}

function filterLog(str: string) {

  function cleanUpKey(acc: any, val: any, key: string) {
    acc[subStrBefore(key, '.ts')] = val;
    return acc;
  }

  let filterLog = yamlToObj(str),
      result = _.reduce(filterLog, cleanUpKey, {}),
      logKeys = _.keys(result).sort();

   return reorderProps(result, ...logKeys);
}

export function defaultLogParser<R>(mockFileNameGenerator: (itemId: number, testName: string, runConfig: R) => string) {
  return function parseLogDefault(fullPath: string): FullSummaryInfo {
    let fullSummary: FullSummaryInfo = {
      rawFile: '',
      elementsFile: '',
      testSummaries: {},
      runSummary: null
    };

    // generate elements ~ mutates full summary
    parseLog(fullPath, rawToElements(fullPath, fullSummary), initalState(fullPath));
    // generate full & mock
    elementsToFullMock(fullSummary, mockFileNameGenerator);
    return fullSummary;
  }
}

export function parseLog<S>(fullPath: string, step: (s:S, le:LogEntry) => S, initState: S){
   logSplitter(fullPath, parser(step, initState) );
}

function parser<S>(step: (s:S, le:LogEntry) => S, initialState: S): (str: string) => void {
  let currentState = initialState;
  return (str: string) => {

    let yml = false;
    try {
      let entry = <LogEntry>yamlToObj(str);

      yml = true;
      currentState = step(currentState, entry);

    } catch (e) {
      fail(`Log parser failure - could not process log item - ${yml ? 'Failed processing step' : 'failed parsing YAML'}: `
              +  newLine()
              + str + newLine(2)
              + 'Exception was:' + newLine()
              + show(e)
             )
    }
  }
}

export function logSplitter(fullPath: string, itemParser: (s:string) => void ): void {
  let buffer = <string[]>[];

  function processBuffer() {
    let entry = buffer.join(newLine());
    if (buffer.length != 0 && entry.trim() != ''){
      itemParser(entry);
    }
    buffer = [];
  }

  function processLine(line: string) {
    if (line.startsWith(RECORD_DIVIDER)){
      processBuffer();
    }
    else {
      buffer.push(line);
    }
  }

  eachLine(fullPath, processLine);
}
