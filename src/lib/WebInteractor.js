// @flow

import { testCase } from '../../testCases/Demo_Case.web';

import { runClient, interactInfo, done, setInteractorInfo  } from './IpcClient';
import { waitRetry, debug, fail, hasValue, translateErrorObj, cast  } from './SysUtils';
import { toString  } from './StringUtils';
import type { Protocol } from './IpcProtocol';
import { INTERACT_SOCKET_NAME, clientEmit } from './IpcProtocol';
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
        clientEmit('ApState', apState);
      } catch (e) {
        let err = translateErrorObj(e);
        logException('Failed in Selenium Interaction', err);
        clientEmit('Exception', err);
      } finally {
        setInteractorInfo(null);
      }
    }
}

describe.only('runner', () => {

  it('interact', () => {
    runClient();
    waitRetry(() => done(), 90000000, () => uiInteraction());
  });

});
