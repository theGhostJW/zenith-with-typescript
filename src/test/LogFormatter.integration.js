// @flow

import { testPrivate, iteration, outOfTestError} from '../lib/LogFormatter';
import {  chkEq, chkExceptionText } from '../lib/AssertionUtils';
import { fromTestData, toTempString, fromTestDataString } from '../lib/FileUtils';
import { trimChars, newLine, standardiseLineEndings } from '../lib/StringUtils';
import { debug } from '../lib/SysUtils';


function sectionIntegrationTest<T>(sourceFile: string, expectedFile: string, transformer: T => string) {

    let source = debug(fromTestData(sourceFile), 'Source'),
        expected = trimChars(standardiseLineEndings(fromTestDataString(expectedFile)), [newLine(), ' ']),
        actual = trimChars(transformer(source), [newLine(), ' ']);

    toTempString(expected, 'expected.yaml');
    toTempString(actual, 'actual.yaml');

    chkEq(expected, actual);
}

describe('formatter components', () => {

  it('summary block', () => {
    sectionIntegrationTest('ParserSummary.yaml', 'ParserSummary.expected.yaml', testPrivate.summaryBlock);
  });

  it('out of test errors', () => {
    sectionIntegrationTest('OutOfTestError.yaml', 'OutOfTestError.expected.yaml', outOfTestError);
  });

  it('iteration', () => {
    let fullSum = fromTestData('ParserSummary'),
        transformer = iterationInfo => iteration(iterationInfo, fullSum, 'Last_Script');

    sectionIntegrationTest('Iteration.yaml', 'Iteration.expected.yaml', transformer);
  });


});
