//@flow

import {test, describe} from 'mocha'
import { debug } from '../lib/SysUtils';
import { logSplitter, parseLogDefault } from '../lib/LogParser';
import { testDataFile } from '../lib/FileUtils';
import { DEMO_LOG, DEMO_ENTRY } from '../test/LogParser.data.test';
import {chk, chkEq, chkEqJson, chkFalse} from '../lib/AssertionUtils';

describe('file Parsing', () => {

  it.only('logSplitter', () => {
    parseLogDefault(testDataFile('DemoLog.raw.yaml'));
  });

});
