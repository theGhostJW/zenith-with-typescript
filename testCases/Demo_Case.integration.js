// @flow

import {it, describe} from 'mocha';
import {chk, chkEq, chkEqJson, chkFalse, chkExceptionText, chkWithMessage} from '../src/lib/AssertionUtils';

import { debug } from '../src/lib/SysUtils';
import { toTemp, toTempString } from '../src/lib/FileUtils';
import * as _ from 'lodash';

import { testCase } from '../testCases/Demo_Case';
import { testCaseEndPoint } from '../testCases/ProjectConfig';

describe.only('endPoint', () => {

  it('demo endpoint', () => {
     testCaseEndPoint(
       {
       testCase: testCase,
       selector: 3
     }
    );
  });
});
