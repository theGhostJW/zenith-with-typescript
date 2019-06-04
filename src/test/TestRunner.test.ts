import {test, describe} from 'mocha';
import {chk, chkEq, chkEqJson, chkExceptionText, chkFalse, chkWithMessage} from '../lib/AssertionUtils';
import { allItems, filterTestItems, filterTests, idFilter, lastItem, matchesProps, calcExitCodeAndOutcome, RunOutcome } from '../lib/TestRunner';
import { RunStats, RunSummary } from '../lib/LogParserTypes';
import { show } from '../lib/StringUtils';
const _ = require('lodash');

function runCfg(stats: Partial<RunStats>): RunSummary {
  return {
   runConfig: {},
   startTime: "",
   endTime:  "",
   filterLog: {},
   stats: _.defaults(stats, {
      testCases: 100,
      passedTests: 100,
      failedTests: 100,
      testsWithWarnings: 100,
      testsWithKnownDefects: 100,
      testsWithType2Errors: 100,
    
      iterations: 100,
      passedIterations: 100,
      iterationsWithErrors: 100,
      iterationsWithWarnings: 100,
      iterationsWithKnownDefects: 100,
      iterationsWithType2Errors: 100,
    
      outOfTestErrors: 100,
      outOfTestWarnings: 100,
      outOfTestType2Errors: 100,
      outOfTestKnownDefects: 100
    })
  }
}

function chkOutcome(expected: RunOutcome, stats: Partial<RunStats> | null){
  const actual = stats == null ?  
                  calcExitCodeAndOutcome(stats) :
                  calcExitCodeAndOutcome(runCfg(stats));
  chkEq(expected, actual);
}

describe('exit code and outcome', () => {

  it('failed parser - no runstate', () => {
    const expected = {
      logLevel: <any>"error",
      message: "Error - no run summary generated",
      exitCode: 0
    };
    chkOutcome(expected, null)
  });

  const errOutcome =  {
    logLevel: <any>"error",
    message: "Errors encountered in run",
    exitCode: 1
  };

  it('iteration errors', () => {
    chkOutcome(errOutcome, {iterationsWithErrors: 10, })
  });

  it('out of test errors', () => {
    chkOutcome(errOutcome, {
                            iterationsWithErrors: 0,
                            outOfTestErrors: 10
                          })
  });

  const t2ErrorOutcome = {
    logLevel: <any>"error",
    message: "Type 2 errors encountered in run",
    exitCode: 2
  }

  it('iteration T2 errors', () => {
    chkOutcome(t2ErrorOutcome,  {
                              iterationsWithErrors: 0,
                              outOfTestErrors: 0,
                              iterationsWithType2Errors: 1

                            })
  });

  it('out of test T2 errors', () => {
    chkOutcome(t2ErrorOutcome,  {
                              iterationsWithErrors: 0,
                              outOfTestErrors: 0,
                              iterationsWithType2Errors: 0,
                              outOfTestType2Errors: 1
                            })
  });

  const knownDefectOutcome = {
    logLevel: <any>"warn",
    message: "Known defects encountered in run",
    exitCode: 3
  }

  it('iteration known defects', () => {
    chkOutcome(knownDefectOutcome,  {
                                iterationsWithErrors: 0,
                                outOfTestErrors: 0,
                                iterationsWithType2Errors: 0,
                                outOfTestType2Errors: 0,
                                iterationsWithKnownDefects: 1
                            })
  });

  it('out of test known defects', () => {
    chkOutcome(knownDefectOutcome,  {
                                      iterationsWithErrors: 0,
                                      outOfTestErrors: 0,
                                      iterationsWithType2Errors: 0,
                                      outOfTestType2Errors: 0,
                                      iterationsWithKnownDefects: 0,
                                      outOfTestKnownDefects: 1
                                  })
  });

  const warningOutcome = {
    logLevel: <any>"warn",
    message: "Warnings encountered in run",
    exitCode: 4
  }

  it('iteration warningss', () => {
    chkOutcome(warningOutcome,  {
                                      iterationsWithErrors: 0,
                                      outOfTestErrors: 0,
                                      iterationsWithType2Errors: 0,
                                      outOfTestType2Errors: 0,
                                      iterationsWithKnownDefects: 0,
                                      outOfTestKnownDefects: 0,
                                      iterationsWithWarnings: 1
                                  })
  });

  it('out of test warnings', () => {
    chkOutcome(warningOutcome,  {
                                      iterationsWithErrors: 0,
                                      outOfTestErrors: 0,
                                      iterationsWithType2Errors: 0,
                                      outOfTestType2Errors: 0,
                                      iterationsWithKnownDefects: 0,
                                      outOfTestKnownDefects: 0,
                                      iterationsWithWarnings: 0,
                                      outOfTestWarnings: 1
                                  })
  });

  it('no test iterations', () => {
    const expected = {
      logLevel: <any>"error",
      message: "No test iterations run encountered in run",
      exitCode: 5
    };
    chkOutcome(expected,  {
                            iterationsWithErrors: 0,
                            outOfTestErrors: 0,
                            iterationsWithType2Errors: 0,
                            outOfTestType2Errors: 0,
                            iterationsWithKnownDefects: 0,
                            outOfTestKnownDefects: 0,
                            iterationsWithWarnings: 0,
                            outOfTestWarnings: 0,
                            iterations: 0
                        });
  });

  it('run passsed', () => {
    const expected = {
      logLevel: <any>"info",
      message: "Test run passed",
      exitCode: 0
    };
    chkOutcome(expected,  {
                            iterationsWithErrors: 0,
                            outOfTestErrors: 0,
                            iterationsWithType2Errors: 0,
                            outOfTestType2Errors: 0,
                            iterationsWithKnownDefects: 0,
                            outOfTestKnownDefects: 0,
                            iterationsWithWarnings: 0,
                            outOfTestWarnings: 0,
                            iterations: 1
                        });
  });
  
})

