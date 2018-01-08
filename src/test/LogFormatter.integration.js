// @flow

import {test, describe} from 'mocha'
import { testPrivate, iteration, outOfTestError} from '../lib/LogFormatter';
import {  chkEq, chkExceptionText } from '../lib/AssertionUtils';
import { fromTestData, toTempString, fromTestDataString } from '../lib/FileUtils';
import { trimChars, newLine, standardiseLineEndings, trimLines } from '../lib/StringUtils';
import { debug } from '../lib/SysUtils';


function sectionIntegrationTest<T>(sourceFile: string, expectedFile: string, transformer: T => string) {

    let source = fromTestData(sourceFile),
        expected = trimChars(standardiseLineEndings(fromTestDataString(expectedFile)), [newLine(), ' ']),
        actual = trimChars(transformer(source), [newLine(), ' ']);

    // seem to be losing whitespace loading expected this is a
    // work around
    expected = trimLines(expected),
    actual = trimLines(actual);


    //toTempString(expected, 'expected.yaml');
    //toTempString(actual, 'actual.yaml');

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
