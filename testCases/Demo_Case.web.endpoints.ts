import * as _ from 'lodash';

import { allItems } from '../src/lib/TestRunner';
import { testCase } from './Demo_Case.web';
import { testCaseEndPoint } from './ProjectConfig';

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
