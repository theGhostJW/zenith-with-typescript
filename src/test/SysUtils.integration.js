// @flow

import {test, describe} from 'mocha';
import {datePlus, now, today} from '../lib/DateTimeUtils';
import {chk, chkEq, chkExceptionText, chkFalse, chkWithMessage} from '../lib/AssertionUtils';
import {createGuidTruncated, hasText} from '../lib/StringUtils';
import { fromTestDataString } from '../lib/FileUtils';
import {cast, waitRetry, debug, executeFile,
      executeRunTimeFile, killTask, listProcesses,
      xmlToObj } from '../lib/SysUtils';
import * as _ from 'lodash';

describe('xmlToObj', () => {

  it('parse demo file', () => {

    let xml = fromTestDataString('books.xml'),
        obj = cast(xmlToObj(xml));

        debug(obj)
        let recCount = obj.catalog.book.length;

     chkEq(12, recCount);
  });
});


describe('executeFileRunTimeFile', () => {

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
