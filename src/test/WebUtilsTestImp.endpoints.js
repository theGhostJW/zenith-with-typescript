// @flow

import {chk, chkEq, chkEqJson, chkFalse, chkExceptionText, chkWithMessage} from '../lib/AssertionUtils';
import { debug, waitRetry, cast } from '../lib/SysUtils';
import { toTemp, toTempString } from '../lib/FileUtils';
import { toString } from '../lib/StringUtils';
import * as _ from 'lodash';
import { TEST_LOG_IN, setSmartBearLogIn } from '../lib/WebUtilsTestImp';
import { rerun } from '../lib/WebUtils';



describe('set', () => {

  it.only('simple set', () => {
    rerun(TEST_LOG_IN, setSmartBearLogIn);
  });

});
