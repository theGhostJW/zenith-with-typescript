// @flow

import { testCase } from '../../testCases/Demo_Case.web';
//import type { Item, ApState } from '../../testCases/Demo_Case'; // delete these later
//import type { RunConfig } from '../../testCases/ProjectConfig'; // delete these later

import { waitRetry, debug, fail  } from './SysUtils';
import { toString  } from './StringUtils';
import * as wd from 'webdriverio';
import * as ipc from 'node-ipc';
import type { Protocol } from './IpcProtocol';
import { INTERACT_SOCKET_NAME, clientEmit } from './IpcProtocol';

let title,
    connected = false,
    done = false,
    interactInfo = null;

const emit = clientEmit;

let waitNo = 0;
function uiInteraction(): void {
    // exception handling / logging pending
    if (interactInfo == null) {
      if (waitNo > 20){
        fail('uiInteraction ~ NO interaction info recieved');
      }
      debug(`uiInteraction ~ waiting for item info ${waitNo++} ~ PID: ${toString(process.pid)}`);
    }
    else {
      waitNo = 0;
      debug(interactInfo, 'UI Interaction !!!!!!!!!!!!!');
      emit('Log', {msg: 'UI Interaction Logged'});
      let apState = testCase.interactor(interactInfo.item, interactInfo.runConfig);
      interactInfo = null;
      emit('ApState', apState);
    }
}

describe.only('runner', () => {

  it('interact', () => {
    runClient();
    debug('Run client finished');
    waitRetry(() => done, 6000000, () => uiInteraction(), 1000);
    debug('========= it complete =============');
  });

  function runClient() {
    ipc.config.id = 'uiTest';
    ipc.config.retry = 1000;
    ipc.config.sync = false;

    function when(msg: Protocol, action: (data: any) => void) {
      ipc.of[INTERACT_SOCKET_NAME].on(msg, action);
    }

    ipc.connectTo(
        INTERACT_SOCKET_NAME,
        function(){

           when('connect', () => {
                    console.log('!!!!! CLIENT CONNECTED !!!!!');
                    ipc.log('## started ##', ipc.config.delay);
                    connected = true;

                    //queue up a bunch of requests to be sent synchronously
                    emit('Ready');
                });

            when(
                'disconnect',
                  () => {
                    console.log('!!!!! CLIENT DISCONNECTED !!!!!');
                    console.log('DONE');
                    ipc.disconnect('uiInt');
                    ipc.log('client disconnected');
                    done = true;
                }
            );

            when(
                'Iteration',
                (data) => {
                    console.log(data, '!!!!! Next Iteration!!!!!');
                    interactInfo = data;
                }
            );

            when(
                'EndOfItems',
                () => {
                  emit('ClientDone');
                  done = true;
                  ipc.of.uiInt.stop();
                }
            );
        }
    );

  }

});
