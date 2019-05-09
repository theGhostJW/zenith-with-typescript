// @flow

import { run } from '../../testCases/ProjectConfig';
import { debug } from '../lib/SysUtils';
import {test, describe} from 'mocha';





describe('endPoints ', () => {

  it('demo ', () => {
    console.log('this is an end point')
  });

});


describe('run', () => {
  const runConfig = {
    name: 'Test Test Run',
    mocked: false,
    country: 'Australia',
    environment: 'TST',
    testCases: [
                "Catch_Demo.web", 
                "Catch_Demo_Log_In.web"
              ],
    depth: 'Regression'
  };

  it('Catch Test Run', () => {
    run(runConfig);
  });

});
