// @flow

import * as _ from 'lodash';
import { toString, startsWith } from '../lib/StringUtils';
import { objectsEqual, arraysEqual } from '../lib/SysUtilsNoFlow';

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

export function areEqual(expected: ?mixed, actual: ?mixed, useTolerance: boolean = true): boolean {
  return false;
  // var result;
  // if (!result) {
  //   if (xOr(hasValue(expected), hasValue(actual))) {
  //     result = false;
  //   } else if (expected === null && actual === null) {
  //     result = true;
  //   } else if (xOr(typeof expected === 'string', typeof actual === 'string')) {
  //     return toString(expected) === toString(actual);
  //   } else if (_.isArray(expected) && _.isArray(actual)) {
  //     return arraysEqual(expected, actual);
  //   } else if (_.isObject(expected) && _.isObject(actual)) {
  //     return objectsEqual(expected, actual);
  //   } else if (useTolerance && _.isNumber(expected) && _.isNumber(actual)) {
  //     return areEqualWithTolerance(expected, actual, 0)
  //   } else {
  //     var varType = GetVarType(actual);
  //     switch (varType) {
  //       case 7: // Date
  //         result = aqDateTime.Compare(expected, actual) === 0;
  //         break;
  //
  //       default:
  //         result = _.isEqual(expected, actual);
  //         break;
  //     }
  //   }
  //   return result;
  // }
}

function areEqualWithTolerance(expectedNumber: number | string, actualNumber: number | string, tolerance: number = 0){
  return false
  // var deemedEqual = areEqual(actualNumber, expectedNumber, false);
  //
  // function parseNumIfPossible(val){
  //   return !_.isNumber(val) && stringConvertableToNumber(val) ? parseFloat(val) : val;
  // }
  //
  // if (!deemedEqual){
  //   var expectedNumberConverted = parseNumIfPossible(expectedNumber),
  //       actualNumberConverted = parseNumIfPossible(actualNumber);
  //
  //   if (_.isNumber(actualNumberConverted) && _.isNumber(expectedNumberConverted)){
  //     var diff = Math.abs(actualNumberConverted - expectedNumberConverted);
  //     // 0.10 !== 0.10 in javascript :-( work around
  //     // deemedEqual = diff <= tolerance will not work
  //     deemedEqual = !(diff > (tolerance + 0.0000000000000001));
  //   }
  // }
  // return deemedEqual;
}
//
// export function stringConvertableToNumber(val: string): boolean{
//
//   function isNumChars(str){
//
//     function isDot(chr){
//       return chr === '.';
//     }
//
//     var chrs = str.split(('')),
//          dotCount = _.filter(chrs, isDot).length;
//
//     return dotCount > 1 || startsWith(str, '.') || endsWith(str, '.') || startsWith(str, '0') && !startsWith(str, '0.') && !(str === '0') ?
//                   false :
//                    _.chain(chrs)
//                       .reject(isCommaWhiteSpaceDot)
//                       .all(isIntChr)
//                       .value();
//   }
//
//   function isIntChr(chr){
//     var chCode = chr.charCodeAt(0);
//     return chCode > 47 && chCode < 58;
//   }
//
//   function isCommaWhiteSpaceDot(chr){
//     return _.contains([',', '\t', ' ', '.'], chr);
//   }
//
//   return hasValue(val) && isNumChars(val);
// }

export function xOr(val1: boolean, val2: boolean) : boolean  {
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
