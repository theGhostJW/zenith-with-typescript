// @flow

import {chk, chkEq, chkEqJson, chkFalse, chkExceptionText, chkWithMessage} from '../lib/AssertionUtils';
import { debug, waitRetry, cast } from '../lib/SysUtils';
import { toTemp, toTempString } from '../lib/FileUtils';
import { toString } from '../lib/StringUtils';
import * as _ from 'lodash';
import { browserEx, zzzTestFunc, launchSession, rerunLoaded } from '../lib/WebUtils';

describe('browserEx', () => {

  it('simple', function blahhh(){
    chkEq(55, browserEx(zzzTestFunc));
  });

});

/*
TODO: rerunner
   * dynamic loading
   * test with webio
   * combine to one function (rerunner)
 */
describe('launchSession', () => {

  it('launchSession', () => {
    launchSession(null, zzzTestFunc);
  });

});

describe('rerunClient', () => {

  it.only('rerunLoaded', () => {
    chkEq(55, debug(rerunLoaded()))
  });

});
