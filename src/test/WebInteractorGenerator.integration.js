// @flow

import {it, describe} from 'mocha';
import {chk, chkEq, chkEqJson, chkFalse, chkExceptionText, chkWithMessage, chkHasText} from '../lib/AssertionUtils';
import { debug } from '../lib/SysUtils';
import { toTemp, toTempString, fromTempString } from '../lib/FileUtils';
import * as _ from 'lodash';
import { generateAndDumpTestFile } from '../lib/WebInteractorGenerator';

describe('generateAndDumpTestFile', () => {

  it('works', () => {
    let before = {
      isUrl: true,
      name: 'http:\\google.com.au'
    };
    generateAndDumpTestFile(before, 'interactor', 'Demo_Case.web', 'C:\\ZWTF\\temp\\WebInteractor.js', true);
    let actual = fromTempString('WebInteractor.js', false);
    chkHasText(actual, 'startServer();');
  });

});
