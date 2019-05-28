import { LogEntry } from './Logging';

export interface LogIterationConfig {
  id: number,
  when: string,
  then: string
}

export interface Iteration {
   dState: string,
   startTime: string,
   endTime:  string,
   testConfig: {},
   item: {id: number},
   mocked: boolean,
   apState: {},
   issues: IssuesList
 }

 export interface OutOfTestIssues {
   issues: IssuesList
 };

export interface ErrorsWarningsDefects {
  name: string,
  infoType: StateStage,
  warnings: LogEntry[],
  errors: LogEntry[],
  type2Errors: LogEntry[],
  knownDefects: LogEntry[]
}

export enum StateStage {
  Validation = 'validation',
  InTest = 'in test',
  OutOfTest = 'out of test'
};

export type IssuesList = ErrorsWarningsDefects[];

export interface RunSummary {
  runConfig: {[k:string]: string},
  startTime: string,
  endTime:  string,
  filterLog: {[k:string]: string},
  stats: RunStats
 }

export interface FullSummaryInfo {
  rawFile: string,
  elementsFile: string,
  testSummaries: {[K:string]: TestSummary},
  runSummary: RunSummary | undefined | null
}

export interface RunStats {
  testCases: number,
  passedTests: number,
  failedTests: number,
  testsWithWarnings: number,
  testsWithKnownDefects: number,
  testsWithType2Errors: number,

  iterations: number,
  passedIterations: number,
  iterationsWithErrors: number,
  iterationsWithWarnings: number,
  iterationsWithKnownDefects: number,
  iterationsWithType2Errors: number,

  outOfTestErrors: number,
  outOfTestWarnings: number,
  outOfTestType2Errors: number,
  outOfTestKnownDefects: number
};

export interface WithScript {
   script: string
};

export interface TestSummary {
  testConfig: WithScript,
  startTime: string,
  endTime:  string,
  stats: TestStats
}

export interface TestStats {
  iterations: number,
  passedIterations: number,
  iterationsWithErrors: number,
  iterationsWithType2Errors: number,
  iterationsWithWarnings: number,
  iterationsWithKnownDefects: number
};

export interface RunState {
  runStats: RunStats,
  filterLog: {[k:string]: string},
  runName: string,
  runStart: string,
  rawFile: string,
  runConfig: {},
  timestamp: string,

  iterationSummary: string,
  iterationStart: string,
  indent: number,
  testStart: string,
  testConfig: WithScript | null ,
  iterationConfig: LogIterationConfig | null,

  errorExpectation: LogEntry | null,
  expectedErrorEncoutered: boolean,

  apstate: {},
  mocked: boolean,
  testItem: {id: number} | null,
  validationInfo: {},
  passedValidators: string[],

  testErrorLogged: boolean,
  testType2ErrorLogged: boolean,
  testWarningLogged: boolean,
  testKnownDefectLogged: boolean,

  iterationErrorLogged: boolean,
  iterationWarningLogged: boolean,
  iterationType2ErrorLogged: boolean,
  iterationKnownDefectLogged: boolean,


  validatorIssues: ErrorsWarningsDefects[],
  inTestIssues: ErrorsWarningsDefects[],
  outOfTestIssues: ErrorsWarningsDefects[],

  activeIssues: ErrorsWarningsDefects | null
};
