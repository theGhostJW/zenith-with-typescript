// @flow

import { testCase } from '../../testCases/Demo_Case.web';

import { startServer, interactInfo, done, setInteractorInfo, emitMessage } from './SeleniumIpcServer';
import { waitRetry, debug, fail, hasValue, translateErrorObj, cast  } from './SysUtils';
import { toString  } from './StringUtils';
import type { Protocol } from './SeleniumIpcProtocol';
import { INTERACT_SOCKET_NAME } from './SeleniumIpcProtocol';
import { log, logError, logException } from './Logging';

import * as wd from 'webdriverio';
import * as ipc from 'node-ipc';
import * as _ from 'lodash';

function uiInteraction(): void {
    // exception handling / logging pending
    let intInfo = interactInfo();
    if (intInfo != null) {
      try {
        let apState = testCase.interactor(cast(intInfo).item, cast(intInfo).runConfig);
        setInteractorInfo(null);
        debug(apState, 'Apstate Before')
        emitMessage('ApState', apState);
        debug(apState, 'Apstate After Emit')
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
