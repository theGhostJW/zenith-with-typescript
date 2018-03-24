// @flow

import {
  combine,
  copyFile,
  fileOrFolderName,
  fileToString,
  fromTemp,
  parentDir,
  pathExists,
  projectDir,
  projectSubDir,
  runTimeFile,
  stringToFile,
  tempFileExists,
  testCaseFile,
  toTemp,
  PATH_SEPARATOR,
} from './FileUtils';

import { hasText, newLine, show, subStrAfter, subStrBetween, trimChars,
         trimLines, wildCardMatch } from './StringUtils';
import {
        areEqual, callstackStrings, cast, debug, def, delay, ensure,
         ensureHasVal, ensureReturn, fail,
        filePathFromCallStackLine, functionNameFromFunction, isSerialisable,
        waitRetry, TEST_SUFFIXES
      } from './SysUtils';
import { interact, isConnected,
          launchWdioServerDetached,  launchWebInteractor, runClient,
          sendClientDone, stopSession, waitConnected, disconnectClient } from './WebLauncher';
import * as _ from 'lodash';



//$FlowFixMe
export const S = s => $(s);

//$FlowFixMe
export const SS = s => $$(s);

export type Element = {
  getText: () => string,
  click: () => void
}

export const clickLink = (displayText: string) => linkByText(displayText).click();

export function linkByText(displayText: string): Element {
  let result = links().find(l => wildCardMatch(l.getText(), displayText))
  if (result == null){
    fail(
          'linkByText Failed',
          'could not find a link with display text matching: ' + displayText
        );
    // just to keep flow hapy will never return
    return cast({});
  }
  else {
    return result;
  }
}

export function links() {
  return SS('[href]');
}

export function url(url: string) {
  browser.url(url);
}

export function click(elementSelector: string) {
  browser.click(elementSelector);
}

export function set(elementSelector: string, value: string | number | Array<string|number>) {
  S(elementSelector).setValue(value);
}


function signature(beforeFuncOrUrl: (() => void) | string | null = null, func: ?(...any) => any) {
  return {
    before: _.isFunction(beforeFuncOrUrl) ? functionNameFromFunction(beforeFuncOrUrl) : show(beforeFuncOrUrl),
    target: functionNameFromFunction(func)
  }
}

const webDriverIOParamsSignatureFileName = 'webioParams.yaml';

function saveSignature(sig) {
  toTemp(sig, webDriverIOParamsSignatureFileName, false, false);
}

function signatureChanged(sig) {
  return tempFileExists(webDriverIOParamsSignatureFileName) ? !areEqual(fromTemp(webDriverIOParamsSignatureFileName), sig) : true;
}

export function rerun(beforeFuncOrUrl: (() => void) | string | null = null, func: ?(...any) => any, ...params: Array<any>): mixed {
  let result;
  try {
    runClient();
    // Closing - if already closed will do nothing
    if (func == null){
      stopSession();
      return null;
    }

    let connected = isConnected(),
        sig = signature(beforeFuncOrUrl, func),
        sigChangedConnected = connected && debug(signatureChanged(sig), 'sig-changed');

    debug(connected, 'connected');
    debug(sigChangedConnected, 'sigChangedConnected');

    // close off session if signatureChanged
    if (sigChangedConnected) {
      debug('Closing down');
      stopSession();
      runClient();
    }

    saveSignature(sig);

    result = !connected || sigChangedConnected ?
                                 launchSession(beforeFuncOrUrl, func, ...params) :
                                 rerunLoaded(...params);

  } catch (e) {

  } finally {
    disconnectClient();
  }

  return result;

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
    stopSession();
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
     ;
     ensure(waitConnected(30000), 'Timed out waiting on interactor');
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
