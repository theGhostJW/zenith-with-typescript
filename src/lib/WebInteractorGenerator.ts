import { relativePath, stringToFile, parentDir, fileOrFolderNameNoExt, changeExtension  } from './FileUtils';
import { newLine, replaceAll, trimLines} from './StringUtils';
import { isFrameworkProject } from './SysUtils';
const _ = require('lodash');

export type BeforeRunInfo = {
  isUrl: boolean,
  name: string
}

export function generateAndDumpTestFile(beforeInfo: BeforeRunInfo | null, functionName: string, sourcePath: string, destPath: string, dynamicModuleLoad: boolean) {
  stringToFile(fileContent(beforeInfo, functionName, sourcePath, destPath, dynamicModuleLoad), destPath);
}

function fileContent(beforeInfo: BeforeRunInfo | null, functionName: string, sourcePath: string, destPath: string, dynamicModuleLoad: boolean): string {
  const fw = isFrameworkProject(),
        destParentDir = parentDir(destPath),
        importFilePath = replaceAll(sourcePath, '\\', '\\\\'),
        fullRel = changeExtension(relativePath(destParentDir, sourcePath), ''),
        relativeImportFile = replaceAll(fullRel, '\\', '/');

  return targetRequires(beforeInfo, functionName, sourcePath, relativeImportFile, dynamicModuleLoad) + 
          (fw ? FRAMEWORK_USES : ZWTF_USES ) + newLine() +
          NPM_USES + newLine() +
          sourceCode(beforeInfo, functionName, importFilePath, dynamicModuleLoad);
}

function targetRequires(beforeInfo: BeforeRunInfo | null, functionName: string, sourcePath: string, relativeImportFile: string, dynamicModuleLoad: boolean) : string {
  let beforeFuncName = beforeInfo == null ? null :
                                      beforeInfo.isUrl ? null : beforeInfo.name,
      funcs = _.compact([beforeFuncName, (dynamicModuleLoad ? null : functionName)]),
      hasFuncs = funcs.length > 0 ,
      importFuncs = hasFuncs ? funcs.join(', ') : '';

    return hasFuncs ? `import { ${importFuncs} } from '${relativeImportFile}';` + newLine(): '';
}

const FRAMEWORK_USES = trimLines(`
  import { startServer, stopServer, invocationParams, done, setInvocationParams, emitMessage, isReloadableFile } from '../src/lib/SeleniumIpcServer';
  import { waitRetry, debug, fail, hasValue, translateErrorObj, ensure } from '../src/lib/SysUtils';
  import { show, hasText  } from '../src/lib/StringUtils';
  import { toTempString  } from '../src/lib/FileUtils';
  import { INTERACT_SOCKET_NAME, Protocol } from '../src/lib/SeleniumIpcProtocol';
  import { log, logError, logException } from '../src/lib/Logging';
`);

const ZWTF_USES = trimLines(`
  import {
          startServer, stopServer, invocationParams, done, setInvocationParams, emitMessage,
          waitRetry, debug, fail, hasValue, translateErrorObj, cast,
          show, isReloadableFile
          INTERACT_SOCKET_NAME, Protocol,
          log, logError, logException
   } from 'ZWFT';
`);

const NPM_USES = trimLines(`
  import 'webdriverio';
  const ipc = require('node-ipc');
  const _ = require('lodash');
`);

const sourceCode = (beforeInfo: BeforeRunInfo | null, functionName: string, modulePath: string, dynamicModuleLoad: boolean) =>  {
  let responseBlock = dynamicModuleLoad ?
                                          trimLines(
                                            `// Delete cache entry to make sure the file is re-read from disk.


                                            function renewCache(path: string) {
                                              delete require.cache[path];
                                              return require(path)
                                            }

                                            _.values(require.cache)
                                                      .filter((i: any) => isReloadableFile(i.filename))
                                                      .map((m: any) => m.filename)
                                                      .forEach(renewCache);


                                            let modd = renewCache('${modulePath}'),
                                                func = modd.${functionName};

                                             ensure(func != null, 'Web interactor error: Could not invoke ${functionName}.\\n' +
                                                                   'This is usually because the function has not been exported from the target module.\\n' +
                                                                   'Check the "${functionName}" function is exported from the module: "${modulePath}".');
                                             let response = func.apply(null, params);`
                                          )
                                        : `let response = ${functionName}.apply(null, params);`,
      initCall = beforeInfo == null ? '' :
                  beforeInfo.isUrl ? `browser.url('${beforeInfo.name}');`
                                   : `${beforeInfo.name}();`


// this is so this does not give us false positives
// when searchi for .only
const O_N_L_Y = 'o' + 'nly';
return   `

  let beforeRun = false;

  function uiInteraction(): void {
      let params = invocationParams();

      //dynamically generated code for initial function call or url address
      if (params != null) {
        try {
          if (!beforeRun){
            ${initCall};
            beforeRun = true;
          }

          ${responseBlock}

          emitMessage('InvocationResponse', response);
        } catch (e) {
          let err = translateErrorObj(e, 'Failed in WebDriver Interaction');
          logException('Failed in WebDriver Interaction', err);
          emitMessage('Exception', err);
        } finally {
          setInvocationParams(null);
        }
      }
  }

  describe.${O_N_L_Y}('runner', () => {

    it('interact', () => {
      startServer();
      //used in ddebugging toTempString('${process.pid}', 'Started');
      waitRetry(() => done(), 90000000, () => uiInteraction());
      stopServer();
    });

  });

  `


}
