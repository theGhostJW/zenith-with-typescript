// @flow

import * as ipc from 'node-ipc';
import type { Protocol } from './SeleniumIpcProtocol';

import { stringToFile, tempFile, toTempString } from './FileUtils';
import { INTERACT_SOCKET_NAME, clientEmit } from './SeleniumIpcProtocol';
import { log, logError, lowLevelLogging  } from './Logging';
import { debug } from './SysUtils';

let
    apStateSingleton = null,
    serverReadySingleton = false;

export function serverReady() {
  return serverReadySingleton;
}

export function setServerReady(ready: boolean) {
  return serverReadySingleton = ready;
}

export function apState() {
  return apStateSingleton;
}

export function setApState(apState: mixed): void {
  apStateSingleton = apState;
}

export function sendEnd(socket: any) {
  clientEmit('EndOfItems');
}

export function sendIteration(item: any, runConfig: any) {
  clientEmit('Iteration', {item: item, runConfig: runConfig});
}

export function activeSocket() {
  return ipc.of[INTERACT_SOCKET_NAME];
}

/// The Launcher runs from the client
export function runClient() {
  debug('Running CLIENT');
  ipc.config.id = 'uiTest';
  ipc.config.retry = 500;
  ipc.config.sync = false;
  ipc.config.silent = true;

  function when(msg: Protocol, action: (data: any) => void) {
    ipc.of[INTERACT_SOCKET_NAME].on(msg, action);
  }

  ipc.connectTo(
      INTERACT_SOCKET_NAME,
      function(){

        when('ApState',
                      (data) => {
                        setApState(data);
                      }
                    );

        when('Exception',
                    (data) => {
                      throw data;
                    }
                  );


        when('Log',
                    (data) => {
                      lowLevelLogging(data.level, data.message, data.meta);
                    }
                  );

        when('ServerDone',
                        (data) => {
                             ipc.disconnect(INTERACT_SOCKET_NAME);
                        }
                    );

        when('connect',
              (data) => {
                setServerReady(true);
              }
        );
      }
    )

    debug('CLIENT Connected');
  }
