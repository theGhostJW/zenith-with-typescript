// @flow

import * as ipc from 'node-ipc';
import { debug } from './SysUtils';

export type Protocol =   'ApState' |
                          'ServerDone' |
                          'Iteration' |
                          'EndOfItems' |
                          'Log' |
                          'Exception' |
                          // ipc-native
                          'disconnect' |
                          'connect' ;

export const INTERACT_SOCKET_NAME = 'uiInt';
