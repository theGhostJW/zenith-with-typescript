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
import { log, logError } from './Logging';

let title,
    done = false,
    interactInfo = null;

const emit = clientEmit;

let waitNo = 0;
function uiInteraction(): void {
    // exception handling / logging pending
    if (interactInfo != null) {
      waitNo = 0;

      let apState = testCase.interactor(interactInfo.item, interactInfo.runConfig);

      interactInfo = null;
      emit('ApState', apState);
    }
}

describe.only('runner', () => {

  it('interact', () => {
    runClient();
    waitRetry(() => done, 6000000, () => uiInteraction(), 1000);
  });

  function runClient() {
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
                    //queue up a bunch of requests to be sent synchronously
                    emit('Ready');
                });

            when(
                'disconnect',
                  () => {
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
