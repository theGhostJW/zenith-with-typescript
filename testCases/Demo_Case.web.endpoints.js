// @flow

import {it, describe} from 'mocha';

import { debug, fail } from '../src/lib/SysUtils';
import * as _ from 'lodash';

import { allItems } from '../src/lib/TestRunner';
import { testCase } from '../testCases/Demo_Case.web';
import { testCaseEndPoint } from '../testCases/ProjectConfig';

describe('endPoint', () => {

  it('demo endpoint', () => {
     testCaseEndPoint(
       {
       testCase: testCase,
       selector: allItems
      }
    );
  });
});
