import * as _ from 'lodash';

import { allItems } from '../src/lib/TestRunner';
import { testCase } from './PlanIT_Demo.web';
import { testCaseEndPoint } from './ProjectConfig';

describe('endPoint', () => {

  it.only('PlanIT_Demo.web.endpoint', () => {
     testCaseEndPoint(
       {
       testCase: testCase,
       selector: allItems
      }
    );
  });
  
})