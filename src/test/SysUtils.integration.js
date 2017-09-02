// @flow

import {it, describe } from 'mocha'
import { listProcesses, waitRetry, killTask, executeFile, executeRunTimeFile } from '../lib/SysUtils';
import { toTempString } from '../lib/FileUtils';
import {toString, hasText} from '../lib/StringUtils';
import {chk, chkEq, chkFalse, chkExceptionText, chkWithMessage} from '../lib/AssertionUtils';
import * as _ from 'lodash';
import { PROCESS_LIST } from '../test/SysUtils.data.test';
import { log } from '../lib/Logging';
import type { TaskListItem } from '../lib/SysUtils';


describe.only('executeFileRunTimeFile', () => {

  it('non-existant', () => {
    chkExceptionText(() => executeRunTimeFile('Blahh'), 'does not exist');
  });

  it('exists', () => {
    executeRunTimeFile('emptybat.bat');
  });

});

describe.skip('executeFile', () => {

  const TARGET_PATH = '"C:\\Program Files\\Notepad++\\notepad++.exe"';
  it('async', () => {
    executeFile(TARGET_PATH);
  });

  it('sync', () => {
    executeFile(TARGET_PATH, false);
  });
});

describe.skip('killTask', () => {

  // it('success firefox - firefox must be running', () => {
  //   let result = killTask((t) => hasText(t.imageName, 'firefox'));
  //   chk(result);
  // });

  it('failure non existant process ', () => {
    let result = killTask((t) => hasText(t.imageName, 'dcfsjkfksdhfsdklfsdhfjkl'));
    chkFalse(result);
  });


});

describe('listProcesses', function() {

  this.timeout(5000);

  it('simple', () => {
   let actual = listProcesses();
   chk(actual.length > 20);
 });

});

describe('waitRetry', () => {

  it('failure 2 secs 1 sec retry', function() {
    this.timeout(30000);
    let actual = waitRetry(() => false, 2000, () => {}, 1000);
    chkFalse(actual);
  });

});
