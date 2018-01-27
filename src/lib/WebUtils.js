// @flow

import request from 'sync-request';
import { trimChars, hasText } from './StringUtils';
import { debug, def, cast, seekInObj, translateErrorObj, executeRunTimeFile, waitRetry, ensure } from './SysUtils';
import { runTimeFile } from './FileUtils';
import * as _ from 'lodash';

export const SELENIUM_BASE_URL = 'http://localhost:4444/';
export const SELENIUM_BAT_NAME = 'selenium-server-standalone-3.8.1.jar';


export function checkStartSelenium() {
  let running = seleniumRunning();
  if (!running){
    startSelenium();
    let started = waitRetry(seleniumRunning, 60000, () => {}, 1000);
    ensure(started, 'checkStartSelenium - selenium stand alone server did not start');
  }
}

export function startSelenium() {
  executeRunTimeFile('startSelenium.bat', false);
}

function seleniumSubUrl(subPath: string) {
  return SELENIUM_BASE_URL + trimChars(subPath, ['/']);
}

export function seleniumStatus(): {} {

  let response;
  try {
    response = request('GET', seleniumSubUrl('/wd/hub/status'));
  } catch (e) {
    response = translateErrorObj(e);
    response.ready = false;
  }

  if (_.isObject(response) && response.body != null){
    return JSON.parse(response.body.toString('UTF-8'));
  }
  else {
    return def(response, {});
  }
}

export function seleniumRunning(): boolean {
  let status = seleniumStatus();
  return def(seekInObj(status, 'ready'), false);
}
