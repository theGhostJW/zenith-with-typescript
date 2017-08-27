//@flow

import {test, describe} from 'mocha'
import {debug, areEqual} from '../lib/SysUtils';
import {  testFormatter, nowAsLogFormat, nowFileFormatted,
        LOG_FILE_MS_SEC_FORMAT, LOG_TO_SEC_FORMAT, now, today, date, time, datePlus, todayPlus,
        toMoment } from '../lib/DateTimeUtils';
import { chk, chkEq, chkEqJson, chkFalse, chkHasText,
        chkWithMessage
      } from '../lib/AssertionUtils';


function jsToday() {
  let jsDate = new Date();
  return truncDate(jsDate);
}

function truncDate(jsDate) {
  return new Date(jsDate.getFullYear(), jsDate.getMonth(), jsDate.getDate());
}

describe('toMoment', () => {

  it('simple', () => {
    let jsDate = new Date(),
        actual = toMoment(jsDate);

    chkEq(jsDate, actual.toDate())
  });

});

describe('todayPlus', () => {

  it('equal today when zero', () => {
    chkEq(jsToday() , todayPlus(0).toDate());
  });

  it('equal yestrday when -1', () => {
    chkEq(1 * 1000 * 60 * 60 * 24, jsToday() - todayPlus(-1).toDate());
  });

});

describe('datePlus', () => {

  it('equal expected miliseconds from today', () => {
    chkEq(5 * 1 * 1000 * 60 * 60 * 24,   todayPlus(5).toDate() - jsToday());
  });

});

describe('time', () => {

  it('should ~ equal now ', () => {
    let momentTime = now(),
        jsDate = new Date(),
        expected =  time(jsDate.getFullYear(), jsDate.getMonth() + 1, jsDate.getDate(), jsDate.getHours(),
                        jsDate.getMinutes(), jsDate.getSeconds(), jsDate.getMilliseconds());
    chk(momentTime.toDate() - expected.toDate()  < 1000);
  });

});

describe('date', () => {

  it('should equal today ', () => {
    let jsDate = jsToday();
    // jsdate getMonth returns 0..11
    chkEq(jsToday(), date(jsDate.getFullYear(), jsDate.getMonth() + 1, jsDate.getDate()).toDate());
  });

});

describe('today', () => {

  it('midnight ', () => {
    chkEq(jsToday(), today().toDate());
  });

});


describe('now', () => {

  it('just check it does not blow up - nowAsLogFormat', () => {
    let actual = now(),
        jsDate = Date.now();

    debug(actual.toDate());
    chk(jsDate - actual.toDate() < 1000);
  });

});


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


describe('formatted nows', () => {

  it('just check it does not blow up - nowAsLogFormat', () => {
    var actual = nowAsLogFormat();
    debug(actual);
  });

  it('just check it does not blow up - nowFileFormatted', () => {
    var actual = nowFileFormatted();
    debug(actual);
  });

});
