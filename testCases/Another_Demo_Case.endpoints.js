// @flow

import {it, describe} from 'mocha';
import {chk, chkEq, chkEqJson, chkFalse, chkExceptionText, chkWithMessage} from '../src/lib/AssertionUtils';

import { debug } from '../src/lib/SysUtils';
import { toTemp, toTempString } from '../src/lib/FileUtils';
import * as _ from 'lodash';

import { allItems } from '../src/lib/TestRunner';
import { testCase } from '../testCases/Another_Demo_Case';
import { testCaseEndPoint } from '../testCases/ProjectConfig';

describe('endPoint', () => {

  it.only('demo endpoint', () => {
     testCaseEndPoint(
       {
       testCase: testCase,
       selector: allItems,
       mocked: false
     }
    );
  });
});
