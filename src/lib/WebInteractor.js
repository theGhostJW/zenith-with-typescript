// @flow

import { testCase } from '../../testCases/Demo_Case.web';
//import type { Item, ApState } from '../../testCases/Demo_Case'; // delete these later
//import type { RunConfig } from '../../testCases/ProjectConfig'; // delete these later

import { waitRetry, debug, fail, hasValue, translateErrorObj  } from './SysUtils';
import { toString  } from './StringUtils';
import * as wd from 'webdriverio';
import * as ipc from 'node-ipc';
import type { Protocol } from './IpcProtocol';
import { INTERACT_SOCKET_NAME, clientEmit } from './IpcProtocol';
import { log, logError, logException } from './Logging';
import * as _ from 'lodash';

let title,
    done = false,
    interactInfo = null;

const emit = clientEmit;

function uiInteraction(): void {
    // exception handling / logging pending
    if (interactInfo != null) {
      try {
        let apState = testCase.interactor(interactInfo.item, interactInfo.runConfig);
        interactInfo = null;
        emit('ApState', apState);
      } catch (e) {
        let err = translateErrorObj(e);
        logException('Failed in Selenium Interaction', err);
        emit('Exception', err);
      } finally {
        interactInfo = null;
      }
    }
}

describe.only('runner', () => {

  it('interact', () => {
    runClient();
    waitRetry(() => done, 90000000, () => uiInteraction());
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
