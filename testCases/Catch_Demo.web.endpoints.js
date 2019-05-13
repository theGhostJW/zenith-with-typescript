// @flow

import {it, describe} from 'mocha';

import { debug } from '../src/lib/SysUtils';
import * as _ from 'lodash';

import { allItems } from '../src/lib/TestRunner';
import { testCase } from '../testCases/Catch_Demo.web';
import { testCaseEndPoint } from '../testCases/ProjectConfig';

describe('endPoint', () => {

  it('demo endpoint', () => {
     testCaseEndPoint(
       {
       mocked: false,
       testCase: testCase,
       selector: 100
     }
    );
  });
});

//TODO: error on empty list for endpoint selector

