import * as _ from 'lodash';

import { allItems } from '../src/lib/TestRunner';
import { testCase } from './PlanIT_Demo.web';
import { baseData } from './PlanIT_Demo.web.data';
import { testCaseEndPoint } from './ProjectConfig';
import { toTemp } from '../src/lib/FileUtils';

describe('endPoint', () => {

  it('PlanIT_Demo.web.endpoint', () => {
     testCaseEndPoint(
       {
       testCase: testCase,
       selector: allItems
      }
    );
  });


 it('PlanIT_Demo.web baseData', () => {
   toTemp(baseData());
 });


});