describe('end-point filters', () => {

  const TEST_ITEMS = [
      {id: 1,  prp1: 'hello', prp2: 'hello1'},
      {id: 2,  prp1: 'hello', prp2: 'hello2'},
      {id: 3, prp1: 'hello', prp2: 'hello3'},
      {id: 4, prp1: 'hello', prp2: 'hello4'}
  ];

  function chkFilter(fltr: any, expected: any) {
    var actual = filterTestItems(<any>TEST_ITEMS, fltr);
    chkEq(expected, actual)
  }

  it('lastItem', () => {
    chkFilter(lastItem, [{id: 4, prp1: 'hello', prp2: 'hello4'}]);
  });

  it('matchesProps', () => {
    chkFilter(matchesProps({prp1: 'hello', prp2: 'hello3'}), [{id: 3, prp1: 'hello', prp2: 'hello3'}]);
  });


  it('id', () => {
    chkFilter(idFilter(2), [{id: 2,  prp1: 'hello', prp2: 'hello2'}]);
  });

  it('allItems', () => {
    chkFilter(allItems, TEST_ITEMS);
  });

});

describe('filterTestItems', () => {

  const testCases = [
      {name: 'test1', cfg: {env: 'TST', enabled: true, size: 5}},
      {name: 'test2', cfg: {env: 'PVT', enabled: true, size: 10}},
      {name: 'test20', cfg: {env: 'TST', enabled: true, size: 10}},
      {name: 'test100', cfg: {env: 'TST', enabled: false, size: 1}}
  ];

  const extractor = (tst: any) => tst.cfg;

  const predicates = [

    function isInNames(name: any, testConfig: any, runConfig: any) {
      return runConfig.testCases == null ||  runConfig.testCases.includes(name);
    },

    function sameEnv(name: any, testConfig: any, runConfig: any) {
      return runConfig.env === testConfig.env;
    },

    function sizeTest(name: any, testConfig: any, runConfig: any) {
      return runConfig.size >= testConfig.size;
    },

    function isEnabled(name: any, testConfig: any, runConfig: any) {
      return testConfig.enabled;
    }
  ];


  it('simple', () => {
    let expected = {
      items: [
        {name: 'test1', cfg: {env: 'TST', enabled: true, size: 5}}
      ],
      log: {
       test1: 'Accepted',
       test100: 'isEnabled',
       test2: 'sameEnv',
       test20: 'sizeTest'
      }
    },
    actual = filterTests(testCases, extractor, predicates, {env: 'TST', size: 7});
    chkEq(expected, actual);
  });

  it('in names', () => {
    let expected = {
        items: [
          {name: 'test1', cfg: {env: 'TST', enabled: true, size: 5}},
          {name: 'test20', cfg: {env: 'TST', enabled: true, size: 10}}
        ],
        log: {
         test1: 'Accepted',
         test100: 'isInNames',
         test2: 'sameEnv',
         test20: 'Accepted'
        }
      },
      actual = filterTests(testCases, extractor, predicates, {env: 'TST', testCases: ['test1', 'test2', 'test20'], size: 10});
      chkEq(expected, actual);
  });

  it('empty', () => {
    let expected = {
        items: [],
        log: {
         test1: 'sameEnv',
         test100: 'sameEnv',
         test2: 'isInNames',
         test20: 'sameEnv'
        }
      },
      actual = filterTests(testCases, extractor, predicates, {env: 'PVT', testCases: ['test1', 'test20', 'test100'], size: 10});
      chkEq(expected, actual);
  });
});
