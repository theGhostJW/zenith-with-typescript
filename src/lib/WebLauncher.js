// @flow

import { waitRetry, debug, fail, ensure, ensureHasVal } from './SysUtils';
import { toString  } from './StringUtils';
import { defaultConfig  } from './WebDriverIOConfig';
import { lowLevelLogging  } from './Logging';
import * as wd from 'webdriverio';
import * as ipc from 'node-ipc';
import * as _ from 'lodash';
import type { Protocol } from './IpcProtocol';
import { INTERACT_SOCKET_NAME } from './IpcProtocol';

let apState = null,
    done = false,
    webDriverIOSocket = null;

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
}

export function launchWebInteractor(){
  try {
    apState = null,
    done = false;

    startServer();

    //$FlowFixMe
    let wdio = new wd.Launcher('.\\wdio.conf.js', defaultConfig());

    wdio.run().then(function (code) {
        //process.exit(code);
        console.log(`test run: ${code}`);
    }, function (error) {
        console.error('Launcher failed to start the test', error.stacktrace);
      //  process.exit(1);
    });

    waitRetry(() => webDriverIOSocket != null, 10000000, () => {});
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

        when('Log',
                      (data, socket) => {
                        lowLevelLogging(data.level, data.message, data.meta);
                      }
                    );

          when('ClientDone',
                          (data, socket) => {
                               ipc.disconnect(INTERACT_SOCKET_NAME);
                               ipc.stop();
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
