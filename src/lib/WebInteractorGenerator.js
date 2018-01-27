// @flow

import { stringToFile } from './FileUtils';
import { debug, isFrameworkProject } from './SysUtils';
import { trimLines, newLine } from './StringUtils';

export function dumpTestFile(testName: string, destpath: string) {
  stringToFile(fileContent(testName), destpath);
}

function fileContent(testName: string): string {
  let fw = isFrameworkProject();
  return targetRequires(testName) + newLine() +
          (fw ? FRAMEWORK_USES : ZWTF_USES ) + newLine() +
          NPM_USES + newLine() +
          SOURCE_CODE;
}

function targetRequires(testName: string) : string {
  return trimLines(`// @flow

    import { testCase } from '../testCases/${testName}';`)
}

const FRAMEWORK_USES = trimLines(`
  import { waitRetry, debug, fail, hasValue, translateErrorObj  } from '../src/lib/SysUtils';
  import { toString  } from '../src/lib/StringUtils';
  import type { Protocol } from '../src/lib/IpcProtocol';
  import { INTERACT_SOCKET_NAME, clientEmit } from '../src/lib/IpcProtocol';
  import { log, logError, logException } from '../src/lib/Logging';
`);

const ZWTF_USES = trimLines(`
  import { waitRetry, debug, fail, hasValue, translateErrorObj, toString, INTERACT_SOCKET_NAME,
          clientEmit, log, logError, logException
   } from 'ZWFT';
  import type { Protocol } from 'ZWFT';
`);

const NPM_USES = trimLines(`
  import * as wd from 'webdriverio';
  import * as ipc from 'node-ipc';
  import * as _ from 'lodash';
`);


const SOURCE_CODE = `

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
                }
            );
        }
    );

  }

});
`
