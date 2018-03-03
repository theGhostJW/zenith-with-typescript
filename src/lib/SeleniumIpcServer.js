// @flow

import type { Protocol } from './SeleniumIpcProtocol';

import { stringToFile, tempFile, toTempString } from './FileUtils';
import { INTERACT_SOCKET_NAME } from './SeleniumIpcProtocol';

import { toString } from './StringUtils';
import {cast, debug, ensure, ensureHasVal, fail, waitRetry} from './SysUtils';
import { generateAndDumpTestFile } from './WebInteractorGenerator';

import * as ipc from 'node-ipc';

/// STATE

let doneSingleton = false,
    invocationParamsSingleton: ?Array<mixed>;

export function done() {
  return doneSingleton;
}

export function setDone(done: boolean) {
  doneSingleton = done;
}

export function invocationParams() : ?Array<mixed> {
  return invocationParamsSingleton;
}

export function setInvocationParams(invocationParams: ?Array<mixed>) {
  invocationParamsSingleton = invocationParams;
}

let clientSocket = null;
export function emitMessage(msgType: Protocol, msg?: mixed ) {
  ensureHasVal(clientSocket, 'clientSocket is unassigned');
  emit(clientSocket, msgType, msg);
}

function emit(socket: any, msgType: Protocol, msg?: mixed ) {
  ipc.server.emit(socket, msgType, msg);
}

/// The Interactor Runs the server
export function startServer() {
  ipc.config.id = INTERACT_SOCKET_NAME;
  ipc.config.retry = 50;
  ipc.config.sync = false;
  ipc.config.silent = true;

  function when(msg: Protocol, action: (data: any, socket: any) => void) {
    ipc.server.on(msg, action);
  }

  ipc.serve(
      function(){
        when('InvocationParams',
                        (data, socket) => {
                          setInvocationParams(data);
                        }
                      );

        when(
            'ClientSessionDone',
            (data, socket) => {
              emit(socket, 'ServerDone');
              setDone(true);
            }
          );

        when('connect',
              (data, socket) => {
                //ToDo: up to here looks VERY wrong !!
                clientSocket = data;
              }
        );
   }
 );

  ipc.server.start();
}
