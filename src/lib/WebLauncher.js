// @flow

import type { Protocol } from './SeleniumIpcProtocol';
import { runClient, invocationResponse, clearInvocationResponse, activeSocket,
          sendInvocationParams, sendClientDone, isConnected } from './SeleniumIpcClient';

import { stringToFile, tempFile, toTempString, toTemp, fromTemp, projectDir,
         logFile, combine, fileToString } from './FileUtils';
import { INTERACT_SOCKET_NAME } from './SeleniumIpcProtocol';
import { log, logError, lowLevelLogging, logWarning } from './Logging';
import { show, trimChars } from './StringUtils';

import {cast, debug, ensure, ensureHasVal, fail, waitRetry, translateErrorObj,
        def,  seekInObj, executeRunTimeFileAsynch, killTask, taskExists } from './SysUtils';
import { defaultConfig  } from './WebDriverIOConfig';

import { generateAndDumpTestFile } from './WebInteractorGenerator';
import type { BeforeRunInfo } from './WebInteractorGenerator';

import * as _ from 'lodash';
import request from 'sync-request';

import * as ipc from 'node-ipc';
//$FlowFixMe
import Launcher from '@wdio/cli';
import * as fs from 'file-system';
import child_process from 'child_process';

export {
  isConnected,
  sendClientDone,
  runClient,
  disconnectClient
} from './SeleniumIpcClient';

export const SELENIUM_BASE_URL = 'http://localhost:4444/';

export function waitConnected(timeout: number, wantConnected: boolean = true) {
  return waitRetry(() => isConnected() == wantConnected, timeout);
}

// todo: other drivers
export function checkStartDriver(runTimeBatch: string, isReady: () => bool, timeoutMs: number = 30000): bool {
  return isReady() || startDriver(runTimeBatch, isReady, timeoutMs);
}

export function startDriver(runTimeBatch: string, isReady: () => bool, timeoutMs: number = 30000): bool {
  // was startSelenium.bat
  executeRunTimeFileAsynch(runTimeBatch);
  return waitRetry(isReady, timeoutMs);
}

export function killDriver(imageName: string): bool {
  return killTask(p => p.imageName === imageName);
}

export function imageProcessRunning(imageName: string): bool {
  return taskExists(p => p.imageName === imageName);
}

const geckoDriverImage = "geckodriver.exe",
      geckoDriverBat = 'launchGeckoDriver.bat';

export function startGeckoDriver(): bool {
  return startDriver(geckoDriverBat, geckoRunning);
}

export function killGeckoDriver(): bool {
  return killDriver(geckoDriverImage);
}

export function checkStartGeckoDriver() : bool {
  return checkStartDriver(geckoDriverBat, geckoRunning);
}

export function stopSession() {
  if (waitConnected(3000)){
    sendClientDone();
    waitRetry(() => !isConnected(), 30000, sendClientDone);
  }
}

export function interact<T>(...params?: mixed[]): T {
  try {
    ensureHasVal(activeSocket(), 'socket not assigned')
    clearInvocationResponse();
    sendInvocationParams(...params);
    log('Waiting interaction response');
    let complete = waitRetry(() => invocationResponse() != null, 180000),
        result: T = invocationResponse() == null ? fail('Interactor Timeout Error') : cast(invocationResponse());
    return result
  } catch (e) {
    return fail(e);
  }
}

export {
  BeforeRunInfo
} from './WebInteractorGenerator';

export const rerunClient = runClient;

const weDriverTempConfigFileName = 'webdriverIO.config';
export function launchDetachedWdioServerInstance() {
  let config = fromTemp(weDriverTempConfigFileName, false);
  startWdioServer(config);
}

