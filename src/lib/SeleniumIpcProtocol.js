// @flow

import * as ipc from 'node-ipc';
import { debug } from './SysUtils';

export type Protocol =   'InvocationResponse' |
                          'ServerDone' |
                          'InvocationParams' |
                          'EndOfItems' |
                          'Log' |
                          'Exception' |
                          // ipc-native
                          'disconnect' |
                          'connect' ;

export const INTERACT_SOCKET_NAME = 'uiInt';
