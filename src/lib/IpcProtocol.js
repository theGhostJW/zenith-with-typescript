// @flow

import * as ipc from 'node-ipc';

export type Protocol = 'Ready' |
                          'ApState' |
                          'ClientDone' |
                          'Iteration' |
                          'EndOfItems' |
                          'Log' |
                          'Exception' |
                          // ipc-native
                          'disconnect' |
                          'connect' ;

export const INTERACT_SOCKET_NAME = 'uiInt';

export function clientEmit(msgType: Protocol, msg?: {} ) {
  ipc.of[INTERACT_SOCKET_NAME].emit(msgType, msg);
}
