// @flow

import * as ipc from 'node-ipc';
import type { Protocol } from './SeleniumIpcProtocol';

import { stringToFile, tempFile, toTempString } from './FileUtils';
import { INTERACT_SOCKET_NAME} from './SeleniumIpcProtocol';
import { log, logError, lowLevelLogging  } from './Logging';
import { debug } from './SysUtils';

let
    invocationResponseSingleton = null,
    responseReceived = false,
    serverReadySingleton = false;

export function clientEmit(msgType: Protocol, msg?: Array<mixed> ) {
  ipc.of[INTERACT_SOCKET_NAME].emit(msgType, msg);
}

export function serverReady() {
  return serverReadySingleton;
}

export function setServerReady(ready: boolean) {
  return serverReadySingleton = ready;
}

export function invocationResponse() {
  return responseReceived ? invocationResponseSingleton : undefined;
}

function loadInvocationResponse(response: mixed): void {
  responseReceived = true;
  invocationResponseSingleton = response;
}

export function clearInvocationResponse(): void {
  responseReceived = false;
  invocationResponseSingleton = null;
}

export function sendClientDone() {
  clientEmit('ClientSessionDone');
}

export function sendInvocationParams(...params?: Array<mixed>) {
  clientEmit('InvocationParams', params);
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

        when('InvocationResponse',
                      (data) => {
                        loadInvocationResponse(data);
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
