// @flow

import { debug, waitRetry, cast } from '../lib/SysUtils';
import { toTemp, toTempString } from '../lib/FileUtils';
import { show } from '../lib/StringUtils';
import * as _ from 'lodash';
import { browserEx, zzzTestFunc, rerun, set, click, links } from '../lib/WebUtils';
export {
  links 
} from '../lib/WebUtils';

export const TEST_LOG_IN = 'http://secure.smartbearsoftware.com/samples/TestComplete12/WebOrders/Login.aspx';

export function setSmartBearLogIn() {
  set('#ctl00_MainContent_username', 'Tester');
  set('#ctl00_MainContent_password', 'test');
  click('#ctl00_MainContent_login_button');
}
