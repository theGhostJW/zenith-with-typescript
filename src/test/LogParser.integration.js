//@flow

import {test, describe} from 'mocha'
import { debug, seekInObj } from '../lib/SysUtils';
import { logSplitter, parseLogDefault } from '../lib/LogParser';
import { testDataFile, logFile } from '../lib/FileUtils';
import { DEMO_LOG, DEMO_ENTRY } from '../test/LogParser.data.test';
import {chk, chkEq, chkEqJson, chkFalse} from '../lib/AssertionUtils';
import { replace } from '../lib/StringUtils';

describe('file Parsing', () => {

  let summary,
      rawName = 'DemoLog.raw.yaml',
      rawPath = testDataFile(rawName);

  before(() => {
    summary = parseLogDefault(rawPath);
  });

  describe('file paths correct', () => {

    it('raw', () => {
     chkEq(rawPath, summary.rawFile)
    });

    it('elements', () => {
     chkEq(logFile(replace(rawName, '.raw', '.elements')), summary.elementsFile)
    });

  });


  it('run stats correct', () => {
     let expected = {
       testCases: 3,
       passedTests: 1,
       failedTests: 2,
       testsWithWarnings: 1,
       testsWithKnownDefects: 2,
       testsWithType2Errors: 1,
       iterations: 7,
       passedIterations: 3,
       failedIterations: 4,
       iterationsWithWarnings: 1,
       iterationsWithType2Errors: 1,
       iterationsWithKnownDefects: 2,
       outOfTestErrors: 1,
       outOfTestWarnings: 2,
       outOfTestType2Errors: 1,
       outOfTestKnownDefects: 1
     },
     actual = seekInObj(summary, 'runSummary', 'stats');
     //debug(summary);
     chkEq(expected, actual);
  });

  describe.skip('test stats correct', () => {
    it('anotherCaseStats', () => {
       let expected = {
          iterations: 2,
          passedIterations: 1,
          failedIterations: 1,
          iterationsWithWarning: 0,
          iterationsWithKnownDefects: 0
       },
       actual = seekInObj(summary, 'Another_Demo_Case', 'stats');

       chkEq(expected, actual);
    });
  });

});
