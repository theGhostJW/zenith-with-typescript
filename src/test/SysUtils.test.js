// @flow

import {test, suite} from 'mocha'
import {reorderProps, fillArray, isDefined, isNullEmptyOrUndefined, hasValue, def, xOr} from '../lib/SysUtils';
import * as SysUtils from '../lib/SysUtils';
import {chk, chkEq, chkEqJson, chkFalse} from '../lib/AssertionUtils';
import * as _ from 'lodash';


describe('xOr', () => {

  it('all', () => {
    chk(xOr(true, false));
    chk(xOr(false, true));
    chkFalse(xOr(false, false));
    chkFalse(xOr(true, true));
  });

});

describe('def', () => {

  it('def - undefined', () => {
    var deffedVar = def(undefined, 1);
    chkEq(1, deffedVar);
  });

  it('def - empty string', () => {
    /* empty string is treated as a value and not defaulted */
    let myVar = "",
        deffedVar = def(myVar, 1);
    chkEq("", deffedVar);});

  it('def - null', () => {
    let myVar = null,
        deffedVar = def(myVar, 1);
    chkEq(1, deffedVar);});
});

describe('hasValue', () => {

  it('hasValue - all', () => {
      var obj, result;

      result = hasValue(obj);
      chkFalse(result);

      result = hasValue(null);
      chkFalse(result);

      result = hasValue("");
      chkFalse(result);

      result = hasValue("John");
      chk(result);

      result = hasValue("1/1/2000");
      chk(result);

      result = hasValue("1\\1\\2000");
      chk(result);

      result = hasValue(1);
      chk(result);

      result = hasValue(0);
      chk(result);

      var obj = Array(1, 2, 3)
      result = hasValue(obj);
      chk(result);

      obj = Date.parse('2013-1-1');
      result = hasValue(obj);
      chk(result);

      result = hasValue({exists: true });
      chk(result);

      result = hasValue({Exists: true });
      chk(result);

      result = hasValue({exists: false });
      chkFalse(result);

      result = hasValue({Exists: false });
      chkFalse(result);

      result = hasValue({});
      chk(result);
    });
  });

describe('isNullEmptyOrUndefined', () => {

  it('isNullEmptyOrUndefined  - null', () => {
    chk(isNullEmptyOrUndefined(null));
  });

  it('isNullEmptyOrUndefined - undefined', () => {
    chk(isNullEmptyOrUndefined(undefined));
  });

  it('isNullEmptyOrUndefined - str non empty', () => {
    chkFalse(isNullEmptyOrUndefined('a'));
  });

  it('isNullEmptyOrUndefined - str', () => {
    chk(isNullEmptyOrUndefined(''));
  });
});

describe('isDefined', () => {

  it('is defined - null', () => {
    chk(isDefined(null));
  });

  it('is defined - string', () => {
    chk(isDefined(''));
  });

  it('is defined - undefined', () => {
    chkFalse(isDefined(undefined));
  });
});

describe('fillArray', () => {

  it('fillArray - empty', () => {
    var ar = fillArray(0, 'a');
    chkEq(0, ar.length);
  });

  it('fillArray - items', () => {
    var ar = fillArray(3, 'a');
    chkEq([
      'a', 'a', 'a'
    ], ar);
  });
});

describe('reorderProps', () => {

  let sample : {} = {
    prop0: 0,
    prop3: 3,
    prop1: 1,
    prop2: 2
  };

  it('reorderProps - partial', () => {

    let expected : {} = {
      prop2: 2,
      prop1: 1,
      prop0: 0,
      prop3: 3
    };

    let result = reorderProps(sample, 'prop2', 'prop1');
    chkEqJson(expected, result);
  });

  it('reorderProps - missing props', () => {

    let expected : {} = {
      prop2: 2,
      prop1: 1,
      prop0: 0,
      prop3: 3
    };

    let result = reorderProps(sample, 'prop2', 'prop1', 'prop5');
    chkEqJson(expected, result);
  });

  it('reorderProps - all', () => {

    let expected : {} = {
      prop2: 2,
      prop1: 1,
      prop3: 3,
      prop0: 0
    };

    let result = reorderProps(sample, 'prop2', 'prop1', 'prop3', 'prop0');
    chkEqJson(expected, result);
  });

});
