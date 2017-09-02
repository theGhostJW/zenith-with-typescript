// @flow

import {it, describe } from 'mocha'
import { listProcesses } from '../lib/SysUtils';
import { toTempString } from '../lib/FileUtils';
import {toString, hasText} from '../lib/StringUtils';
import {chk, chkEq, chkFalse, chkExceptionText, chkWithMessage} from '../lib/AssertionUtils';
import * as _ from 'lodash';
import { PROCESS_LIST } from '../test/SysUtils.data.test';
import { log } from '../lib/Logging';


describe('listProcesses', function() {

  this.timeout(5000);

  it('simple', () => {
    let actual = listProcesses();
    // any decent system will have more than 20 processes running

    chk(actual.length > 20);
  });

});
