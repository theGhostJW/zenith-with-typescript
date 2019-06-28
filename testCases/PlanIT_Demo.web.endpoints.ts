import * as _ from 'lodash';

import { allItems } from '../src/lib/TestRunner';
import { testCase } from './PlanIT_Demo.web';
import { testCaseEndPoint, run } from './ProjectConfig';
import { toTemp } from '../src/lib/FileUtils';
import { wdDebug } from '../src/lib/WebUtils';

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
