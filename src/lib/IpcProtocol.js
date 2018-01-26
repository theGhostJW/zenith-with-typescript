// @flow

export type Protocol = 'Ready' |
                          'ApState' |
                          'ClientDone' |
                          'Iteration' |
                          'EndOfItems' |
                          // ipc-native
                          'disconnect' |
                          'connect';
