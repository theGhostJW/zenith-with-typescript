// @flow

import {chk, chkEq, chkEqJson, chkFalse, chkExceptionText, chkWithMessage} from '../lib/AssertionUtils';
import { debug, waitRetry, cast, listProcesses, killTask } from '../lib/SysUtils';
import { toTemp, toTempString } from '../lib/FileUtils';
import { show } from '../lib/StringUtils';
import * as _ from 'lodash';
import { seleniumStatus, seleniumRunning, startGeckoDriver, checkStartGeckoDriver, killGeckoDriver } from '../lib/WebLauncher';

describe('seleniumStatus', () => {

  it('show', () => {
    console.log(seleniumStatus());
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
    //toTemp(listProcesses(), "beforeProcesses.yaml");
    const started = startGeckoDriver();
    chk(started);
    //toTemp(listProcesses(), "afterProcesses.yaml");
    killGeckoDriver();
  });

});

describe('checkStartSelenium', () => {

  it.only('run', () => {
    checkStartGeckoDriver();
    checkStartGeckoDriver();
    checkStartGeckoDriver();
    checkStartGeckoDriver();
  });

});
