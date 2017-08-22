import {fail, objToYaml, debug, def, ensureHasVal, hasValue} from '../lib/SysUtils';
import {chk, chkEq, chkEqJson, chkFalse} from '../lib/AssertionUtils';
import * as _ from 'lodash';
import { check } from '../lib/CheckUtils';

describe('check', () => {

  it('check - pass', () => {
    chk(check(true, 'should pass', 'more info about the pass'));
  });
  

  it('check - fail', () => {

  });

});
