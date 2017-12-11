// @flow

import type { LogEntry } from '../lib/Logging';

export type LogIterationConfig = {
  id: number,
  when: string,
  then: string
}

export type Iteration = {|
   summary: string,
   startTime: string,
   endTime:  string,
   valTime: string,
   elementType: 2,
   testConfig: {},
   item: {id: number},
   apState: {},
   issues: IssuesList
 |}

 export type OutOfTestIssues = {
   elementType: 3,
   issues: IssuesList
 };

export type ErrorsWarningsDefects = {
  name: string,
  infoType: StateStage,
  warnings: Array<LogEntry>,
  errors: Array<LogEntry>,
  type2Errors: Array<LogEntry>,
  knownDefects: Array<LogEntry>
}

export type RunElementType = 'InterationInfo' | 'OutOfTestErrors';

const STATE_STAGE = {
  Validation: 'validation',
  InTest: 'in test',
  OutOfTest: 'out of test'
};

export type StateStage = $Keys<typeof STATE_STAGE>;

export type IssuesList = Array<ErrorsWarningsDefects>;

export type RunSummary = {|
  runConfig: {[string]: string},
  startTime: string,
  endTime:  string,
  filterLog: {[string]: string},
  stats: RunStats
|}

export type FullSummaryInfo = {
  rawFile: string,
  elementsFile: string,
  testSummaries: {[string]: TestSummary},
  runSummary: ?RunSummary
}

export type RunStats =  {|
  testCases: number,
  passedTests: number,
  failedTests: number,
  testsWithWarnings: number,
  testsWithKnownDefects: number,
  testsWithType2Errors: number,

  iterations: number,
  passedIterations: number,
  failedIterations: number,
  iterationsWithWarnings: number,
  iterationsWithKnownDefects: number,
  iterationsWithType2Errors: number,

  outOfTestErrors: number,
  outOfTestWarnings: number,
  outOfTestType2Errors: number,
  outOfTestKnownDefects: number
|};

export type WithScript = {
   script: string
};

export type TestSummary = {|
  testConfig: WithScript,
  startTime: string,
  endTime:  string,
  stats: TestStats
|}

export type TestStats = {|
  iterations: number,
  passedIterations: number,
  failedIterations: number,
  iterationsWithType2Errors: number,
  iterationsWithWarnings: number,
  iterationsWithKnownDefects: number
|};


export type RunState = {|
  runStats: RunStats,
  filterLog: {[string]: string},
  runName: string,
  rawFile: string,
  runConfig: {},
  timestamp: string,

  iterationSummary: string,
  iterationStart: string,
  indent: number,
  testStart: string,
  testConfig: ?WithScript,
  iterationConfig: ?LogIterationConfig,

  errorExpectation: ?LogEntry,
  expectedErrorEncoutered: boolean,

  apstate: {},
  testItem: {},
  validationInfo: {},
  passedValidators: Array<string>,

  testErrorLogged: boolean,
  testType2ErrorLogged: boolean,
  testWarningLogged: boolean,
  testKnownDefectLogged: boolean,

  iterationErrorLogged: boolean,
  iterationWarningLogged: boolean,
  iterationType2ErrorLogged: boolean,
  iterationKnownDefectLogged: boolean,


  validatorIssues: Array<ErrorsWarningsDefects>,
  inTestIssues: Array<ErrorsWarningsDefects>,
  outOfTestIssues: Array<ErrorsWarningsDefects>,

  activeIssues: ?ErrorsWarningsDefects
|};
