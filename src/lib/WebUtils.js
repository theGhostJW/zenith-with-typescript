// @flow

import { trimLines } from '../index';
import { log } from './Logging';
import { combine, fileOrFolderName, pathExists, projectDir, projectSubDir,
          runTimeFile, testCaseFile, PATH_SEPARATOR, copyFile, parentDir,
          fileToString, stringToFile } from './FileUtils';
import { hasText, subStrAfter, subStrBetween, trimChars, newLine } from './StringUtils';
import {
        cast, debug, def, delay, ensure, ensureHasVal, getCallerString,
         waitRetry, functionNameFromFunction, isSerialisable, ensureReturn,
        fail
      } from './SysUtils';
import * as _ from 'lodash';
import { launchWebInteractor, endSeleniumIpcSession, interact} from './WebLauncher'

export function zzzTestFunc() {
  return 55;
}

export function browserEx(func: (...any) => any, ...params: Array<any>): mixed {
  let funcName = functionNameFromFunction(func),
      caller = getCallerString(true),
      sourcePath = findMatchingSourceFile(caller),
      sendParams = ensureReturn(params.every(isSerialisable), params, 'browserEx optional params ~ unserailisable parameter passed in (like a function)');


   try {
     launchWebInteractor(sourcePath, funcName);
     return interact(...params);
   } catch (e) {
     fail(e);
   } finally {
     endSeleniumIpcSession();
   }

}

export function findMatchingSourceFile(callerPath: string): string {
  let callerFileName = fileOrFolderName(callerPath);

  const TEST_SUFFIXES = ['.endpoints.', '.integration.', '.test.'];
  let suffix = TEST_SUFFIXES.find(s => hasText(callerFileName, s, true));

  suffix = ensureHasVal(suffix, trimLines(`webUtilsTestLoad - calling file is not a standard test file.
  This function can only be called from a standard test file that includes one of the following in the file name: ${TEST_SUFFIXES.join(', ')}`));

  let sourceFileName = callerFileName.replace(suffix, '.');

  function srcFile(fileName) {
    return combine(projectDir(), 'src', 'lib', fileName);
  }

  let candidatePaths = [srcFile(sourceFileName), testCaseFile(sourceFileName)],
    sourcePath = candidatePaths.find(pathExists);

  sourcePath = ensureHasVal(sourcePath, trimLines(`webUtilsTestLoad - target source file consistent with calling test file not found.
  tried: ${candidatePaths.join(', ')}`));

   return sourcePath;
}
