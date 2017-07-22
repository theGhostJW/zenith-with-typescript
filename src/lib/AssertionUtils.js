// @flow

import * as _ from 'lodash';
import {toString} from '../lib/StringUtils';
import {areEqual, ensure} from '../lib/SysUtils';

export const chk = ensure;

export function chkFalse(val : boolean, msg : string = '') {
  chk(!val, msg);
}

export function chkEq(expected : mixed, actual : mixed, msg : string = '') : void {
  if ( !areEqual(expected, actual)) {
    throw new Error(`<${toString(expected)}> did not equal <${toString(actual)}>` + ' ' + msg);
  }
}

export function chkEqJson(expected : mixed, actual: mixed, msg : string = '') : void {
  let expectedJ = JSON.stringify(expected),
      actualJ = JSON.stringify(actual);

  if (expectedJ.valueOf() !== actualJ.valueOf()) {
    throw new Error('Expected:\n' + expectedJ + 'did not equal \nActual:\n' + actualJ);
  };
}
