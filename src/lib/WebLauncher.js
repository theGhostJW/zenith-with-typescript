// @flow

import { waitRetry, debug, fail, ensure, ensureHasVal } from './SysUtils';
import { toString  } from './StringUtils';
import { defaultConfig  } from './WebDriverIOConfig';
import * as wd from 'webdriverio';
import * as ipc from 'node-ipc';
import * as _ from 'lodash';
import type { Protocol } from './IpcProtocol';

let apState = null,
    done = false,
    webDriverIOSocket = null;

export function interact(item: any, runConfig: any) {
  debug('!!!!!!!!!!!!!!!!!!!!!!!  CALLED INTERACT !!!!!!!!!!!!!!!!!');
  try {
    ensureHasVal(webDriverIOSocket, 'socket not assigned')
    apState = null;
    sendIteration(item, runConfig, webDriverIOSocket);
    let complete = waitRetry(() => apState != null, 600000, () => {debug('waiting apState')}, 500);
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

    debug(`start server ~ PID: ${toString(process.pid)}`);

    startServer();

    //$FlowFixMe
    let wdio = new wd.Launcher('.\\wdio.conf.js', defaultConfig());

    debug(`About to launch: ${toString(process.pid)}`);
    wdio.run().then(function (code) {
        //process.exit(code);
        console.log(`test run: ${code}`);
    }, function (error) {
        console.error('Launcher failed to start the test', error.stacktrace);
      //  process.exit(1);
    });

    waitRetry(() => webDriverIOSocket != null, 10000000, () => {debug('waiting on launcher')});
    debug('LAUNCHED !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!')
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
  ipc.config.id = 'uiInt';
  ipc.config.retry = 50;
  ipc.config.sync = true;

  function when(msg: Protocol, action: (data: any, socket: any) => void) {
    ipc.server.on(msg, action);
  }

  ipc.serve(
      function(){
          when('Ready',
                        (data, socket) => {
                          debug('Server ready response ready recieved from client');
                          webDriverIOSocket = socket;
                        }
                      );

          when('ApState',
                        (data, socket) => {
                          debug('!!!!!!! SERVER ON APSTATE MESSAGE  !!!!!!!');
                          apState = data;
                        }
                      );

          when('ClientDone',
                          (data, socket) => {
                               debug('!!!!!!! SERVER ON AP MESSAGE - CLIENT DONE - Going Home !!!!!!!');
                               ipc.disconnect('uiInt');
                               ipc.stop();
                          }
                      );

          when('disconnect',
              (data, socket) => {
                  console.log('!!!!! SERVER DISCONNECTED !!!!!');
              }
          );
      }
  );

  ipc.server.start();
  debug('server started');
}
