import {it, describe} from 'mocha'
import {chkFalse} from '../lib/AssertionUtils';
import * as _ from 'lodash';
import { chkText } from '../lib/CheckUtils';

describe('chkText', () => {

  it('failure', () => {
    chkFalse(chkText('test1', 'text2', 'should fail'));
  });


});
