import {chk, chkEq, chkEqJson, chkFalse, chkExceptionText, chkWithMessage} from '../lib/AssertionUtils';
import { debug, waitRetry} from '../lib/SysUtils';
import { toTemp, toTempString } from '../lib/FileUtils';
import { show } from '../lib/StringUtils';
import * as _ from 'lodash';
import { browserEx, zzzTestFunc, wdDebug, lsTestFunc} from '../lib/WebUtils';

const TEST_LOG_IN = 'http://secure.smartbearsoftware.com/samples/TestComplete12/WebOrders/Login.aspx';

describe('browserEx', () => {

  it('simple', function blahhh(){
    chkEq(55, browserEx(zzzTestFunc));
  });

});

describe('wdDebug', () => {

  it('close', () => {
    wdDebug();
  });

  it.only('wdDebug', () => {
    const pageTitle = wdDebug('https://www.google.com.au/', zzzTestFunc);
    chkEq('Google', pageTitle);
    console.log("DONE !!!!");
  });

});
