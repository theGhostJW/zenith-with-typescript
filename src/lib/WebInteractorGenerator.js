// @flow

import { relativePath, stringToFile, parentDir  } from './FileUtils';
import { newLine, replaceAll, trimLines} from './StringUtils';
import { debug, isFrameworkProject } from './SysUtils';
import * as _ from 'lodash';



export function generateAndDumpTestFile(beforeFuncName: string | null, functionName: string, sourcePath: string, destPath: string, dynamicModuleLoad: boolean) {
  stringToFile(fileContent(beforeFuncName, functionName, sourcePath, destPath, dynamicModuleLoad), destPath);
}

function fileContent(beforeFuncName: string | null, functionName: string, sourcePath: string, destPath: string, dynamicModuleLoad: boolean): string {
  let fw = isFrameworkProject(),
      destParentDir = parentDir(destPath),
      importFilePath = dynamicModuleLoad ? replaceAll(sourcePath, '\\', '\\\\') : replaceAll(relativePath(destParentDir, sourcePath), '\\', '/');

  return targetRequires(beforeFuncName, functionName, sourcePath, destPath, dynamicModuleLoad) + newLine() +
          (fw ? FRAMEWORK_USES : ZWTF_USES ) + newLine() +
          NPM_USES + newLine() +
          sourceCode(beforeFuncName, functionName, importFilePath, dynamicModuleLoad);
}

function targetRequires(beforeFuncName: string | null, functionName: string, sourcePath: string, targetPath: string, dynamicModuleLoad: boolean) : string {
  let result = `// @flow \n\n`,
      funcs = _.compact([beforeFuncName, (dynamicModuleLoad ? null : functionName)]),
      hasFuncs = funcs.length > 0 ,
      importFuncs = hasFuncs ? funcs.join(', ') : '';

    return hasFuncs ? result + `import { ${importFuncs} } from '${targetPath}';` : result;
}

const FRAMEWORK_USES = trimLines(`
  import { startServer, invocationParams, done, setInvocationParams, emitMessage } from '../src/lib/SeleniumIpcServer';
  import { waitRetry, debug, fail, hasValue, translateErrorObj, cast  } from '../src/lib/SysUtils';
  import { toString  } from '../src/lib/StringUtils';
  import { INTERACT_SOCKET_NAME } from '../src/lib/SeleniumIpcProtocol';
  import { log, logError, logException } from '../src/lib/Logging';
  import type { Protocol } from '../src/lib/SeleniumIpcProtocol';
`);

const ZWTF_USES = trimLines(`
  import {
          startServer, invocationParams, done, setInvocationParams, emitMessage,
          waitRetry, debug, fail, hasValue, translateErrorObj, cast,
          toString,
          INTERACT_SOCKET_NAME,
          log, logError, logException
   } from 'ZWFT';
  import type { Protocol } from 'ZWFT';
`);

const NPM_USES = trimLines(`
  import * as wd from 'webdriverio';
  import * as ipc from 'node-ipc';
  import * as _ from 'lodash';
`);

const sourceCode = (beforeFuncName: string | null, functionName: string, modulePath: string, dynamicModuleLoad: boolean) =>  {
  let responseBlock = dynamicModuleLoad ?
                                          trimLines(
                                            `// Delete cache entry to make sure the file is re-read from disk.
                                            delete require.cache['${modulePath}'];
                                            // Load function from file.
                                            let modd = require('${modulePath}');

                                            let response = modd.${functionName}(...cast(params));`
                                          )
                                        : `let response = ${functionName}(...cast(params));`



return   `
  function uiInteraction(): void {
      // exception handling / logging pending
      let params = invocationParams();
      startServer();
      if (params != null) {
        try {
          ${responseBlock}
          emitMessage('InvocationResponse', response);
        } catch (e) {
          let err = translateErrorObj(e);
          logException('Failed in Selenium Interaction', err);
          emitMessage('Exception', err);
        } finally {
          setInvocationParams(null);
        }
      }
  }

  describe.only('runner', () => {

    it('interact', () => {
      startServer();
      ${beforeFuncName != null ? beforeFuncName + '();' : ''}
      waitRetry(() => done(), 90000000, () => uiInteraction());
    });

  });

  `


}
