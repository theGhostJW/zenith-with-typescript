// @flow

import { waitRetry, debug, fail  } from './SysUtils';
import { toString  } from './StringUtils';
import { defaultConfig  } from './WebDriverIOConfig';
import * as wd from 'webdriverio';
import * as ipc from 'node-ipc';
import * as _ from 'lodash';

let ready = false,
    apState = null,
    done = false;

export function interact(item: any, runConfig: any) {
  try {
    apState = null;
    debug('!!!!!!!!!!!!!!!!!!!!!!!  CALLED INTERACT !!!!!!!!!!!!!!!!!');
      ipc.server.emit(
       socket,
      'iteration',
      {
          id      : ipc.config.id,
          message : {item: item, runConfig: runConfig}
        }
    );

    let complete = waitRetry(() => apState != null, 600000, () => {}, 500);
    return complete ? apState : new Error('Interactor Timeout Error');
  } catch (e) {
    fail(e);
  }

}

export function stopServer() {
  ipc.of.uiInt.emit('serverDone');
  waitRetry(() => done == true, 60000);
  ipc.server.stop();
}

export function launchWebInteractor(){
  try {
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

    waitRetry(() => ready, 10000000, () => {debug('waiting on launcher')});
  } catch (e) {
    fail(e);
  }
}

function startServer() {
  ipc.config.id = 'uiInt';
  ipc.config.retry = 50;
  ipc.config.sync = true;


  ipc.serve(
      function(){
          ipc.server.on('ready',
                        function(data, socket){
                          ready = true
                        }
                      ),

          ipc.server.on(
              'apState',
              function(data, socket) {
                debug('!!!!!!! SERVER ON APSTATE MESSAGE  !!!!!!!');
                apState = data.message;
              }
            ),

            ipc.server.on(
                'ClientDone',
                function(data, socket){
                     debug('!!!!!!! SERVER ON AP MESSAGE - CLIENT DONE - Going Home !!!!!!!');
                     done = true;
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
}
