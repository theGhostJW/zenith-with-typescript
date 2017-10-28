//@flow

import {test, describe} from 'mocha'
import { debug, yamlToObj } from '../lib/SysUtils';
import { initalState } from '../lib/LogParser';
import type { RunState } from '../lib/LogParser';
import { DEMO_LOG, DEMO_ENTRY } from '../test/LogParser.data.test';
import {chk, chkEq, chkEqJson, chkFalse} from '../lib/AssertionUtils';

describe('string parsing', () => {

  // it('entryFromLines', () => {
  //   let actual = entryFromLines(DEMO_ENTRY);
  //   chkEq('info', actual.level);
  // });


});

describe('entry state', () => {

  const entry =
                `
                timestamp: '2017-10-01 13:46:27'
                level: info
                subType: FilterLog
                popControl: NoAction
                message: Filter Log
                additionalInfo: |
                  Demo_Case.js: Accepted
                  Another_Demo_Case.js: Accepted`


  // it('filter log', () => {
  //   let actual = entryStep(initalState(), yamlToObj(entry)),
  //       expected = {
  //         filterLog: {
  //         Another_Demo_Case: 'Accepted',
  //         Demo_Case: 'Accepted'
  //       }
  //     };
  //   chkEq(expected, actual);
  // });


});
