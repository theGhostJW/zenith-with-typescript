// @flow

import type { Protocol } from './SeleniumIpcProtocol';

import { stringToFile, tempFile, toTempString } from './FileUtils';
import { INTERACT_SOCKET_NAME } from './SeleniumIpcProtocol';

import { show, hasText } from './StringUtils';
import {cast, debug, ensure, ensureHasVal, fail, waitRetry, hasValue} from './SysUtils';
import { generateAndDumpTestFile } from './WebInteractorGenerator';

import * as ipc from 'node-ipc';

/// STATE

let doneSingleton = false,
    invocationParamsSingleton: ?Array<mixed>;

export function isReloadableFile(path: string): boolean {
  return !hasText(path, 'node_modules')
              &&  !hasText(path, '\\temp\\')
              &&  (path != '${modulePath}')
              &&  !hasText(path, 'SeleniumIpcServer')
              &&  !hasText(path, 'WebInteractor')
              &&  !hasText(path, 'wdio.conf')
}

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

export function sendWebUIDebugMessage(msg: string): boolean {
  let result = hasValue(clientSocket);
  if (result){
    emitMessage('Debug', 'FROM WEB UI PROCESS - ' + msg);
  }
  return result;
}

export function emitMessageIfSocketAssigned(msgType: Protocol, msg?: mixed ) {
  if (hasValue(clientSocket)){
     emit(clientSocket, msgType, msg);
  }
}

function emit(socket: any, msgType: Protocol, msg?: mixed ) {
  ipc.server.emit(socket, msgType, msg);
}

export function stopServer() {
  ipc.server.stop();
}

/// The Interactor Runs the server
export function startServer() {
  if (ipc.server){
    return;
  }
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
              //emit(socket, 'ServerDone');
              stopServer();
              setDone(true);
            }
          );

        when(
            'Ping',
            (data, socket) => {
              emit(socket, 'Pong');
            }
          );

        when('connect',
              (data, socket) => {
                clientSocket = data;
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
