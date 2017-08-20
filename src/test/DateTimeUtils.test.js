//@flow

import {test, describe} from 'mocha'
import {debug, areEqual} from '../lib/SysUtils';
import {  testFormatter, nowAsLogFormat, nowFileFormatted, LOG_FILE_MS_SEC_FORMAT, LOG_TO_SEC_FORMAT } from '../lib/DateTimeUtils';
import { chk, chkEq, chkEqJson, chkFalse, chkHasText,
        chkWithMessage
      } from '../lib/AssertionUtils';

describe('formatters', () => {

  it('LOG_TO_SEC_FORMAT', () => {
    var actual = testFormatter(2018, 8, 19, 20, 10, 5, 77, LOG_TO_SEC_FORMAT);
    chkEq('2018-08-19 20:10:05', actual);
  });

  it('LOG_TO_SEC_FORMAT', () => {
    var actual = testFormatter(2018, 8, 19, 20, 10, 5, 77, LOG_FILE_MS_SEC_FORMAT);
    chkEq('2018-08-19 20-10-05-077', actual);
  });

});


describe.only('formatted nows', () => {

  it('just check it does not blow up - nowAsLogFormat', () => {
    var actual = nowAsLogFormat();
    debug(actual);
  });

  it('just check it does not blow up - nowFileFormatted', () => {
    var actual = nowFileFormatted();
    debug(actual);
  });

});
