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
  import { startServer, interactInfo, done, setInteractorInfo, emitMessage } from './SeleniumIpcServer';
  import { waitRetry, debug, fail, hasValue, translateErrorObj, cast  } from './SysUtils';
  import { toString  } from './StringUtils';
  import type { Protocol } from './SeleniumIpcProtocol';
  import { INTERACT_SOCKET_NAME } from './SeleniumIpcProtocol';
  import { log, logError, logException } from './Logging';
`);

const ZWTF_USES = trimLines(`
  import {
          startServer, interactInfo, done, setInteractorInfo, emitMessage,
          waitRetry, debug, fail, hasValue, translateErrorObj, cast,
          toString, INTERACT_SOCKET_NAME, log, logError, logException
   } from 'ZWFT';
  import type { Protocol } from 'ZWFT';
`);

const NPM_USES = trimLines(`
  import * as wd from 'webdriverio';
  import * as ipc from 'node-ipc';
  import * as _ from 'lodash';
`);
const SOURCE_CODE = `
function uiInteraction(): void {
    // exception handling / logging pending
    let intInfo = interactInfo();
    if (intInfo != null) {
      try {
        let apState = testCase.interactor(cast(intInfo).item, cast(intInfo).runConfig);
        setInteractorInfo(null);
        emitMessage('ApState', apState);
      } catch (e) {
        let err = translateErrorObj(e);
        logException('Failed in Selenium Interaction', err);
        emitMessage('Exception', err);
      } finally {
        setInteractorInfo(null);
      }
    }
}

describe.only('runner', () => {

  it('interact', () => {
    startServer();
    waitRetry(() => done(), 90000000, () => uiInteraction());
  });

});

`
