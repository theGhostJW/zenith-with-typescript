// @flow

import {it, describe} from 'mocha';
import {chk, chkEq, chkEqJson, chkFalse, chkExceptionText, chkWithMessage} from '../lib/AssertionUtils';
import { isReloadableFile } from '../lib/SeleniumIpcServer';
import { debug } from '../lib/SysUtils';
import * as _ from 'lodash';

describe.only('isReploadableFile', () => {

  it('isReploadableFile - SeleniumIpcServer', () => {
    chkFalse(isReloadableFile('C:\\ZWTF\\src\\lib\\SeleniumIpcServer.js'));
  });

  it('isReploadableFile - node modules', () => {
    chkFalse(isReloadableFile('C:\\ZWTF\\node_modules\\core-js\\library\\modules\\_string-at.js'));
  });

  it('isReploadableFile - temp', () => {
    chkFalse(isReloadableFile('C:\\ZWTF\\temp\\aFile.js'));
  });

  it('WebUtils - should load', () => {
    chk(isReloadableFile('C:\\ZWTF\\src\\lib\\WebUtils.js'));
  });


});
