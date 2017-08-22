import {
  def,
  debug,
  hasValue,
  areEqual,
  objToYaml
} from '../lib/SysUtils';
import {
  appendDelim
} from '../lib/StringUtils';
import {
  logCheckFailure,
  logCheckPassed
} from '../lib/Logging';



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

function genericCheck(prefix: string, condition: boolean, message: string, additionalInfo: ?string) {
  message = appendDelim(prefix, ': ', message);
  let logger = condition ? logCheckPassed : logCheckFailure;
  logger(message, additionalInfo);
  return condition;
}
