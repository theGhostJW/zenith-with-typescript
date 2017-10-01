//@flow

import {test, describe} from 'mocha'
import { debug } from '../lib/SysUtils';
import { entryFromLines } from '../lib/LogParser';
import { DEMO_LOG, DEMO_ENTRY } from '../test/LogParser.data.test';
import {chk, chkEq, chkEqJson, chkFalse} from '../lib/AssertionUtils';

describe('string parsing', () => {

  it('entryFromLines', () => {
    let actual = debug(entryFromLines(DEMO_ENTRY));
    chkEq('info', actual.level);
  });


});
