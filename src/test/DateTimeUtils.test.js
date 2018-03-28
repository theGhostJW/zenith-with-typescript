//@flow

import {test, describe} from 'mocha'
import {debug, areEqual} from '../lib/SysUtils';
import {  testFormatter, nowAsLogFormat, nowFileFormatted,
        LOG_FILE_MS_SEC_FORMAT, LOG_TO_SEC_FORMAT, now, today, date, time, datePlus, todayPlus,
        toMoment, strToMoment, SHORT_DATE_TIME, SHORT_DATE, duration, durationFormatted, SHORT_DATE_TIME_MS } from '../lib/DateTimeUtils';
import { chk, chkEq, chkEqJson, chkFalse, chkHasText,
        chkWithMessage
      } from '../lib/AssertionUtils';
import moment from 'moment';


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

describe('strToMoment', () => {

  it('simple', () => {
    let jsDate = new Date(2017, 10, 25, 11, 28, 22),
        actual = strToMoment('2017-11-25 11:28:22');

    chkEq(jsDate, actual.toDate())
  });

  it('simple short date time', () => {
    let jsDate = new Date(2017, 10, 25, 11, 28, 22),
        actual = strToMoment('25/11/2017 11:28:22', SHORT_DATE_TIME);

    chkEq(jsDate, actual.toDate())
  });

  it('simple short date', () => {
    let jsDate = new Date(2017, 10, 25),
        actual = strToMoment('25/11/2017 11:28:22', SHORT_DATE);

    chkEq(jsDate, actual.toDate())
  });


});


const chkMomentEq = (mE, mA) => chkEq(mE.asMilliseconds(), mA.asMilliseconds());

describe('duration', () => {

  it('2 strings', () => {
    let from = '2017-01-01',
        to = '2017-01-15',
        expected = moment.duration({
                                  seconds: 0,
                                  minutes: 0,
                                  hours: 0,
                                  days: 0,
                                  weeks: 2,
                                  months: 0,
                                  years: 0
                                });

    chkMomentEq(expected, duration(from, to));
  });

  it('2 strings all units', () => {
    let from = '2017-01-01',
        to = '2018-01-15 16:28:14.987',
        expected = moment.duration({
                                  milliseconds: 987,
                                  seconds: 14,
                                  minutes: 28,
                                  hours: 16,
                                  days: 14,
                                  weeks: 0,
                                  months: 0,
                                  years: 1
                                });

    chkMomentEq(expected, duration(from, to));
  });

  it('2 strings all units formatted', () => {
    let from = '01/01/2017',
        to = '15/01/2018 16:28:14.987',
        expected = moment.duration({
                                  milliseconds: 987,
                                  seconds: 14,
                                  minutes: 28,
                                  hours: 16,
                                  days: 14,
                                  weeks: 0,
                                  months: 0,
                                  years: 1
                                });

    chkMomentEq(expected, duration(from, to, SHORT_DATE_TIME_MS));
  });


});

describe('durationFormatted', () => {

  it('zero', () => {
    let from = '2017-01-01',
        to = '2017-01-01';

    chkEq('00:00:00', durationFormatted(from, to));
  });

  it('many hours', () => {
    let from = '2018-01-01',
        to = '2018-01-15 16:05:14.987';

    chkEq('352:05:14', durationFormatted(from, to));
  });

  it('zero with ms', () => {
    let from = '2017-01-01',
        to = '2017-01-01';

    chkEq('00:00:00.000', durationFormatted(from, to, true));
  });

  it('many hours with ms', () => {
    let from = '2018-01-01',
        to = '2018-01-15 16:05:14.987';

    chkEq('352:05:14.987', durationFormatted(from, to, true));
  });

  it('many hours with ms negative hours', () => {
    let from = '2018-01-01 16:00:00',
        to = '2018-01-15 00:05:14.987';

    chkEq('320:05:14.987', durationFormatted(from, to, true));
  });

  it('many hours with ms negative duration', () => {
    let from = '2018-01-01',
        to = '2018-01-15 16:05:14.987';

    chkEq('-352:05:14.987', durationFormatted(to, from, true));
  });

  it('many hours format no ms', () => {
    let from = '01/01/2018',
        to = '15/01/2018 16:05:14.987';

    chkEq('352:05:14', durationFormatted(from, to, false, SHORT_DATE_TIME_MS));
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

  it.only('equal expected miliseconds from today', () => {
    let month = today().month() + 1,
        dateDiff = todayPlus(5).toDate() - jsToday(),
        fiveDays = 5 * 1000 * 60 * 60 * 24,
        oneHour =  1000 * 60 * 60,
        withinTolerance: boolean = (fiveDays === dateDiff) ||
            ((month === 3 || month === 4 ) && fiveDays + oneHour === dateDiff) || // daylight savings end
            ((month === 9 || month === 10 ) && fiveDays - oneHour === dateDiff); // daylight savings start

    chk(withinTolerance);
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
    console.log(actual);
  });

  it('just check it does not blow up - nowFileFormatted', () => {
    var actual = nowFileFormatted();
    console.log(actual);
  });

});
