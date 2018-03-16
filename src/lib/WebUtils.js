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
import { launchWebInteractor, endSeleniumIpcSession, interact, rerunClient,
          launchWdioServerDetached } from './WebLauncher'

export function zzzTestFunc() {
  console.log('zzzTestFunc');
  return 55;
}

export function browserEx(func: (...any) => any, ...params: Array<any>): mixed {
   try {
     let caller = getCallerString(true);
     return browserExBase(null, caller, func, ...params);
   }
  catch (e) {
    fail('browserEx - fail', e)
   } finally {
    endSeleniumIpcSession();
   }
}

//ToDo: remove second param
export function launchSession(before: (() => void) | null, func: (...any) => any, ...params: Array<any>) {
   try {
     let caller = getCallerString(true);
     let {
         funcName,
         beforeFuncName,
         sourcePath
     } = extractNamesAndSource(before, caller, func);
     launchWdioServerDetached(caller, beforeFuncName, funcName, true);
   }
  catch (e) {
    fail('launchSession - fail', e)
   }
}

export function rerunLoaded(...params: Array<any>) {
   try {
     rerunClient();
     return interact(...params);
   }
  catch (e) {
    fail('rerunLoaded - fail', e)
   }
}


function extractNamesAndSource(before: (() => void) | null, caller: string, func: (...any) => any) {
  return {
    funcName: functionNameFromFunction(func),
    beforeFuncName: before == null ? null : functionNameFromFunction(before),
    sourcePath: findMatchingSourceFile(caller)
  }
}

function browserExBase(before: (() => void) | null, caller: string, func: (...any) => any, ...params: Array<any>): mixed {
  let {
      funcName,
      beforeFuncName,
      sourcePath
    } = extractNamesAndSource(before, caller, func);

   ensure(params.every(isSerialisable), 'browserEx optional params ~ unserailisable parameter passed in (like a function)');
   launchWebInteractor(sourcePath, beforeFuncName, funcName, true);
   return interact(...params);
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
