export type Protocol =   'InvocationResponse' |
                          'ServerDone' |
                          'InvocationParams' |
                          'ClientSessionDone' |
                          'Log' |
                          'Debug' |
                          'Exception' |
                          'Ping' |
                          'Pong' |
                          // ipc-native
                          'disconnect' |
                          'connect' ;

export const INTERACT_SOCKET_NAME = 'uiInt';
