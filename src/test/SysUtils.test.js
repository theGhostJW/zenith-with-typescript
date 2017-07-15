// @flow

import {it, describe} from 'mocha'
import {reorderProps, fillArray, isDefined, isNullEmptyOrUndefined, hasValue, def, xOr, all, stringConvertableToNumber,
        areEqualWithTolerance, areEqual, seekAllInObjWithInfo} from '../lib/SysUtils';
import * as SysUtils from '../lib/SysUtils';
import {chk, chkEq, chkEqJson, chkFalse} from '../lib/AssertionUtils';
import * as _ from 'lodash';

describe.only('seekAllInObjWithInfo', () => {

  it('finds a single string match', () => {

    let targ = {
            blah: 1
            },
        expected = {},
        actual = seekAllInObjWithInfo(targ, 'blah');
    //[1, 2, [1, 2, 3], 'Gary']
     chkEq(expected, actual);
  });

  // it('finds many string match', () => {
  //
  //   let targ = {
  //           blah1: 1,
  //             child: {
  //               blah: 2,
  //               grandChild: {
  //                 blah: [1, 2, 3],
  //                 blahh2: 'Gary'
  //               }
  //             }
  //           },
  //       expected = {},
  //       actual = seekAllInObjWithInfo(targ, 'blah*');
  //   //[1, 2, [1, 2, 3], 'Gary']
  //    chkEq(expected, actual);
  // });

});


describe('areEqualWithTolerance', () => {

  it('all', () => {
    chk(areEqualWithTolerance(1, 1.000000, 0.000001));
    chk(areEqualWithTolerance(1.000001, 1.000000, 0.000001));
    chkFalse(areEqualWithTolerance(1.000001, 1.000000, 0.0000009));
    chk(areEqualWithTolerance(0, 0, 0.000001));
    chk(areEqualWithTolerance(1, 1.1, 0.1));
    chk(areEqualWithTolerance(1, '1.1', 0.1));
    chk(areEqualWithTolerance(1, '0.9', 0.1));
    chk(areEqualWithTolerance(0.0000000001, 0.0000000001));

    chkFalse(areEqualWithTolerance(1, '0.9', 0.09));
    chk(areEqualWithTolerance(1.000001, '1', 0.000001));
    chkFalse(areEqualWithTolerance(1.000001, '1', 0.0000009999999));
    chkFalse(areEqualWithTolerance(1.000001, '1.000001001', 0));
  });
});

describe('areEqual', () => {

  it('null', () => {
    chk(areEqual(null, null));
  });

  it('2 ints', () => {
    chk(areEqual(22, 22));
  });

  it('unequal numbers ints one as string', () => {
    chkFalse(areEqual(22, 22.1));
  });

  it('two floats', () => {
    chk(areEqual(22.111, 22.111));
  });

  let val1, val2;
  val1 = {
      a: {
        b: 1.2222,
        c: 5.667
      },

    b: new Date(1977, 8, 9),
    c: 66,
    d: 'hi'
  }

  val2 = {
    b: new Date(1977, 8, 9),
    c: 66,
    d: 'hi',
    a: {
        b: 1.2222,
        c: (6 - 0.333)
      }
  };

  it('two objects', () => {
    chk(areEqual(val1, val2));
  });

  it('two objects differ', () => {
    val1.c = 66.00001;
    chkFalse(areEqual(val1, val2));
  });

  it('two strings', () => {
    let dStr = () => {return '[1,2,3]';}
    chk(areEqual('[1,2,3]', dStr()));
  });

});

describe('stringConvertableToNumber', () => {

  it('when true', () => {
    chk(stringConvertableToNumber('0'));
    chk(stringConvertableToNumber('1'));
    chk(stringConvertableToNumber('1.1110'));
    chk(stringConvertableToNumber('0.1110'));
  });

  it('when false', () => {
    chkFalse(stringConvertableToNumber('a1.1110'));
    chkFalse(stringConvertableToNumber('01.1110'));
    chkFalse(stringConvertableToNumber('.1110'));
    chkFalse(stringConvertableToNumber('00.1110'));
    chkFalse(stringConvertableToNumber('.1110'));
    chkFalse(stringConvertableToNumber(''));
  });

  it('null / undefined', () => {
    chkFalse(stringConvertableToNumber(null));
    chkFalse(stringConvertableToNumber(undefined));
  });

});


describe('all', () => {

  let even = (n: number) => { return n % 2 === 0; },
      allEven = (arr: Array<number>) => {return all(even, arr) };

  it('when true', () => {
    chk(allEven([2, 4, 6, 8, 10]));
  });

  it('when false', () => {
    chkFalse(allEven([2, 4, 6, 8, 11]));
  });

  it('empty', () => {
    chk(allEven([]));
  });

});


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
