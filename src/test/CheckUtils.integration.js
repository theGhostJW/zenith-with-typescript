// @flow

import {it, describe} from 'mocha'
import {fail, objToYaml, debug, def, ensureHasVal, hasValue} from '../lib/SysUtils';
import {chk, chkEq, chkEqJson, chkFalse} from '../lib/AssertionUtils';
import * as _ from 'lodash';
import { checkText } from '../lib/CheckUtils';


describe('checkText', () => {

  it('failure', () => {
    chkFalse(checkText('test1', 'text2', 'should fail'));
  });


});
