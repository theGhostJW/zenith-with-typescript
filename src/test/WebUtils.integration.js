// @flow

import {chk, chkEq, chkEqJson, chkFalse, chkExceptionText, chkWithMessage} from '../lib/AssertionUtils';
import { debug, waitRetry, cast  } from '../lib/SysUtils';
import { toTemp, toTempString } from '../lib/FileUtils';
import { toString } from '../lib/StringUtils';
import * as _ from 'lodash';
import { browserEx, findMatchingSourceFile } from '../lib/WebUtils';

describe.only('findMatchingSourceFile', () => {

  it('simple', function blahhh(){
    console.log(findMatchingSourceFile('C:\\ZWTF\\src\\test\\WebUtils.test.js'));
  });

});