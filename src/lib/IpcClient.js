// @flow

import * as ipc from 'node-ipc';
import type { Protocol } from './IpcProtocol';

import { stringToFile, tempFile, toTempString } from './FileUtils';
import { INTERACT_SOCKET_NAME, clientEmit } from './IpcProtocol';

let doneSingleton = false,
    interactInfoSingleton = null;

export function done() {
  return doneSingleton;
}

export function setDone(done: boolean) {
  doneSingleton = done;
}

export function interactInfo() {
  return interactInfoSingleton;
}

export function setInteractorInfo(interactInfo: mixed) {
  interactInfoSingleton = interactInfo;
}

export function runClient() {
  ipc.config.id = 'uiTest';
  ipc.config.retry = 1000;
  ipc.config.sync = false;
  ipc.config.silent = true;

  function when(msg: Protocol, action: (data: any) => void) {
    ipc.of[INTERACT_SOCKET_NAME].on(msg, action);
  }

  ipc.connectTo(
      INTERACT_SOCKET_NAME,
      function(){

         when('connect', () => {
                  clientEmit('Ready');
              });

          when(
              'disconnect',
                () => {
                  setDone(true);
              }
          );

          when(
              'Iteration',
              (data) => {
                  console.log(data, '!!!!! Next Iteration!!!!!');
                  setInteractorInfo(data);
              }
          );

          when(
              'EndOfItems',
              () => {
                clientEmit('ClientDone');
                setDone(true);
              }
          );
      }
    )
  }
