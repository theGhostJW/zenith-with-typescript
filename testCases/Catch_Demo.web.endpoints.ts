import {it, describe} from 'mocha';

import * as _ from 'lodash';

import { testCase } from './Catch_Demo.web';
import { testCaseEndPoint } from './ProjectConfig';
import { log } from '../src/lib/Logging';

describe('endPoint', () => {

  it.only('demo endpoint', () => {
     testCaseEndPoint(
       {
       mocked: false,
       testCase: testCase,
       selector: 100
     }
    );
    log("Done!!!!!!");
  });
});

//TODO: error on empty list for endpoint selector

