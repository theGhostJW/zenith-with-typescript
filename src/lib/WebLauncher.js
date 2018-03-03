// @flow

import type { Protocol } from './SeleniumIpcProtocol';
import { runClient, invocationResponse, setApState, activeSocket, sendIteration, sendEnd,
          serverReady } from './SeleniumIpcClient';

import { stringToFile, tempFile, toTempString } from './FileUtils';
import { INTERACT_SOCKET_NAME } from './SeleniumIpcProtocol';
import { log, logError, lowLevelLogging, logWarning } from './Logging';
import { toString, trimChars } from './StringUtils';

import {cast, debug, ensure, ensureHasVal, fail, waitRetry, translateErrorObj,
        def,  seekInObj, executeRunTimeFile } from './SysUtils';
import { defaultConfig  } from './WebDriverIOConfig';
import { generateAndDumpTestFile } from './WebInteractorGenerator';
import * as _ from 'lodash';
import request from 'sync-request';

import * as ipc from 'node-ipc';
import * as wd from 'webdriverio';

export const endSeleniumIpcSession = sendEnd;

export const SELENIUM_BASE_URL = 'http://localhost:4444/';
export const SELENIUM_BAT_NAME = 'selenium-server-standalone-3.8.1.jar';

export function interact(item: any, runConfig: any) {
  try {
    ensureHasVal(activeSocket(), 'socket not assigned')
    setApState(null);
    sendIteration(item, runConfig);
    console.log('waiting web apState');
    let complete = waitRetry(() => invocationResponse() != null, 600000);
    return complete ? invocationResponse() : new Error('Interactor Timeout Error');
  } catch (e) {
    fail(e);
  }
}


let seleniumLaunched = false;
function startSeleniumServerOnce() {
  if (!seleniumLaunched){
    checkStartSelenium();
  }
  seleniumLaunched = true;
}


export function launchWdioServer(config: {}) {
  try {
    let failed = false;
    startSeleniumServerOnce();
    runClient();

    //$FlowFixMe
    let wdio = new wd.Launcher('.\\wdio.conf.js', config);
    log('Launching file: ' + cast(config).specs.join(', '));
    wdio.run().then(function (code) {
        if (code != 0){
          logError(`WebDriver test launcher returned non zero response code: ${toString(code)}`);
        }
        failed = true;
    }, function (error) {
        logError('Launcher failed to start the test', error.stacktrace);
        failed = true;
    });

    waitRetry(() => serverReady() || failed, 10000000);
  } catch (e) {
    fail(e);
  }
}

export function launchWebIOSession(soucePath: string){
  try {
    // debugging copy temp content to ./src/lib/WebInteractor.js and set this flag to true
    let internalTesting = true,
        destPath = internalTesting ? './src/lib/WebInteractor.js' : tempFile('WebInteractor.js'),
        webDriverConfig = defaultConfig();

      webDriverConfig.specs = [destPath];

      if (internalTesting){
        logWarning('INTERNAL TESTING FLAG IS SET');
      } else {
        generateAndDumpTestFile(soucePath, destPath);
      }

    launchWdioServer(webDriverConfig);

  } catch (e) {
    fail(e);
  }
}

export function launchWebInteractor(soucePath: string){
  setApState(null);
  launchWebIOSession(soucePath);
}


export function checkStartSelenium() {
  let running = seleniumRunning();
  if (!running){
    log('Starting Selenium WebDriver Server');
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
