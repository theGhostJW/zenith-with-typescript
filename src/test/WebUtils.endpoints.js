// @flow

import {chk, chkEq, chkEqJson, chkFalse, chkExceptionText, chkWithMessage} from '../lib/AssertionUtils';
import { debug, waitRetry, cast } from '../lib/SysUtils';
import { toTemp, toTempString } from '../lib/FileUtils';
import { toString } from '../lib/StringUtils';
import * as _ from 'lodash';
import { seleniumStatus, seleniumRunning, startSelenium, checkStartSelenium, webUtilsTestLoad } from '../lib/WebUtils';


describe('webUtilsTestLoad', () => {

  it.only('simple', () => {
    webUtilsTestLoad();
  });

});

describe('seleniumStatus', () => {

  it('show', () => {
    debug(seleniumStatus());
  });

});

describe('seleniumRunning', () => {

  it('show', () => {
    let isRunning = seleniumRunning();
    chk(isRunning);
    //chkFalse(isRunning);
  });

});


describe('startSelenium', () => {

  it('run', () => {
    startSelenium()
  });

});

describe('checkStartSelenium', () => {

  it('run', () => {
    checkStartSelenium();
  });

});
