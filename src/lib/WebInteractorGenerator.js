// @flow

import { relativePath, stringToFile, parentDir  } from './FileUtils';
import { newLine, replaceAll, trimLines} from './StringUtils';
import { debug, isFrameworkProject } from './SysUtils';



export function generateAndDumpTestFile(sourcePath: string, destPath: string) {
  stringToFile(fileContent(sourcePath, destPath), destPath);
}

function fileContent(sourcePath: string, destPath: string): string {
  let fw = isFrameworkProject();
  return targetRequires(sourcePath, destPath) + newLine() +
          (fw ? FRAMEWORK_USES : ZWTF_USES ) + newLine() +
          NPM_USES + newLine() +
          SOURCE_CODE;
}

function targetRequires(sourcePath: string, destPath: string) : string {
  let destParentDir = parentDir(destPath),
      targetPath = debug(replaceAll(relativePath(destParentDir, sourcePath), '\\', '/'));

  return trimLines(`// @flow

    import { testCase } from '${targetPath}';`)
}

const FRAMEWORK_USES = trimLines(`
  import { startServer, interactInfo, done, setInteractorInfo, emitMessage } from '../src/lib/SeleniumIpcServer';
  import { waitRetry, debug, fail, hasValue, translateErrorObj, cast  } from '../src/lib/SysUtils';
  import { toString  } from '../src/lib/StringUtils';
  import type { Protocol } from '../src/lib/SeleniumIpcProtocol';
  import { INTERACT_SOCKET_NAME } from '../src/lib/SeleniumIpcProtocol';
  import { log, logError, logException } from '../src/lib/Logging';
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
