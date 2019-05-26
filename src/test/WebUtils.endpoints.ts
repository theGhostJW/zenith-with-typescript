import {chk, chkEq, chkEqJson, chkFalse, chkExceptionText, chkWithMessage} from '../lib/AssertionUtils';
import { debug, waitRetry} from '../lib/SysUtils';
import { toTemp, toTempString } from '../lib/FileUtils';
import { show } from '../lib/StringUtils';
import * as _ from 'lodash';
import { browserEx, zzzTestFunc, rerun, set} from '../lib/WebUtils';

const TEST_LOG_IN = 'http://secure.smartbearsoftware.com/samples/TestComplete12/WebOrders/Login.aspx';

describe('browserEx', () => {

  it('simple', function blahhh(){
    chkEq(55, browserEx(zzzTestFunc));
  });

});

describe('rerun', () => {

  it('close', () => {
    rerun();
  });

  it('run', () => {
    chkEq('Google', rerun('https://www.google.com.au/', zzzTestFunc))
  });

});
