// @flow

import { testPrivate } from '../lib/LogFormatter';
import {  chkEq, chkExceptionText } from '../lib/AssertionUtils';
import { fromTestData, toTempString, fromTestDataString } from '../lib/FileUtils';
import { trimChars, newLine, standardiseLineEndings } from '../lib/StringUtils';


function sectionIntegrationTest(sourceFile: string, expectedFile: string, transformer: (string, string) => string) {

}

describe.only('summaryBlock', () => {
  //sectionIntegrationTest('ParserSummary.yaml', 'ParserSummary.expected.yaml', transformer: (string, string) => string)

  let summary,
  summaryBlock = testPrivate.summaryBlock;
  before(() => {
    summary = fromTestData('ParserSummary.yaml');
  });

  it('produces expected block', () => {

  let expected = trimChars(standardiseLineEndings(fromTestDataString('ParserSummary.expected.yaml')), [newLine()]),
      actual = summaryBlock(summary);

  toTempString(expected, 'expected.yaml')
  toTempString(actual, 'actual.yaml')

  chkEq(expected, actual);


  });

});
