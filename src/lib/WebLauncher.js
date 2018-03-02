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
import { dumpTestFile } from './WebInteractorGenerator';

import { checkStartSelenium  } from './WebUtils';
import * as ipc from 'node-ipc';
import * as wd from 'webdriverio';


let webRunComplete = true;

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


export function launchWdioTestRun(config: {}, setFinished: bool => void, getFinished: void => bool) {
  try {
    setFinished(false);
    startSeleniumServerOnce();
    runClient();

    //$FlowFixMe
    let wdio = new wd.Launcher('.\\wdio.conf.js', config);
    log('Launching file: ' + cast(config).specs.join(', '));
    wdio.run().then(function (code) {
        if (code != 0){
          logError(`WebDriver test launcher returned non zero response code: ${toString(code)}`);
        }
        setFinished(true);
    }, function (error) {
        logError('Launcher failed to start the test', error.stacktrace);
        setFinished(true);
    });

    waitRetry(getFinished, 10000000);
  } catch (e) {
    fail(e);
  }
}

export function launchWebInteractor(testName: string){
  try {
    setApState(null);

    // debugging copy temp content to ./src/lib/WebInteractor.js and set this flag to true
    let internalTesting = true,
        spec = internalTesting ? './src/lib/WebInteractor.js' : tempFile('WebInteractor.js'),
        webDriverConfig = defaultConfig();

      webDriverConfig.specs = [spec];

      if (internalTesting){
        logWarning('INTERNAL TESTING FLAG IS SET');
      } else {
        dumpTestFile(testName, spec);
      }

    launchWdioTestRun(webDriverConfig,
                                    b => {webRunComplete = b},
                                    () => serverReady() || webRunComplete);
  } catch (e) {
    fail(e);
  }
}
