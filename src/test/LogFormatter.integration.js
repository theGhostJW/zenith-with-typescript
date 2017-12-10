// @flow

import { testPrivate } from '../lib/LogFormatter';
import {  chkEq, chkExceptionText } from '../lib/AssertionUtils';
import { fromTestData, toTempString, fromTestDataString } from '../lib/FileUtils';
import { trimChars, newLine, standardiseLineEndings } from '../lib/StringUtils';


function sectionIntegrationTest<T>(sourceFile: string, expectedFile: string, transformer: T => string) {

    let source = fromTestData(sourceFile),
        expected = trimChars(standardiseLineEndings(fromTestDataString(expectedFile)), [newLine()]),
        actual = transformer(source);

    toTempString(expected, 'expected.yaml')
    toTempString(actual, 'actual.yaml')

  //  chkEq(expected, actual);
}

describe('formatter components', () => {

  it('summary block', () => {
    sectionIntegrationTest('ParserSummary.yaml', 'ParserSummary.expected.yaml', testPrivate.summaryBlock);
  });

  it('out of test errors', () => {
    sectionIntegrationTest('OutOfTestError.yaml', 'OutOfTestError.expected.yaml', testPrivate.outOfTestError);
  });

  it.only('iteration', () => {
    let fullSum = fromTestData('ParserSummary'),
        transformer = iterationInfo => testPrivate.iteration(iterationInfo, fullSum, 'Last_Script');

    sectionIntegrationTest('Iteration.yaml', 'Iteration.expected.yaml', transformer);
  });


});
