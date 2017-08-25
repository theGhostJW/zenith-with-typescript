import {it, describe} from 'mocha'
import {fail, objToYaml, debug, def, ensureHasVal, hasValue} from '../lib/SysUtils';
import {chk, chkEq, chkEqJson, chkFalse} from '../lib/AssertionUtils';
import * as _ from 'lodash';
import { check, checkText } from '../lib/CheckUtils';

describe('check', () => {

  it('check - pass', () => {
    chk(check(true, 'should pass', 'more info about the pass'));
  });

  it('check - fail', () => {
    chkFalse(check(false, 'should fail', 'more info about the fail'));
  });

});

describe.only('checkText', () => {

  it('checkText', () => {
    chk(checkText('sample text', 'sample text', 'test the same', 'same info'));
  });

  it('checkText - no additional info', () => {
    chk(checkText('sample text', 'sample text', 'test the same'));
  });

});
