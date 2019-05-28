import {chk, chkFalse } from '../lib/AssertionUtils';
import { isReloadableFile } from '../lib/SeleniumIpcServer';

describe('isReploadableFile', () => {

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
