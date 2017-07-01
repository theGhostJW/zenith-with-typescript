// @flow

import * as _ from 'lodash';

export const ARRAY_QUERY_ITEM_LABEL = '[Array Query Item]';

export function def<a>(val: ?a, defaultVal: a) : a {
    // != null === not null or undefined
    if (val != null) {
      return val;
    }
    else {
      return defaultVal;
    }
}

export function isNullEmptyOrUndefined(arg: mixed) : boolean {
  return !(arg != null)  || arg === '';
}

export function isDefined(arg: mixed) : boolean {
  return typeof arg !== 'undefined';
}

export function isUndefined(arg: mixed) : boolean {
  return !isDefined(arg);
}

export function hasValue(arg: mixed) : boolean {

  function notFalseVal(key : string): boolean {
    if (arg != null && typeof arg === 'object') {
      let val: mixed = arg[key];
      if (val != null){
        return (typeof val === 'boolean') && val;
      }
      else {
        return true;
      }
    } else {
       return true;
    }
  }

  return isNullEmptyOrUndefined(arg)
    ? false
    : _.isArray(arg)
      ? true
      : _.isObject(arg)
        ? (notFalseVal('exists') && notFalseVal('Exists')) //TODO - this is specific to TC UI unfound UI items update for testCafe
        : true;
}

/*
export function areEqual(expected : any, actual : any, useTolerance :
  ? boolean = true) {

  function asString(val) {
    return !hasValue(val)
      ? val
      : _.isString(val)
        ? val
        : _.isFunction(val.toString)
          ? val.toString()
          : val;
  }

  var result;
  if (!result) {
    if (xOr(hasValue(expected), hasValue(actual))) {
      result = false;
    } else if (expected === null && actual === null) {
      result = true;
    } else if (xOr(_.isString(expected), _.isString(actual))) {
      return asString(expected) === asString(actual);
    } else if (_.isArray(expected) && _.isArray(actual)) {
      return arraysEqual(expected, actual);
    } else if (_.isObject(expected) && _.isObject(actual)) {
      return objectsEqual(expected, actual);
    } else if (useTolerance && _.isNumber(expected) && _.isNumber(actual)) {
      return areEqualWithTolerance(expected, actual, 0)
    } else {
      var varType = GetVarType(actual);
      switch (varType) {
        case 7: // Date
          result = aqDateTime.Compare(expected, actual) === 0;
          break;

        default:
          result = _.isEqual(expected, actual);
          break;
      }
    }
    return result;
  }
}

function objectsEqual(expected, actual) {

  function valEqualsActual(accum, expectedVal, expectedKey) {
    return !accum
      ? accum
      : areEqual(expectedVal, actual[expectedKey]);
  }

  return _.allKeys(expected).length === _.allKeys(actual).length
    ? _.reduce(expected, valEqualsActual, true)
    : false;
}

function arraysEqual(expected, actual) {
  function elementsEqual(pair) {
    return areEqual(pair[0], pair[1]);
  }
  return expected.length === actual.length
    ? _.chain(expected).zip(actual).all(elementsEqual).value()
    : false;
}
*/
function xOr(val1: boolean, val2: boolean) : boolean  {
  return (val1 || val2) && !(val1 && val2);
}

/*
export function setParts < T > (arLeftSet : Array < T >, arRightSet : Array < T >) {

  function intersect(ar1, ar2) {
    var inIntersection = [],
      uniqueToFirst = [];

    function isInar2(item) {
      function equalsTarg(ar2Item) {
        return areEqual(ar2Item, item);
      }
      return _.find(ar2, equalsTarg)
    }

    function clasify(ar1Item) {
      var pushTo = isInar2(ar1Item)
        ? inIntersection
        : uniqueToFirst;
      pushTo.push(ar1Item);
    }

    _.each(ar1, clasify);
    return [uniqueToFirst, inIntersection];
  }

  var leftCommon = intersect(arLeftSet, arRightSet),
    rightCommon = intersect(arRightSet, arLeftSet);

  return [leftCommon[0], leftCommon[1], rightCommon[0]];
}
*/

export function reorderProps(obj : {}, ...rest : Array < string >) : {} {
  return _.defaults(_.pick(obj, rest), obj);
}

export function fillArray<a>(arrayLength : number, val : a) : Array <a> {
  return _.times(arrayLength, _.constant(val));
}
