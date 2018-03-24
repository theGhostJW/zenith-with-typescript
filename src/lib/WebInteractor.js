// @flow




import { log, logError, logException } from './Logging';

import { done, emitMessage, invocationParams, setInvocationParams, startServer } from './SeleniumIpcServer';
import { cast, debug, fail, hasValue, translateErrorObj, waitRetry  } from './SysUtils';

import {zzzTestFunc} from './WebUtils';



function uiInteraction(): void {
    // exception handling / logging pending
    startServer();
    let params = invocationParams();
    if (params != null) {
      try {
        let response = zzzTestFunc(...cast(params));
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

describe('runner', () => {

  it('interact', () => {
    startServer();
    waitRetry(() => done(), 90000000, () => uiInteraction());
  });

});
