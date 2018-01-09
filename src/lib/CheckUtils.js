// @flow

import { def, debug, hasValue, areEqual, objToYaml} from '../lib/SysUtils';
import { appendDelim, createGuidTruncated, newLine, toString, hasText,
         replaceAll, standardiseLineEndings, wildCardMatch} from '../lib/StringUtils';
import { logCheckFailure, logCheckPassed } from '../lib/Logging';
import { tempFile, stringToLogFile } from '../lib/FileUtils';
import * as _ from 'lodash';

export const check = (condition: boolean, message: string, additionalInfo?: string) => genericCheck('Check', condition, message, additionalInfo);
export const checkFalse = (condition: boolean, message: string, additionalInfo?: string) => genericCheck('Check False', !condition, message, additionalInfo);

export const checkEqual = (expected: any, actual: any, message: string, additionalInfo: ?string) => {
  let result = areEqual(expected, actual),
      updatedMessage = result  ? successMessage(expected, additionalInfo) : failMessage(expected, actual, additionalInfo, ' '),
      updatedInfo =  result ? message : failMessage(expected, actual, updatedMessage,  newLine());

  return genericCheck('EqualityChck', result, updatedMessage, updatedInfo);
}

export function checkTextContainsFragments(targetString: string, searchPattern: string, caseSensitive: boolean = true): boolean {
  function standardisNewLines(str){
    str = standardiseLineEndings(str);
    str = replaceAll(str, newLine() + ' ', ' ');
    str = replaceAll(str, ' ' + newLine(), ' ');
    return replaceAll(str, newLine(), ' ');
  }

  let expectedContent = standardisNewLines(searchPattern),
      actualContent = standardisNewLines(targetString);

  function processFoundResult(fragment, remainder, found){
    var detailMessage = 'Looking for Fragment' + newLine() + fragment + newLine(2) + 'Looking In' + newLine() + remainder
    genericCheck('Text Fragment Check', found, 'Target Fragment :' + fragment, detailMessage);
  }

  return wildCardMatch(actualContent, expectedContent, caseSensitive, true, processFoundResult);
}

export function checkTextContains(hayStack: string, needle: string, message: ?string, caseSensitive: boolean = true){

  let found = hasText(hayStack, needle, caseSensitive),
      okFail = found ? 'OK' : 'Failed',
      strNot = found ? '' : ' not',
      baseMessage = message == null ? '' : message + newLine(),
      infoMessage = baseMessage + 'Looking for: ' + needle + newLine() + ' in ' + newLine() + hayStack;

  return genericCheck('Check Text Contains', found, baseMessage, infoMessage);
}


function failMessage(expected: any, actual: any, additionalMsgStr: ?string, delim: string){
 	let msgBase = `Expected: ${delim} ${toString(expected)} ${delim} did not equal Actual: ${delim} ${toString(actual)}`,
	    failMessage = additionalMsgStr ? additionalMsgStr + '.' + delim +  msgBase : msgBase;
  return failMessage;
}

function successMessage(expected, infoMessage){
  let result =  (_.isObject(expected)) ? 'Object Verified: ' + newLine() + toString(expected)
                  : expected + ' verified';
  return appendDelim(infoMessage, ' - ' , result);
}

export function checkText(expected: string, actual: string, message: string, additionalInfo?: string): boolean {
  let result = areEqual(expected, actual),
      prefix = 'Check Text';

  if (result) {
    genericCheck(prefix, result, message, additionalInfo);
  }
  else {
    let nameBase = createGuidTruncated(6),
        expectedFile =  nameBase + '_Expected.txt',
        actualFile =  nameBase + '_Actual.txt';

    stringToLogFile(expected, expectedFile);
    stringToLogFile(actual, actualFile);

    let fileMessage = `Text differs - expect: .\\${expectedFile} - actual: .\\${actualFile}`;

    genericCheck(prefix, result, message, appendDelim(fileMessage, newLine(), additionalInfo));
  }
  return result;
}


function genericCheck(prefix: string, condition: boolean, message: string, additionalInfo?: string) {
  message = appendDelim(prefix, ': ', message);
  let logger = condition ? logCheckPassed : logCheckFailure;
  logger(message, additionalInfo);
  return condition;
}
