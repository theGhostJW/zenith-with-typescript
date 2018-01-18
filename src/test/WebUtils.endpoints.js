// @flow

import {it, describe} from 'mocha';
import {chk, chkEq, chkEqJson, chkFalse, chkExceptionText, chkWithMessage} from '../lib/AssertionUtils';
import { debug, waitRetry, cast } from '../lib/SysUtils';
import { toTemp, toTempString } from '../lib/FileUtils';
import { toString } from '../lib/StringUtils';
import * as _ from 'lodash';
import * as wd from 'webdriverio';

describe.only('', () => {

  it('', () => {
    //$FlowFixMe
    var wdio = new wd.Launcher('.\\wdio.conf.js', {});

    let done = false;
    wdio.run().then(function (code) {
        //process.exit(code);
        console.log(`test run: ${code}`);
        done = true;
    }, function (error) {
        console.error('Launcher failed to start the test', error.stacktrace);
        done = true;
      //  process.exit(1);
    });

    waitRetry(() => done, 10000000);
    console.log(`test run done`);
    console.log('calling PID:  ' + toString(process.pid));

  });

});
