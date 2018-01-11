// @flow

import { run } from '../../testCases/ProjectConfig';
import { debug } from '../lib/SysUtils';
import {test, describe} from 'mocha';





describe('endPoints ', () => {

  it('demo ', () => {
    debug('this is an end point')
  });

});


describe('run', () => {

  const runConfig = {
    name: 'Test Test Run',
    mocked: false,
    country: 'Australia',
    environment: 'TST',
    testCases: [],
    depth: 'Regression'
  };

  it('demo Test Run', () => {
    run(runConfig);
  });

});
