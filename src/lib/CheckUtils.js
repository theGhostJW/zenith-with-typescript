import { def, debug, hasValue, areEqual, objToYaml} from '../lib/SysUtils';
import { appendDelim, createGuidTruncated, newLine } from '../lib/StringUtils';
import { logCheckFailure, logCheckPassed } from '../lib/Logging';
import { tempFile, stringToLogFile } from '../lib/FileUtils';


/*
TODO: checkExists = checkExists;
TODO: checkExistsNot = checkExistsNot;
TODO: checkText = checkText;
TODO: checkTextAgainstTextFile = checkTextAgainstTextFile;
TODO: checkEqual = checkEqual;
TODO: checkContains = checkContains;
TODO: checkTextContainsFragments = checkTextContainsFragments;
TODO: checkTextContainsFragmentsFromFile = checkTextContainsFragmentsFromFile;
TODO: check = check;
TODO: checkFalse = checkFalse;
TODO: checkWithinTolerance
 */

export const check = (condition: boolean, message: string, additionalInfo: ?string) => genericCheck('Check', condition, message, additionalInfo);
export const checkFalse = (condition: boolean, message: string, additionalInfo: ?string) => genericCheck('CheckFalse', !condition, message, additionalInfo);

export function checkText(expected: string, actual: string, message: string, additionalInfo: ?string): boolean {
  let result = areEqual(expected, actual),
      prefix = 'CheckText';

  if (result) {
    genericCheck(prefix, result, message, additionalInfo);
  }
  else {
    let nameBase = createGuidTruncated(6),
        expectedFile =  nameBase + '_Expected.txt',
        actualFile =  nameBase + '_Expected.txt';

    stringToLogFile(expected, expectedFile);
    stringToLogFile(actual, actualFile);

    let fileMessage = `Text differs - expect: .\\${expectedFile} - actual: .\\${actualFile}`;

//    todo strigToLogfile integeration tests

  //   string to log file
    genericCheck(prefix, result, message, fileMessage + newLine() + additionalInfo);
  }
  return result;
}


function genericCheck(prefix: string, condition: boolean, message: string, additionalInfo: ?string) {
  message = appendDelim(prefix, ': ', message);
  let logger = condition ? logCheckPassed : logCheckFailure;
  logger(message, additionalInfo);
  return condition;
}
