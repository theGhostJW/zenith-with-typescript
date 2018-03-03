// @flow

import * as ipc from 'node-ipc';
import type { Protocol } from './SeleniumIpcProtocol';

import { stringToFile, tempFile, toTempString } from './FileUtils';
import { INTERACT_SOCKET_NAME} from './SeleniumIpcProtocol';
import { log, logError, lowLevelLogging  } from './Logging';
import { debug } from './SysUtils';

let
    invocationResponseSingleton = null,
    serverReadySingleton = false;

export function clientEmit(msgType: Protocol, msg?: {} ) {
  ipc.of[INTERACT_SOCKET_NAME].emit(msgType, msg);
}

export function serverReady() {
  return serverReadySingleton;
}

export function setServerReady(ready: boolean) {
  return serverReadySingleton = ready;
}

export function invocationResponse() {
  return invocationResponseSingleton;
}

export function setApState(response: mixed): void {
  invocationResponseSingleton = response;
}

export function sendEnd() {
  clientEmit('EndOfItems');
}

export function sendIteration(item: any, runConfig: any) {
  clientEmit('InvocationParams', {item: item, runConfig: runConfig});
}

export function activeSocket() {
  return ipc.of[INTERACT_SOCKET_NAME];
}

/// The Launcher runs from the client
export function runClient() {
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
  }
