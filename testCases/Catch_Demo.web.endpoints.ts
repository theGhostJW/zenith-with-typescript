import {it, describe} from 'mocha';

import * as _ from 'lodash';

import { testCase } from './Catch_Demo.web';
import { testCaseEndPoint } from './ProjectConfig';

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
