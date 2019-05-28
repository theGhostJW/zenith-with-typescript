import {it, describe} from 'mocha';
import { allItems } from '../src/lib/TestRunner';
import { testCase } from './Another_Demo_Case';
import { testCaseEndPoint } from './ProjectConfig';

describe('endPoint', () => {

  it('demo endpoint', () => {
     testCaseEndPoint(
       {
       testCase: testCase,
       selector: allItems,
       mocked: false
     }
    );
  });
});
