// @flow

import * as _ from 'lodash';
import {toString, hasText} from '../lib/StringUtils';
import {areEqual, ensure, fail, debug} from '../lib/SysUtils';

export function chkWithMessage(val: boolean, message: string = ''): void {
  ensure(val, message);
}

export function chk(val: boolean): void {
  chkWithMessage(val);
}

export function chkHasText(actualHaystack: ?string, expectedNeedle: string) : void {
  chkWithMessage(hasText(actualHaystack, expectedNeedle),
    `looking for: <${expectedNeedle}> \n  IN \n <${toString(actualHaystack)}>`);
}


export function chkFalse(val : boolean) : void {
  chk(!val);
}

export function chkEq(expected : mixed, actual : mixed) : void {
  if ( !areEqual(expected, actual)) {
    fail(`expected: <${toString(expected)}> did not equal actual <${toString(actual)}>`);
  }
}

export function chkEqJson(expected : mixed, actual: mixed) : void {
  let expectedJ = JSON.stringify(expected),
      actualJ = JSON.stringify(actual);

  if (expectedJ.valueOf() !== actualJ.valueOf()) {
    fail('Expected:\n' + expectedJ + 'did not equal \nActual:\n' + actualJ);
  };
}

export function chkExceptionText(action : () => any, exceptionText: string, caseSensitive: boolean = false) {
  let failMessage = null;
  chkException(
      action,
      (e: Error) => {
        failMessage = toString(e);
        return hasText(failMessage, exceptionText, caseSensitive);
      },
      () => failMessage == null ? exceptionText :
              '<' +  exceptionText + '> not found in: \n<' + failMessage +'>'
  );
}

export function chkException(action : () => any, erroCheck: Error => boolean, message : (() => string) | string | void){

  function messageFunc(): string {
    return message == null ? '' :
        typeof message == 'string'  ? message : message();
  }

  let exceptionHit = true;
  try {
    action();
    exceptionHit = false;
  } catch (e) {
    chkWithMessage(erroCheck(e), 'error check failed ' + messageFunc())
  }
  chkWithMessage(exceptionHit, 'No Exception thrown when exception expected. Expecting: ' + messageFunc());
}
