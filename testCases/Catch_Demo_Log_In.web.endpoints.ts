import {it, describe} from 'mocha';
import * as _ from 'lodash';

import { allItems } from '../src/lib/TestRunner';
import { testCase } from './Catch_Demo_Log_In.web';
import { testCaseEndPoint } from './ProjectConfig';

describe('endPoint', () => {

  it('demo endpoint', () => {
     testCaseEndPoint(
       {
       mocked: false,
       testCase: testCase,
       selector: allItems
     }
    );
  });
});

//TODO: error on empty list for endpoint selector