export function launchWdioServerDetached(soucePath: string, beforeInfo: BeforeRunInfo | null, functionName: string, dynamicModuleLoading: boolean) {
  let webDriverConfig = generateWebDriverTestFileAndConfig(soucePath, beforeInfo, functionName, dynamicModuleLoading);
  toTemp(webDriverConfig, weDriverTempConfigFileName, false);
   
  const out = fs.openSync(logFile('launchWdioServerDetached-out.log'), 'w'),
        err = fs.openSync(logFile('launchWdioServerDetached-err.log'), 'w'),
        proDir = projectDir();
  
  checkStartGeckoDriver();
  const child = child_process.spawn('node', ['.\\scripts\\LaunchWebDriverIO.js'], {
                                                      cwd: proDir,
                                                      detached: true,
                                                      stdio: [ 'ignore', out, err]
                                                    }
                                                  );

  child.unref();
}

function launchWdioClientAndServer(config: {}) {

  try {
    runClient();
    startWdioServer(config)
  } catch (e) {
    fail(e);
  }
}

export function startWdioServer(config: {}) {
  console.log("DEBUG startWdioServer!!");
  try {
    let failed = false;
    // console.log("DEBUG STARTING DRIVER!!");
    // checkStartGeckoDriver();
    // console.log("DEBUG DRIVER Started");
    //$FlowFixMe
    let wdio = new Launcher('.\\wdio.conf.js', config);
    console.log("LAUNCHER ASSIGNED");
    console.log('Launching file: ' + cast(config).specs.join(', '));
    console.log('CONFIG FILE: ' + fileToString('.\\wdio.conf.js'));
    log('Launching file: ' + cast(config).specs.join(', '));
    wdio.run().then(function (code) {
      if (code != 0){
        logError(`WebDriver test launcher returned non zero response code: ${show(code)}`);
        failed = true;
      }
    }, function (error) {
      logError('Launcher failed to start the test', error.stacktrace);
      failed = true;
    });

    waitRetry(() => isConnected() || failed, 10000000);
  } catch (e) {
    fail(e);
  }
}

function generateWebDriverTestFileAndConfig(soucePath: string, beforeInfo: BeforeRunInfo | null, functionName: string, dynamicModuleLoading: boolean): {} {
  // debugging copy temp content to ./src/lib/WebInteractor.js and set this flag to true
  let internalTesting = false,
      destPath = internalTesting ? './src/lib/WebInteractor.js' : tempFile('WebInteractor.js');

  if (internalTesting){
    logWarning('INTERNAL TESTING FLAG IS SET');
  } else {
    generateAndDumpTestFile(beforeInfo, functionName, soucePath, destPath, dynamicModuleLoading);
  }

  let webDriverConfig = defaultConfig();
  webDriverConfig.specs = [destPath];

  return webDriverConfig;
}

export function launchWebInteractor(soucePath: string, beforeInfo: BeforeRunInfo | null, functionName: string, dynamicModuleLoading: boolean){
  try {
      clearInvocationResponse();
      let webDriverConfig = generateWebDriverTestFileAndConfig(soucePath, beforeInfo, functionName, dynamicModuleLoading);
      launchWdioClientAndServer(webDriverConfig);
  } catch (e) {
    fail(e);
  }
}

function geckoSubUrl(subPath: string) {
  return SELENIUM_BASE_URL + trimChars(subPath, ['/']);
}

export function geckoStatus(): {} {

  let response;
  try {
    response = request('GET', geckoSubUrl('/status'));
  } catch (e) {
    response = translateErrorObj(e, 'exception thrown getting geckoServer Status');
    response.ready = false;
  }

  if (_.isObject(response) && response.body != null){
    return JSON.parse(response.body.toString('UTF-8'));
  }
  else {
    return def(response, {});
  }
}

export function geckoRunning(): boolean {
  // if connected to a session ready status will be false
  // so just testing status is there 
  function hasStatus() {
    let status = geckoStatus();
    return status != null;
  }

 //TODO: bug here when session already running - ready will be false
 // will need work for parrellel runs
  if (imageProcessRunning(geckoDriverImage)){
    let result = waitRetry(hasStatus, 10000);
    ensure(result, "Timeout waiting for gecko driver to be ready - status at timeout: " + show(geckoStatus()));
    return true;
  }
  
  return false;
}
