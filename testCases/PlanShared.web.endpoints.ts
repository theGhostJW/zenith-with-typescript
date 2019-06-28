import * as _ from 'lodash';

import { allItems } from '../src/lib/TestRunner';
import { testCase } from './PlanIT_Demo.web';
import { testCaseEndPoint, run } from './ProjectConfig';
import { goHome, goContacts} from './PlanShared.web';
import { toTemp } from '../src/lib/FileUtils';
import { wdDebug } from '../src/lib/WebUtils';



describe('endPoint', () => {
  it('PlanIT_Demo endpoint', () => {
    testCaseEndPoint(
      {
        testCase: testCase,
        selector: allItems
     }
   );
 });

});
