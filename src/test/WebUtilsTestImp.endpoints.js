// @flow

import {chk, chkEq, chkEqJson, chkFalse, chkExceptionText, chkWithMessage} from '../lib/AssertionUtils';
import { debug, waitRetry, cast } from '../lib/SysUtils';
import { toTemp, toTempString } from '../lib/FileUtils';
import { show } from '../lib/StringUtils';
import * as _ from 'lodash';
import { TEST_LOG_IN, setSmartBearLogIn, links } from '../lib/WebUtilsTestImp';
import { rerun } from '../lib/WebUtils';



describe('set', () => {

  it('simple set', () => {
    rerun(TEST_LOG_IN, setSmartBearLogIn);
  });

});

describe('links', () => {

  it.only('getAll', () => {
    debug(rerun(setSmartBearLogIn, links));
  });

});
