// @flow

const _ = require('lodash');
import {show, hasText, wildCardMatch} from './StringUtils';
import {areEqual, ensure, fail, debug} from './SysUtils';

export function chkWithMessage(val: boolean, message: string = ''): void {
  ensure(val, message);
}

export function chk(val: boolean): void {
  chkWithMessage(val);
}

export function chkHasText(actualHaystack: string | null | undefined , expectedNeedle: string) : void {
  chkWithMessage(hasText(actualHaystack, expectedNeedle),
    `looking for: <${expectedNeedle}> \n  IN \n <${show(actualHaystack)}>`);
}

export function chkFalse(val : boolean) : void {
  chk(!val);
}

export function chkEq(expected : any, actual : any) : void {
  if ( !areEqual(expected, actual)) {
    fail(`expected: <${show(expected)}> did not equal actual <${show(actual)}>`);
  }
}

export function chkEqJson(expected : any, actual: any) : void {
  let expectedJ = JSON.stringify(expected),
      actualJ = JSON.stringify(actual);

  if (expectedJ.valueOf() !== actualJ.valueOf()) {
    fail('Expected:\n' + expectedJ + 'did not equal \nActual:\n' + actualJ);
  };
}

export function chkExceptionText(action : () => any, exceptionText: string, caseSensitive: boolean = false) {
  let failMessage: string | null = null;
  chkException(
      action,
      (e: any) => {
        failMessage = show(e);
        return wildCardMatch(failMessage, exceptionText, caseSensitive);
      },
      () => failMessage == null ? exceptionText :
              '<' +  exceptionText + '> not found in: \n<' + failMessage +'>'
  );
}

export function chkException(action : () => any, erroCheck: (e: any) => boolean, message : (() => string) | string | void): void{

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
