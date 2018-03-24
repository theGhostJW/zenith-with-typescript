// @flow

import {trimLines} from '../index';
import { combine, copyFile, fileOrFolderName, fileToString, parentDir,
          pathExists, projectDir, projectSubDir, runTimeFile, stringToFile,
          testCaseFile, PATH_SEPARATOR } from './FileUtils';
import { hasText, newLine, subStrAfter, subStrBetween, trimChars, show } from './StringUtils';
import {
        cast, debug, def, delay, ensure, ensureHasVal, ensureReturn,
         fail, filePathFromCallStackLine, functionNameFromFunction,
        callstackStrings, isSerialisable, waitRetry, TEST_SUFFIXES
      } from './SysUtils';
import { endSeleniumIpcSession, interact, launchWdioServerDetached,
          launchWebInteractor,  isConnected, sendClientDone,
          runClient } from './WebLauncher';
import type { BeforeRunInfo } from './WebLauncher';
import * as wd from 'webdriverio';
import * as _ from 'lodash';

//$FlowFixMe
export const S = s => $(s);

//$FlowFixMe
export const SS = s => $$(s);

export function links() {
  return SS('[href]')
}



export function click(elementSelector: string) {
  browser.click(elementSelector);
}

export function set(elementSelector: string, value: string | number | Array<string|number>) {
  S(elementSelector).setValue(value);
}

export function rerun(beforeFuncOrUrl: (() => void) | string | null = null, func: ?(...any) => any, ...params: Array<any>): mixed {
  runClient();
  // Closing - if already closed will do nothing
  if (func == null){
    sendClientDone();
    return null;
  }
  // Rerunning
  else if (isConnected()) {
    return rerunLoaded(...params);
  }
  // Starting
  else {
    return launchSession(beforeFuncOrUrl, func, ...params);
  }
}

export function zzzTestFunc() {
  return browser.getTitle();
}

export function browserEx(func: (...any) => any, ...params: Array<any>): mixed {
   try {
     let caller = firstTestModuleInStack();
     return browserExBase(null, caller, func, ...params);
   }
  catch (e) {
    fail('browserEx - fail', e)
   } finally {
    endSeleniumIpcSession();
   }
}

function firstTestModuleInStack(): string {
  let fullStack = callstackStrings(),
      line = fullStack.find(s => TEST_SUFFIXES.some(suffix => hasText(s, suffix)));

  return filePathFromCallStackLine(
      ensureHasVal(line, `Could not find test module in callstack the calling function can only be executed from a test module: ${fullStack.join(newLine())}`)
  );
}

function launchSession(before: (() => void) | null | string, func: (...any) => any, ...params: Array<any>) {
   try {
     let caller = firstTestModuleInStack(),
     {
       funcName,
       beforeFuncInfo,
       sourcePath
     } = extractNamesAndSource(before, caller, func);
     launchWdioServerDetached(sourcePath, beforeFuncInfo, funcName, true);
     ensure(waitRetry(() => isConnected(), 30000), 'Timed out waiting on interactor');
     return interact(...params);
   }
  catch (e) {
    fail('launchSession - fail', e)
   }
}

function rerunLoaded(...params: Array<any>) {
   try {
     return interact(...params);
   }
  catch (e) {
    fail('rerunLoaded - fail', e)
   }
}


function extractNamesAndSource(before: (() => void) | string | null, caller: string, func: (...any) => any) {
  let beforeIsString = _.isString(before);
  return {
    funcName: functionNameFromFunction(func),
    beforeFuncInfo: before == null ? null : {
                                              isUrl: beforeIsString,
                                              name: beforeIsString ? show(before) : functionNameFromFunction(before)
                                            },
    sourcePath: findMatchingSourceFile(caller)
  }
}

function browserExBase(before: (() => void) | null | string, caller: string, func: (...any) => any, ...params: Array<any>): mixed {
  let {
      funcName,
      beforeFuncInfo,
      sourcePath
    } = extractNamesAndSource(before, caller, func);

   ensure(params.every(isSerialisable), 'browserEx optional params ~ unserailisable parameter passed in (like a function)');
   launchWebInteractor(sourcePath, beforeFuncInfo, funcName, true);
   return interact(...params);
}

export function findMatchingSourceFile(callerPath: string): string {
  let callerFileName = fileOrFolderName(callerPath);
  let suffix = TEST_SUFFIXES.find(s => hasText(callerFileName, s, true));

  suffix = ensureHasVal(suffix, trimLines(`webUtilsTestLoad - calling file is not a standard test file.
  This function can only be called from a standard test file that includes one of the following in the file name: ${TEST_SUFFIXES.join(', ')}`));

  let sourceFileName = callerFileName.replace(suffix, '.');
  function srcFile(fileName) {
    return combine(projectDir(), 'src', 'lib', fileName);
  }

  let candidatePaths = [srcFile(sourceFileName), testCaseFile(sourceFileName)],
    sourcePath = candidatePaths.find(pathExists);

  sourcePath = ensureHasVal(sourcePath, trimLines(`webUtilsTestLoad - target source file consistent with calling test file: ${callerPath} not found.
                                                   tried: ${candidatePaths.join(', ')}`));
  return sourcePath;
}
