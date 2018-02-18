// @flow

import type { Protocol } from './IpcProtocol';

import { stringToFile, tempFile, toTempString } from './FileUtils';
import { INTERACT_SOCKET_NAME } from './IpcProtocol';
import { log, logError, lowLevelLogging  } from './Logging';
import { toString } from './StringUtils';
import {cast, debug, ensure, ensureHasVal, fail, waitRetry} from './SysUtils';
import { dumpTestFile } from './WebInteractorGenerator';

import * as ipc from 'node-ipc';

var activeSocketSingleton = null;

function emit(socket: any, msgType: Protocol, msg?: {} ) {
  ipc.server.emit(socket, msgType, msg);
}

export function sendEnd(socket: any) {
  emit(socket, 'EndOfItems');
}

export function sendIteration(item: any, runConfig: any, socket: any) {
  emit(socket, 'Iteration', {item: item, runConfig: runConfig});
}

export function activeSocket() {
  return activeSocketSingleton;
}

var apStateSingleton = null;
export function apState() {
  return activeSocketSingleton;
}

export function setApState(apState: mixed): void {
  apStateSingleton = apState;
}

export function startServer() {
  debug('Server starting')

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
                          activeSocketSingleton = socket;
                        }
                      );

        when('ApState',
                        (data, socket) => {
                          setApState(data);
                        }
                      );


        when('Exception',
                      (data, socket) => {
                        throw data;
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
