//@flow

import {test, describe} from 'mocha'
import { debug, seekInObj } from '../lib/SysUtils';
import { logSplitter, parseLogDefault, elementsToFullMock } from '../lib/LogParser';
import { testDataFile, logFile, toTemp, fromTestData } from '../lib/FileUtils';
import { DEMO_LOG, DEMO_ENTRY } from '../test/LogParser.data.test';
import {chk, chkEq, chkEqJson, chkFalse} from '../lib/AssertionUtils';
import { replace } from '../lib/StringUtils';

describe('file Parsing', () => {

  let summary,
      rawName = 'DemoLog.raw.yaml',
      rawPath = testDataFile(rawName);

  before(() => {
    summary = parseLogDefault(rawPath);
    toTemp(summary, 'summary');
    //debug(JSON.stringify(summary))
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
       iterationsWithErrors: 4,
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

  describe('test stats correct', () => {
    it('e.g. Another_Demo_Case', () => {
       let expected = {
          iterations: 2,
          passedIterations: 1,
          iterationsWithErrors: 1,
          iterationsWithType2Errors: 0,
          iterationsWithWarnings: 1,
          iterationsWithKnownDefects: 0
       },
       actual = seekInObj(summary, 'Another_Demo_Case', 'stats');
       chkEq(expected, actual);
    });

    it('e.g. Demo_Case', () => {
       let expected = {
          iterations: 4,
          passedIterations: 1,
          iterationsWithErrors: 3,
          iterationsWithType2Errors: 1,
          iterationsWithWarnings: 0,
          iterationsWithKnownDefects: 1
       },
       actual = seekInObj(summary, 'Demo_Case', 'stats');
       chkEq(expected, actual);
    });

    it('e.g. Demo_Case3', () => {
       let expected = {
          iterations: 1,
          passedIterations: 1,
          iterationsWithErrors: 0,
          iterationsWithType2Errors: 0,
          iterationsWithWarnings: 0,
          iterationsWithKnownDefects: 1
       },
       actual = seekInObj(summary, 'Demo_Case3', 'stats');
       chkEq(expected, actual);
    });

  });

  describe('elementProcessor', () => {

    let summary;
    before(() => {
      summary = fromTestData('ParserSummary.yaml');
    });

    it('elementsToFullMock', () => {
      elementsToFullMock(summary);
    });

  });

});
