
// @flow

import { test, suite, setParts } from 'mocha'
import { reorderProps, fillArray } from '../lib/SysUtils';

function chkEq(val1: any, val2: any, msg: ?string) {
  if (val1 !== val2) throw new Error(val1 + 'did not equal ' + val2);
}

function chkEqJson(val1: {}, val2: {}, msg: ?string) {
  let v1 = JSON.stringify(val1),
      v2 = JSON.stringify(val2);

  if (v1 !== v2) throw new Error(v2 + 'did not equal expected ' + v1);
}


function setPartsEndPoint(){
  var result = sysUtils.setParts([1,2,3,4], [2,4,6,8]);
  checkUtils.checkEqual([[1, 3], [2, 4], [6, 8]], result);
}

suite('fillArray');


test('fillArray - empty', () => {
  var ar = fillArray(0, 'a');
  chkEq(0, ar.length);
})

suite('reorderProps');

let sample: {} = {
    prop0: 0,
    prop3: 3,
    prop1: 1,
    prop2: 2
};

test ('reorderProps - partial', ()  => {

    let expected: {} = {
        prop2: 2,
        prop1: 1,
        prop0: 0,
        prop3: 3
    };

   let result = reorderProps(sample, 'prop2', 'prop1');
   chkEqJson(expected, result);
});

test ('reorderProps - missing props', ()  => {

    let expected: {} = {
        prop2: 2,
        prop1: 1,
        prop0: 0,
        prop3: 3
    };

   let result = reorderProps(sample, 'prop2', 'prop1', 'prop5');
   chkEqJson(expected, result);
});

test ('reorderProps - all', ()  => {

    let expected: {} = {
        prop2: 2,
        prop1: 1,
        prop3: 3,
        prop0: 0
    };

   let result = reorderProps(sample, 'prop2', 'prop1', 'prop3', 'prop0');
   chkEqJson(expected, result);
});
