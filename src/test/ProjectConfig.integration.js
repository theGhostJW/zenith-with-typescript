
// @flow

import {it, describe} from 'mocha'
import { run } from '../../testCases/ProjectConfig';
import {chk, chkEq, chkEqJson, chkFalse, chkExceptionText, chkWithMessage} from '../lib/AssertionUtils';
import  type { Environment, Country, Depth } from '../../testCases/ProjectConfig';
import { log } from '../lib/Logging';
import { debug } from '../lib/SysUtils';

describe('run', () => {

  const runConfig = {
    name: 'Test Test Run',
    mocked: false,
    country: 'Australia',
    environment: 'TST',
    testCases: [],
    depth: 'Regression'
  };

  it.only('demo Test Run', () => {
    run(runConfig);
  });

});
