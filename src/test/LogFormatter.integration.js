// @flow

import { testPrivate } from '../lib/LogFormatter';
import {
          chkEq,
          chkExceptionText
        } from '../lib/AssertionUtils';
import {
          fromTestData,
          toTempString
        } from '../lib/FileUtils';


describe('summaryBlock', () => {

  let summary;
  before(() => {
    summary = fromTestData('ParserSummary.yaml');
  });

  it('produces expected block', () => {

    const EXPECTED =
`################################################################################
########################### Summary - Test Test Run ############################
################################################################################

start:     2017-11-25 11:28:22
end:       2017-11-25 12:38:44
duration:  01:10:22
raw:       .\DemoLog.raw.yaml

runConfig:
  mocked:      false
  country:     Australia
  environment: TST
  testCases:   []
  depth:       Regression

stats:
  testCases:                  30
  passedTests:                 1
  failedTests:                 2
  testsWithWarnings:           1
  testsWithKnownDefects:       2
  testsWithType2Errors:        1

  iterations:                  7
  passedIterations:            3
  failedIterations:            4
  iterationsWithWarnings:      1
  iterationsWithType2Errors:   1
  iterationsWithKnownDefects:  2

  outOfTestErrors:             1
  outOfTestWarnings:           2
  outOfTestType2Errors:        1
  outOfTestKnownDefects:       1`


  let actual = testPrivate.summaryBlock(summary.runSummary);

  toTempString(EXPECTED, 'expected.yaml');
  toTempString(actual, 'actual.yaml');

  chkEq(EXPECTED, actual);

  });

});
