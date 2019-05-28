import * as ipc from 'node-ipc';

import { INTERACT_SOCKET_NAME, Protocol} from './SeleniumIpcProtocol';
import { lowLevelLogging  } from './Logging';
import { debug, waitRetry } from './SysUtils';
import { createGuid } from './StringUtils';

let
    invocationResponseSingleton: any = null,
    responseReceived = false;

export function disconnectClient() {
  (<any>ipc).disconnect(INTERACT_SOCKET_NAME);
}

export function clientEmit(msgType: Protocol, msg?: any[] ) {
  (<any>ipc).of[INTERACT_SOCKET_NAME].emit(msgType, msg);
}

export function invocationResponse<T>(): T | undefined {
  return responseReceived ? (<T>invocationResponseSingleton ): undefined;
}

function loadInvocationResponse<T>(response: T): void {
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

export function sendInvocationParams(...params: any[]) {
  clientEmit('InvocationParams', params);
}

export function activeSocket() {
  return (<any>ipc).of[INTERACT_SOCKET_NAME];
}

let ponged: boolean = false;

export function isConnected() {
  ponged = false;

  function isPonged() {
    if ((<any>ipc).of[INTERACT_SOCKET_NAME] == null){
      return false;
    }
    clientEmit('Ping');
    return ponged;
  }

  return waitRetry(isPonged, 50);
}

/// The Launcher runs from the client
export function runClient() {
  (<any>ipc).config.id = createGuid();
  (<any>ipc).config.retry = 500;
  (<any>ipc).config.sync = false;
  (<any>ipc).config.silent = true;

//  debug (`client launched ${process.pid}`)

  function when(msg: Protocol, action: (data: any) => void) {
    (<any>ipc).of[INTERACT_SOCKET_NAME].on(msg, action);
  }

  (<any>ipc).connectTo(
      INTERACT_SOCKET_NAME,
      function(){

        when('Pong',
                    (data) => {
                      ponged = true;
                    }
                    );

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
                        }
                    );

        when('connect',
                (data) => {
                }
             );

        when('Debug',
                (data) => {
                  debug(data, '');
                }
        );

      }
    )

  }
