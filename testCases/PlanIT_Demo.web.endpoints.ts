import * as _ from 'lodash';

import { allItems } from '../src/lib/TestRunner';
import { testCase } from './PlanIT_Demo.web';
import { testCaseEndPoint, run } from './ProjectConfig';

describe('endPoint', () => {

  it('PlanIT_Demo.web.endpoint', () => {
     testCaseEndPoint(
       {
       testCase: testCase,
       selector: allItems
      }
    );
  });
})
