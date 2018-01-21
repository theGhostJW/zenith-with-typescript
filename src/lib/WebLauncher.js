// @flow

import { waitRetry, debug, fail, ensure, ensureHasVal } from './SysUtils';
import { toString  } from './StringUtils';
import { defaultConfig  } from './WebDriverIOConfig';
import * as wd from 'webdriverio';
import * as ipc from 'node-ipc';
import * as _ from 'lodash';

let ready = false,
    apState = null,
    done = false,
    webDriverIOSocket = null

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

export function stopServer() {
  done = true;
}

export function launchWebInteractor(){
  try {
    ready = false,
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

function sendIteration(item: any, runConfig: any, socket: any) {
  let iterationInput = {item: item, runConfig: runConfig};
  ipc.server.emit(
     socket,
    'iteration',
     {
        id      : ipc.config.id,
        message : iterationInput
     }
    );
}

function nextIteration(socket) {
  webDriverIOSocket = socket;
  // let finished = waitRetry(() => iterationInput != null || done, 600000000, () => {debug('waiting for input')}, 1000);
  // ensure(finished, 'nextIteration - timeout error');
  //
  // if (iterationInput != null ){
  //   ipc.server.emit(
  //    socket,
  //   'iteration',
  //    {
  //       id      : ipc.config.id,
  //       message : iterationInput
  //    }
  //   );
  //   iterationInput = null;
  // }
  // else {
  //   ipc.server.emit('serverDone');
  //   waitRetry(() => done == true, 60000);
  //   ipc.server.stop();
  // }
}

function startServer() {
  ipc.config.id = 'uiInt';
  ipc.config.retry = 50;
  ipc.config.sync = true;

  ipc.serve(
      function(){
          ipc.server.on('ready',
                        (data, socket) => {
                          ready = true;
                          debug(ready, 'Server ready response ready set')
                          webDriverIOSocket = socket;
                        }
                      ),

          ipc.server.on(
              'apState',
              (data, socket) => {
                debug('!!!!!!! SERVER ON APSTATE MESSAGE  !!!!!!!');
                apState = data.message;
              //  nextIterationPromise(socket);
              }
            ),

            ipc.server.on(
                'ClientDone',
                function(data, socket){
                     debug('!!!!!!! SERVER ON AP MESSAGE - CLIENT DONE - Going Home !!!!!!!');
                     ipc.disconnect('uiInt');
                }
          ),

          ipc.server.on(
              'disconnect',
              function(){
                  console.log('!!!!! SERVER DISCONNECTED !!!!!');
              }
          );
      }
  );

  ipc.server.start();
  debug('server started');
}
