
import {it, describe} from 'mocha'
import { loadAll } from '../lib/TestRunner';
import {chk, chkEq, chkEqJson, chkFalse, chkExceptionText, chkWithMessage} from '../lib/AssertionUtils';


describe('filter', () => {

  it('simple', () => {
    loadAll();
  });

  it.only('simple 2', () => {
    chk(false);
  });
});
