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

describe('launchSession rerunClient', () => {

  it('launchSession', () => {
    launchSession(null, zzzTestFunc);
  });

});

describe('rerunClient', () => {

  it.only('rerunLoaded', () => {
    rerunLoaded()
  });

});
