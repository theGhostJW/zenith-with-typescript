import { testPrivate, iteration, outOfTestError} from '../lib/LogFormatter';
import {  chkEq } from '../lib/AssertionUtils';
import { fromTestData, fromTestDataString } from '../lib/FileUtils';
import { trimChars, newLine, standardiseLineEndings, trimLines } from '../lib/StringUtils';


function sectionIntegrationTest<T>(sourceFile: string, expectedFile: string, transformer: ((t:T) => string)): void {

    let source = <any>fromTestData(sourceFile),
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
    let fullSum = <any>fromTestData('ParserSummary'),
        transformer = (iterationInfo: any) => iteration(iterationInfo, fullSum, 'Last_Script');

    sectionIntegrationTest('Iteration.yaml', 'Iteration.expected.yaml', transformer);
  });


});
