// @flow

import * as _ from 'lodash'
import {flow, reject} from 'lodash/fp'
import { toString, startsWith, endsWith } from '../lib/StringUtils'

export const ARRAY_QUERY_ITEM_LABEL = '[Array Query Item]';


type MixedSpecifier = string | FuncSpecifier;

type FuncSpecifier = (val: mixed, key: string) => boolean;

type SeekInObjectFullParams = {
  wantAll: boolean,
  wantSafe: boolean,
  target: {},
  specifier: MixedSpecifier,
  otherSpecifiers: FuncSpecifier
};

function seekInObjFullInfoInfoBase<a>(params: SeekInObjectFullParams): Array<a> {

  let allSpecifiers = [params.specifier].concat(params.otherSpecifiers);
  // var params =  unPackSeekInObjTrailingArgs(arguments),
  //               returnFullInfo = params.returnFullInfo,
  //               wantAll = params.wantAll,
  //               propSpecifiers = params.propSpecifiers;
  //
  // if (wantAll && propSpecifiers.length > 1){
  //   var privArgs = _.flatten([
  //                             [target],
  //                             _.initial(propSpecifiers),
  //                             [false, false]],
  //                             true // shallow
  //                             ),
  //   target = seekInObjPriv.apply(null, privArgs);
  //   propSpecifiers = [_.last(propSpecifiers)];
  // }
  //
  // var result = seekInObjBase(target, propSpecifiers, returnFullInfo, wantAll);
  //
  // function valueToValues(result){
  //   result.values = result.value;
  //   result = _.omit(result, 'value');
  //   return reorderProps(result, 'parent', 'values');
  // }
  //
  // return (wantAll && isUndefined(result)) ? [] :
  //                                 wantAll && returnFullInfo ? _.map(result, valueToValues) : result;

  return [];
}


// function unifyObjectSpecifiers(arMixed: Array<MixedSpecifier>): Array<FuncSpecifier> {
//   function forceFunc(mixed: MixedSpecifier): FuncSpecifier {
//     typeof mixed === 'function' ? mixed : (val, key) => hasText
//   }
//
// }

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

// flow issues with lodash
export function all<a>(predicate: (a) => boolean, arr: Array<a>): boolean {
  return arr.reduce((accum, item) => accum && predicate(item), true);
}

export function stringConvertableToNumber(val: ?string): boolean {

  if (val == null)
    return false;

  function isNumChars(str){

    function isDot(chr){
      return chr === '.';
    }

    let chrs = str.split(('')),
        dotCount = _.filter(chrs, isDot).length,
        allInts = (str: string) => {return all(isIntChr, _.reject(chrs, isCommaWhiteSpaceDot)); };

    return dotCount > 1 || startsWith(str, '.') || endsWith(str, '.') || startsWith(str, '0') && !startsWith(str, '0.') && !(str === '0') ?
                  false : allInts(str);
  }

  function isIntChr(chr: string) : boolean {
    var chCode = chr.charCodeAt(0);
    return chCode > 47 && chCode < 58;
  }

  function isCommaWhiteSpaceDot(chr: string): boolean{
    return [',', '\t', ' ', '.'].includes(chr);
  }

  return hasValue(val) && isNumChars(val);
}

export function xOr(val1: boolean, val2: boolean) : boolean  {
  return (val1 || val2) && !(val1 && val2);
}

export function areEqualWithTolerance(expectedNumber: number | string, actualNumber: number | string, tolerance: number = 0){
  let deemedEqual = _.isEqual(actualNumber, expectedNumber);

  function parseNumIfPossible(val: number | string) : ?number {
    return typeof val === 'string' ?
                      stringConvertableToNumber(val) ? parseFloat(val) : null :
                          (typeof val === 'number' ? val : null);
  }

  if (!deemedEqual){
    let  expectedNumberConverted = parseNumIfPossible(expectedNumber),
         actualNumberConverted = parseNumIfPossible(actualNumber);

    if (expectedNumberConverted != null && actualNumberConverted != null){
      var diff = Math.abs(actualNumberConverted - expectedNumberConverted);
      // 0.10 !== 0.10 in javascript :-( work around
      // deemedEqual = diff <= tolerance will not work
      deemedEqual = !(diff > (tolerance + 0.0000000000000001));
    }
   }
  return deemedEqual;
 }

export function reorderProps(obj : {}, ...rest : Array < string >) : {} {
  return _.defaults(_.pick(obj, rest), obj);
}

export function fillArray<a>(arrayLength : number, val : a) : Array <a> {
  return _.times(arrayLength, _.constant(val));
}
