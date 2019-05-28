import {describe} from 'mocha'
import { seekInObj } from '../lib/SysUtils';
import { defaultLogParser, elementsToFullMock,  } from '../lib/LogParser';
import { testDataFile, toTemp, fromTestData } from '../lib/FileUtils';
import { mockFileNameUseEnvironment } from '../../testCases/ProjectConfig';
import {chkEq} from '../lib/AssertionUtils';
import { replaceAll} from '../lib/StringUtils';

describe('file Parsing', () => {

  let summary: any,
      rawName = 'DemoLog.raw.yaml',
      rawPath = testDataFile(rawName);

  before(() => {
    summary = defaultLogParser(mockFileNameUseEnvironment)(rawPath);
    toTemp(summary, 'summary');
  });

  describe('file paths correct', () => {

    it('raw', () => {
     chkEq(rawPath, summary.rawFile)
    });

    it('elements', () => {
     chkEq(replaceAll(rawPath, '.raw', '.elements'), summary.elementsFile)
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

    let summary: any;
    before(() => {
      summary = fromTestData('ParserSummary.yaml');
    });

    it('elementsToFullMock', () => {
      elementsToFullMock(summary, mockFileNameUseEnvironment);
    });

  });

});