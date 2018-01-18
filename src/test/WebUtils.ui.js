// @flow

import {chk, chkEq, chkEqJson, chkFalse, chkExceptionText, chkWithMessage} from '../lib/AssertionUtils';
import { debug } from '../lib/SysUtils';
import { toString } from '../lib/StringUtils';
import { toTemp, toTempString } from '../lib/FileUtils';
import * as _ from 'lodash';
import * as wd from 'webdriverio';

var title;

function runIt() {
    browser.url('http://webdriver.io');
    title = browser.getTitle();
    console.log(title + ' - PID:' + toString(process.pid));
  //  process.stdout.write('Hi there', 'utf8')
  //  title.notThere = 1;
}

describe.only('test cafe play', () => {

  it('interact', () => {
    runIt();
    chkEq('WebdriverIO - WebDriver bindings for Node.js', title);
  });

});
