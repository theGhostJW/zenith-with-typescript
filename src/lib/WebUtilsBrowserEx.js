// @flow

import * as wdInjected from 'webdriverio';
import * as ipcInjected from 'node-ipc';



import {trimLines} from '../index';
import { combine, fileOrFolderName, pathExists, projectDir, projectSubDir, runTimeFile, testCaseFile, PATH_SEPARATOR,
          copyFile, parentDir, fileToString, stringToFile } from './FileUtils';
import { hasText, subStrAfter, subStrBetween, trimChars, newLine } from './StringUtils';
import { cast, debug, def, delay, ensure, ensureHasVal, executeRunTimeFile, getCallerString, seekInObj,
          translateErrorObj, waitRetry } from './SysUtils';
import * as _ from 'lodash';
import request from 'sync-request';


export const SELENIUM_BASE_URL = 'http://localhost:4444/';
export const SELENIUM_BAT_NAME = 'selenium-server-standalone-3.8.1.jar';

function copySourceAddIPCServer(srcPath: string, dstPath: string): void {
  let srcText = fileToString(srcPath),
      imports = trimLines(`import * as wdInjected from 'webdriverio';
                           import * as ipcInjected from 'node-ipc';`);

  srcText = imports + newLine(2) + srcText;

  stringToFile(srcText, dstPath)
}

function sourceFileDestOfTestFile(callerPath: string): [string, string] {
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
  tried: ${TEST_SUFFIXES.join(', ')}`));

  let mockFileName = callerFileName.replace(suffix, '.uiRunner.'),
    mockPath = combine(parentDir(sourcePath), mockFileName);

   return [sourcePath, mockPath];
}

// Note very dependent on folder conventions
export function webUtilsTestLoad(){
  let callerStr = getCallerString(),
      callerPath = subStrBetween(callerStr, ' (', PATH_SEPARATOR) + PATH_SEPARATOR + subStrBetween(callerStr, PATH_SEPARATOR, ':'),
      [srcPath, dstPath] = sourceFileDestOfTestFile(callerPath);

  copySourceAddIPCServer(srcPath, dstPath);
}


export function checkStartSelenium() {
  let running = seleniumRunning();
  if (!running){
    startSelenium();
    let started = waitRetry(seleniumRunning, 60000, () => {}, 1000);
    ensure(started, 'checkStartSelenium - selenium stand alone server did not start');
  }
}



export function startSelenium() {
  executeRunTimeFile('startSelenium.bat', false);
}

function seleniumSubUrl(subPath: string) {
  return SELENIUM_BASE_URL + trimChars(subPath, ['/']);
}

export function seleniumStatus(): {} {

  let response;
  try {
    response = request('GET', seleniumSubUrl('/wd/hub/status'));
  } catch (e) {
    response = translateErrorObj(e);
    response.ready = false;
  }

  if (_.isObject(response) && response.body != null){
    return JSON.parse(response.body.toString('UTF-8'));
  }
  else {
    return def(response, {});
  }
}

export function seleniumRunning(): boolean {
  let status = seleniumStatus();
  return def(seekInObj(status, 'ready'), false);
}
