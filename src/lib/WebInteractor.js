// @flow

import { testCase } from '../../testCases/Demo_Case';
//import type { Item, ApState } from '../../testCases/Demo_Case'; // delete these later
//import type { RunConfig } from '../../testCases/ProjectConfig'; // delete these later

import { waitRetry, debug, fail  } from './SysUtils';
import { toString  } from './StringUtils';
import * as wd from 'webdriverio';
import * as ipc from 'node-ipc';

let title,
    connected = false,
    done = false,
    interactInfo, // {item: Item, runConfig: RunConfig},
    apState; //: ?ApState


let waitNo = 0;
function uiInteraction(): void {
    // exception handling / logging pending
    if (interactInfo == null) {
      if (waitNo > 60){
        fail('uiInteraction ~ NO interaction info recieved');
      }
      debug(`uiInteraction ~ waiting for item info ${waitNo++} ~ PID: ${toString(process.pid)}`);
    }
    else {
      waitNo = 0;
      debug(interactInfo, 'UI Interaction !!!!!!!!!!!!!');
      apState = testCase.interactor(interactInfo.item, interactInfo.runConfig);
      ipc.of.uiInt.emit(
        'apState',
        {
            id      : ipc.config.id,
            message : apState
          }
      );
    }
}

describe.only('runner', () => {

  it('interact', () => {
    runClient();
    debug('Run client finished');
    waitRetry(() => done, 6000000, () => {uiInteraction(); apState = null;}, 1000);
  });

  function runClient() {
    ipc.config.id = 'uiTest';
    ipc.config.retry = 1000;
    ipc.config.sync = true;

    ipc.connectTo(
        'uiInt',
        function(){
            ipc.of.uiInt.on(
                'connect',
                function(){
                    console.log('!!!!! CLIENT CONNECTED !!!!!');
                    ipc.log('## started ##', ipc.config.delay);
                    connected = true;

                    //queue up a bunch of requests to be sent synchronously
                    ipc.of.uiInt.emit('ready');
                }
            );

            ipc.of.uiInt.on(
                'disconnect',
                function(){
                    console.log('!!!!! CLIENT DISCONNECTED !!!!!');
                    console.log('DONE');
                    ipc.log('client disconnected');
                    done = true;
                }
            );

            ipc.of.uiInt.on(
                'iteration',
                function(data){
                    console.log('!!!!! Next Iteration!!!!!');
                    interactInfo = data.message;
                }
            ),

            ipc.of.uiInt.on(
                'serverDone',
                () => {
                  ipc.of.uiInt.emit('ClientDone');
                  done = true;
                }
            ),

            console.log(ipc.of.uiInt.destroy);
        }
    );

  }

});
