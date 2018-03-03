// @flow

import type { Protocol } from './SeleniumIpcProtocol';
import { runClient, apState, setApState, activeSocket, sendIteration, sendEnd,
          serverReady } from './SeleniumIpcClient';

import { stringToFile, tempFile, toTempString } from './FileUtils';
import { INTERACT_SOCKET_NAME } from './SeleniumIpcProtocol';
import { log, logError, lowLevelLogging, logWarning } from './Logging';
import { toString } from './StringUtils';

import {cast, debug, ensure, ensureHasVal, fail, waitRetry} from './SysUtils';
import { defaultConfig  } from './WebDriverIOConfig';
import { generateAndDumpTestFile } from './WebInteractorGenerator';

import { checkStartSelenium  } from './WebUtils';
import * as ipc from 'node-ipc';
import * as wd from 'webdriverio';

export const endSeleniumIpcSession = sendEnd;

export function interact(item: any, runConfig: any) {
  try {
    ensureHasVal(activeSocket(), 'socket not assigned')
    setApState(null);
    sendIteration(item, runConfig);
    console.log('waiting web apState');
    let complete = waitRetry(() => apState() != null, 600000);
    return complete ? apState() : new Error('Interactor Timeout Error');
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
    let internalTesting = false,
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
