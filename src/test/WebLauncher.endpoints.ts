import {chk} from '../lib/AssertionUtils';
import * as _ from 'lodash';
import { geckoStatus, geckoRunning, startGeckoDriver,  killGeckoDriver } from '../lib/WebLauncher';

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
