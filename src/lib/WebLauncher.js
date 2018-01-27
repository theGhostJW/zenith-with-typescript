// @flow

import { waitRetry, debug, fail, ensure, ensureHasVal } from './SysUtils';
import { toString  } from './StringUtils';
import { defaultConfig  } from './WebDriverIOConfig';
import { lowLevelLogging, logError  } from './Logging';
import * as wd from 'webdriverio';
import * as ipc from 'node-ipc';
import * as _ from 'lodash';
import type { Protocol } from './IpcProtocol';
import { INTERACT_SOCKET_NAME } from './IpcProtocol';

let apState = null,
    webDriverIOSocket = null,
    webRunComplete = true;

export function interact(item: any, runConfig: any) {
  try {
    ensureHasVal(webDriverIOSocket, 'socket not assigned')
    apState = null;
    sendIteration(item, runConfig, webDriverIOSocket);
    console.log('waiting web apState');
    let complete = waitRetry(() => apState != null, 600000, () => {});
    return complete ? apState : new Error('Interactor Timeout Error');
  } catch (e) {
    fail(e);
  }
}

function emit(socket: any, msgType: Protocol, msg?: {} ) {
  ipc.server.emit(socket, msgType, msg);
}

export function stopServer() {
  sendEnd(webDriverIOSocket);
  waitRetry(() => webRunComplete, 120000, () => {});
}

export function launchWebInteractor(){
  try {
    apState = null,
    webRunComplete = false;

    startServer();

    //$FlowFixMe
    let wdio = new wd.Launcher('.\\wdio.conf.js', defaultConfig());

    wdio.run().then(function (code) {
        if (code != 0){
          logError(`WebDriver test launcher returned non zero response code: ${toString(code)}`);
        }
        webRunComplete = true;
    }, function (error) {
        logError('Launcher failed to start the test', error.stacktrace);
        webRunComplete = true;
      //  process.exit(1);
    });

    waitRetry(() => webDriverIOSocket != null || webRunComplete, 10000000, () => {});
  } catch (e) {
    fail(e);
  }
}

function sendEnd(socket: any) {
  emit(socket, 'EndOfItems');
}

function sendIteration(item: any, runConfig: any, socket: any) {
  emit(socket, 'Iteration', {item: item, runConfig: runConfig});
}

function startServer() {
  // http://localhost:4444/wd/hub/status
  //

  ipc.config.id = INTERACT_SOCKET_NAME;
  ipc.config.retry = 50;
  ipc.config.sync = false;
  ipc.config.silent = true;

  function when(msg: Protocol, action: (data: any, socket: any) => void) {
    ipc.server.on(msg, action);
  }

  ipc.serve(
      function(){
          when('Ready',
                        (data, socket) => {
                          webDriverIOSocket = socket;
                        }
                      );

        when('ApState',
                        (data, socket) => {
                          apState = data;
                        }
                      );


        when('Exception',
                      (data, socket) => {
                        throw data;
                      }
                    );


        when('Log',
                      (data, socket) => {
                        lowLevelLogging(data.level, data.message, data.meta);
                      }
                    );

          when('ClientDone',
                          (data, socket) => {
                               ipc.disconnect(INTERACT_SOCKET_NAME);
                          }
                      );

          when('disconnect',
              (data, socket) => {
              }
          );
      }
  );

  ipc.server.start();
}
