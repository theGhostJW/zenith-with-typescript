// @flow

import { debug, waitRetry, cast } from '../lib/SysUtils';
import { toTemp, toTempString } from '../lib/FileUtils';
import { show } from '../lib/StringUtils';
import { log } from '../lib/Logging';
import * as _ from 'lodash';
import { browserEx, zzzTestFunc, rerun, set, click, links, url, linkByText } from '../lib/WebUtils';
export {
  links,
  url,
  clickLink
} from '../lib/WebUtils';

export const TEST_LOG_IN = 'http://secure.smartbearsoftware.com/samples/TestComplete12/WebOrders/Login.aspx';

export function setSmartBearLogIn() {
  url(TEST_LOG_IN);
  set('#ctl00_MainContent_username', 'Tester');
  set('#ctl00_MainContent_password', 'test');
  click('#ctl00_MainContent_login_button');
}

export function linkByTextText() {
  log(show(linkByText('*orders*')))
  return linkByText('*order*').getText();
}
