// @flow

import * as _ from 'lodash';
import {toString} from '../lib/StringUtils';
import {areEqual} from '../lib/SysUtils';

export const ensure = chk;

export function chk(val : boolean, msg : string = '') {
  if (!val) {
    throw new Error('chk failure ' + msg);
  }
}

export function chkFalse(val : boolean, msg : string = '') {
  chk(!val, msg);
}

export function chkEq(expected : mixed, actual : mixed, msg : string = '') : void {
  if ( !areEqual(expected, actual)) {
    throw new Error(`<${toString(expected)}> did not equal <${toString(actual)}>` + ' ' + msg);
  }
}

export function chkEqJson(val1 : {}, val2 : {}, msg : string = '') : void {
  let v1 = JSON.stringify(val1),
    v2 = JSON.stringify(val2);

  if (v1 !== v2) {
    throw new Error(v2 + 'did not equal expected ' + v1)
  };
}
