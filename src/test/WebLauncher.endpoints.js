// @flow

import {chk, chkEq, chkEqJson, chkFalse, chkExceptionText, chkWithMessage} from '../lib/AssertionUtils';
import { debug, waitRetry, cast, listProcesses, killTask } from '../lib/SysUtils';
import { toTemp, toTempString, runTimeFile } from '../lib/FileUtils';
import { show } from '../lib/StringUtils';
import * as _ from 'lodash';
import { geckoStatus, geckoRunning, startGeckoDriver, checkStartGeckoDriver, killGeckoDriver } from '../lib/WebLauncher';
import child_process from 'child_process';

describe('seleniumStatus', () => {

  it('show', () => {
    console.log(geckoStatus());
  });

});

describe('geckoRunning', () => {

  it('show', () => {
    let isRunning = geckoRunning();
    chk(isRunning);
    //chkFalse(isRunning);
  });

});

describe('startSelenium', () => {

  it('kill', () => {
    //toTemp(listProcesses(), "beforeProcesses.yaml");
    //toTemp(listProcesses(), "afterProcesses.yaml");
    killGeckoDriver();
  });

  it('run', () => {
    //toTemp(listProcesses(), "beforeProcesses.yaml");
    const started = startGeckoDriver();
    chk(started);
    //toTemp(listProcesses(), "afterProcesses.yaml");
    //killGeckoDriver();
  });

});

describe('checkStartSelenium', () => {
  it('startGecko True', () => {
    killGeckoDriver();
    startGeckoDriver();
  })

  it('startGecko', () => {
    //startGeckoDriver();
    killGeckoDriver();
   // const child = child_process.exec('C:\ZenithFlow\runTimeFileslaunchGeckoDriver.bat');
                                                  
    //debug("beforeunref");
    //child.unref();
  })

});
