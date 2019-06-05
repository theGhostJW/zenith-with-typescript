import { runClient, invocationResponse, clearInvocationResponse, activeSocket,
          sendInvocationParams, sendClientDone, isConnected } from './SeleniumIpcClient';

import { tempFile,  toTemp, fromTemp, projectDir,
         logFile, fileToString, wdioConfigFile, pathExists } from './FileUtils';
import { log, logError, logWarning } from './Logging';
import { show, trimChars } from './StringUtils';

import {ensure, ensureHasVal, fail, waitRetry, translateErrorObj,
        def,  seekInObj, executeRunTimeFileAsynch, killTask, taskExists } from './SysUtils';
import { defaultConfig  } from './WebDriverIOConfig';

import { generateAndDumpTestFile, BeforeRunInfo } from './WebInteractorGenerator';

const _ = require('lodash');
const request = require('sync-request');
//@ts-ignore
import Launcher from '@wdio/cli';
const  fs = require('file-system');
const child_process = require('child_process');

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
export function checkStartDriver(runTimeBatch: string, isReady: () => boolean, timeoutMs: number = 30000): boolean {
  return isReady() || startDriver(runTimeBatch, isReady, timeoutMs);
}

export function startDriver(runTimeBatch: string, isReady: () => boolean, timeoutMs: number = 30000): boolean {
  // was startSelenium.bat
  executeRunTimeFileAsynch(runTimeBatch, true);
  return waitRetry(isReady, timeoutMs);
}

export function killDriver(imageName: string): boolean {
  return killTask(p => p.imageName === imageName);
}

export function imageProcessRunning(imageName: string): boolean {
  return taskExists(p => p.imageName === imageName);
}

const geckoDriverImage = "geckodriver.exe",
      geckoDriverBat = 'launchGeckoDriver.bat';

export function startGeckoDriver(): boolean {
  return startDriver(geckoDriverBat, geckoRunning);
}

export function killGeckoDriver(): boolean {
  return killDriver(geckoDriverImage);
}

export function checkStartGeckoDriver() : boolean {
  return checkStartDriver(geckoDriverBat, geckoRunning);
}

export function sendClientSessionDone() {
  if (waitConnected(3000)){
    waitRetry(() => !isConnected(), 30000, sendClientDone);
  }
}

export function interact<T>(...params: any[]): T {
  try {
    ensureHasVal(activeSocket(), 'socket not assigned')
    clearInvocationResponse();
    sendInvocationParams(...params);
    log('Waiting interaction response');
    waitRetry(() => invocationResponse() != null, 180000);
    return invocationResponse() == null ? fail('Interactor Timeout Error') : (<any>invocationResponse());
  } catch (e) {
    return fail(e);
  }
}

export {
  BeforeRunInfo
} from './WebInteractorGenerator';

export const rerunClient = runClient;

const weDriverTempConfigFileName = 'webdriverIO.config';
export function launchDetachedWdioServerInstance(configFileName?: string) {
  console.log("Starting instance");
  startWdioServer(configFileName);
  console.log("Instance Started");
}

export function launchWdioServerDetached(soucePath: string, beforeInfo: BeforeRunInfo | null, functionName: string, dynamicModuleLoading: boolean) {
  generateAndDumpTestFile(beforeInfo, functionName, soucePath, tempFile('WebInteractor.ts'), dynamicModuleLoading);
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

function launchWdioClientAndServer(configFileName?: string) {
  //BUG: move config to file
  try {
    runClient();
    startWdioServer(configFileName);
  } catch (e) {
    fail(e);
  }
}

function existingWdioConfigFile(fileName: string): string {
  const result = wdioConfigFile(fileName);
  ensure(pathExists(result), `existingWdioConfigFile - path ${result} does not exist.`)
  return result;
}

export function startWdioServer(configFileName: string = 'wdio.conf.js') {
  try {
    let failed = false,
        cfgPath = existingWdioConfigFile(configFileName),
        wdio = new Launcher(cfgPath, {});

    wdio.run().then(function (code: any) {
      if (code != 0){
        console.log('DEBUG wdio - non zero code: ' + code);
        logError(`WebDriver test launcher returned non zero response code: ${show(code)}`);
        failed = true;
      }
    }, function (error: any) {
      console.log('DEBUG Launcher failed to start the test', error.stacktrace);
      logError('Launcher failed to start the test ' + error.stacktrace);
      failed = true;
    });

    waitRetry(() => isConnected() || failed, 10000000);
  } catch (e) {
    fail(e);
  }
}

export function launchWebInteractor(soucePath: string, beforeInfo: BeforeRunInfo | null, functionName: string, dynamicModuleLoading: boolean, configFileName?: string){
  try {
      clearInvocationResponse();
      generateAndDumpTestFile(beforeInfo, functionName, soucePath, tempFile('WebInteractor.ts'), dynamicModuleLoading);
      geckoRestartIfNotReady();
      launchWdioClientAndServer(configFileName);
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

export function geckoRestartIfNotReady() {
  if (!geckoReady()){
    if (imageProcessRunning(geckoDriverImage)){
      killGeckoDriver();
    }
    startGeckoDriver();
  }
}

export function geckoReady(): boolean {
  return geckoRunning() && def(seekInObj(geckoStatus(), 'value', 'ready'), false);
}

export function geckoRunning(): boolean {
  // if connected to a session ready status will be false
  // so just testing status is there 
  function hasStatus() {
    return geckoStatus() != null;
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
