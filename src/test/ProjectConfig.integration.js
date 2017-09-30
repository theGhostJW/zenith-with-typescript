
// @flow

import {it, describe} from 'mocha'
import { run } from '../../testCases/ProjectConfig';
import {chk, chkEq, chkEqJson, chkFalse, chkExceptionText, chkWithMessage} from '../lib/AssertionUtils';
import  type { Environment, Country, Depth } from '../../testCases/ProjectConfig';
import { log } from '../lib/Logging';
import { debug } from '../lib/SysUtils';

describe.only('run', () => {

  const runConfig = {
    name: 'Test Test Run',
    country: 'Australia',
    environment: 'TST',
    testCases: [],
    depth: 'Regression'
  };

  it('demo Test Run', () => {
    log('in test');
    log('in test 2');
    run(runConfig);
  });

});
