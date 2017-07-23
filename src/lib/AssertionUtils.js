// @flow

import * as _ from 'lodash';
import {toString, hasText} from '../lib/StringUtils';
import {areEqual, ensure, fail} from '../lib/SysUtils';

export const chk = ensure;

export function chkFalse(val : boolean, msg : string = '') {
  chk(!val, msg);
}

export function chkEq(expected : mixed, actual : mixed, msg : string = '') : void {
  if ( !areEqual(expected, actual)) {
    fail(`expected: <${toString(expected)}> did not equal actual <${toString(actual)}>` + ' ' + msg);
  }
}

export function chkEqJson(expected : mixed, actual: mixed, msg : string = '') : void {
  let expectedJ = JSON.stringify(expected),
      actualJ = JSON.stringify(actual);

  if (expectedJ.valueOf() !== actualJ.valueOf()) {
    fail('Expected:\n' + expectedJ + 'did not equal \nActual:\n' + actualJ);
  };
}

export function chkExceptionText(action : () => void, exceptionText: string, caseSensitive: boolean = false) {
  chkException(
      action,
      (e: Error) => {
        return hasText(e.message, exceptionText, caseSensitive);
      }
  );
}

export function chkException(action : () => void, erroCheck: Error => boolean, message : string = ''){
  try {
    action();
    fail('expected exception not thrown ' + message);
  } catch (e) {
    chk(erroCheck(e), 'error check failed ' + message)
  }
}
