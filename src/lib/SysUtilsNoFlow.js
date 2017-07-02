import { areEqual } from '../lib/SysUtils';
import * as _ from 'lodash';

export function objectsEqual(expected: {} , actual: {}) : boolean {

  function valEqualsActual(accum: boolean, key: string) : boolean {
    if (!accum)
      accum;

    return areEqual((expected[key]), actual[key]);
  }

  var expectedKeys = _.keysIn(expected);
  return expectedKeys.length === _.keysIn(actual).length
    ? _.reduce(expectedKeys, valEqualsActual, true)
    : false;
}

function arraysEqual(expected: Array<mixed>, actual: Array<mixed>) {
  function elementsEqual(pair) {
    return areEqual(pair[0], pair[1]);
  }
  return expected.length === actual.length
    ? _.chain(expected).zip(actual).all(elementsEqual).value()
    : false;
}
