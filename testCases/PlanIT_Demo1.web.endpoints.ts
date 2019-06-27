import * as _ from 'lodash';

import { allItems } from '../src/lib/TestRunner';
import { testCase, populateLogIn, clickLogin, smartbearUrl, logInSmartbear, waitRetryDemo, dragAndDrop } from './PlanIT_Demo1.web';
import { baseData } from './PlanIT_Demo1.web.data';
import { testCaseEndPoint, run } from './ProjectConfig';
import { toTemp } from '../src/lib/FileUtils';
import { wdDebug } from '../src/lib/WebUtils';

describe('endPoint', () => {

  it('PlanIT_Demo1.web.endpoint', () => {
     testCaseEndPoint(
       {
       testCase: testCase,
       selector: allItems
      }
    );
  });


 it('PlanIT_Demo1.web baseData', () => {
   toTemp(baseData());
 });


 it('PlanIT_Demo1.web loginSmartbear', () => {
  wdDebug(smartbearUrl, waitRetryDemo);
});


it('PlanIT_Demo1.web run the lot', () => {
  const runConfig = {
    name: "All PlanIT",
    testCases: "Plan*"
  };
  run(runConfig);
});

it('PlanIT_Demo1.web drag and drop', () => {
  wdDebug(null, dragAndDrop);
});


});
