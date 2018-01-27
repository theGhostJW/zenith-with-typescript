// @flow

import {it, describe} from 'mocha';
import {chk, chkEq, chkEqJson, chkFalse, chkExceptionText, chkWithMessage, chkHasText} from '../lib/AssertionUtils';
import { debug } from '../lib/SysUtils';
import { toTemp, toTempString, fromTempString } from '../lib/FileUtils';
import * as _ from 'lodash';
import { dumpTestFile } from '../lib/WebInteractorGenerator';

describe('dumpTestFile', () => {

  it('works', () => {
    dumpTestFile('Demo_Case.web', 'C:\\ZWTF\\temp\\WebInteractor.js');
    let actual = fromTempString('WebInteractor.js', false);
    chkHasText(actual, 'runClient();');
  });

});
