import {describe} from 'mocha';
import {chk, chkEq, chkExceptionText, chkFalse, chkWithMessage} from '../lib/AssertionUtils';
import {hasText} from '../lib/StringUtils';
import { fromTestDataString } from '../lib/FileUtils';
import {waitRetry, 
      executeFileSynch,
      executeFileAsynch,
      executeRunTimeFileAsynch,
      executeRunTimeFileSynch, killTask, listProcesses,
      xmlToObj } from '../lib/SysUtils';
import * as _ from 'lodash';

describe('xmlToObj', () => {

  it('parse demo file', () => {

    let xml = fromTestDataString('books.xml'),
        obj = <any>xmlToObj(xml),
        recCount = (<any>obj).catalog.book.length;

     chkEq(12, recCount);
  });
});



// may need more work handle stdIn / out and error



describe('executeFileRunTimeFile', () => {

  it('non-existant', () => {
    chkExceptionText(() => executeRunTimeFileAsynch('Blahh'), 'does not exist');
  });

  it('exists', () => {
    executeRunTimeFileSynch('emptybat.bat');
  });

});

describe.skip('executeFile', () => {

  const TARGET_PATH = '"C:\\Program Files\\Notepad++\\notepad++.exe"';
  it('async', () => {
    executeFileAsynch(TARGET_PATH);
  });

  it('sync', () => {
    executeFileSynch(TARGET_PATH);
  });
});

describe('killTask', () => {

   it.skip('success firefox - firefox must be running', () => {
     let result = killTask((t) => hasText(t.imageName, 'firefox'));
     chk(result);
   });

  it('non existant process ', () => {
    chk(killTask((t) => hasText(t.imageName, 'dcfsjkfksdhfsdklfsdhfjkl')));
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
    //this.timeout(30000); - reinstate with try finallly if not working
    let actual = waitRetry(() => false, 1000, () => {}, 100);
    chkFalse(actual);
  });

});
