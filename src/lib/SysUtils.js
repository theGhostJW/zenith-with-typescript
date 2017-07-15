// @flow

import * as _ from 'lodash';
import {toString, startsWith, endsWith, appendDelim, wildCardMatch} from '../lib/StringUtils';

export const ARRAY_QUERY_ITEM_LABEL = '[Array Query Item]';

export function debug<T>(msg: T, label: ?string): T {
  console.log(appendDelim(label, ': ', toString(msg)));
  return msg;
}

export function def <T> (val : ?T, defaultVal: T): T {
    // != null === not null or undefined
  return val == null ? defaultVal : val;
}

export function areEqual <T, U> (val1 : T, val2 : U, reasonableTypeCoercian : boolean = false) : boolean {
  return _.isEqualWith(val1, val2, eqCustomiser);
}

export function ensure(val : boolean, msg : string = '') : void {
  if(!val) {
    throw new Error('ensure failure - ' + msg);
  }
}

function eqCustomiser <T, U> (val1 : T, val2 : U) : void | boolean {
  return typeof val1 == 'string' && typeof val2 == 'string'
    ? val1.valueOf() == val2.valueOf()
    : undefined;
}

type MixedSpecifier = string | FuncSpecifier | IndexSpecifier;

type FuncSpecifier = (val : mixed, key : string | number) => any;

type IndexSpecifier = [number];

type SeekInObjResultItem = {
  parent: SeekInObjResultItem | null,
  value: any,
  key: string | number,
  remainingSpecifiers: Array <FuncSpecifier>
};

function standardiseSpecifier(mixedSpec : MixedSpecifier) : FuncSpecifier {
  if(typeof mixedSpec === 'function') {
    return mixedSpec;
  }

  if (typeof mixedSpec == 'string' || typeof mixedSpec == 'number') {
    return function keyMatch(val : mixed, key : string | number) : any {
      return wildCardMatch(toString(key), toString(mixedSpec)) ? val : undefined;
    }
  }

  // IndexSpecifier
  ensure(_.isArray(mixedSpec), 'expect this to be an array: ' + toString(mixedSpec));

  return function indexmatch(val : mixed, key : string | number): any {

    let indexer: IndexSpecifier = ((mixedSpec : any) : IndexSpecifier);
    return val != null && _.isArray(val) && (indexer[0] < ((val: any) : Array <any>).length)
      ? ((val : any): Array < any >)[indexer[0]]
      : undefined;
  }
}

type GenerationMatchResult = {
  fullyMatched: Array <SeekInObjResultItem>,
  remainingCandidates: Array <SeekInObjResultItem>
};

type ReducerResult = {
    done: boolean,
    result: GenerationMatchResult
};

function matchFirstSpecifierOnTarget(baseResult : SeekInObjResultItem, allBranches : boolean) : ?GenerationMatchResult {

  ensure(typeof baseResult.value == 'object', 'baseResult.value be an object')

  let
    baseVal = baseResult.value,
    specifers = baseResult.remainingSpecifiers,
    result = {
      fullyMatched: ([] : Array <SeekInObjResultItem>),
      remainingCandidates: ([] : Array <SeekInObjResultItem>)
    };

  if (specifers.length > 0 && !_.isArray(baseVal) && typeof baseVal == 'object') {

    let [specifier, ...otherSpecs] = specifers,
      isLastSpecifier = otherSpecs.length === 0;

    function matchedResult(val : mixed, key : string | number) : SeekInObjResultItem {
      return {parent: baseResult, value: val, key: key, remainingSpecifiers: otherSpecs};
    };

    function unMatchedResult(val : mixed, key : string | number) : SeekInObjResultItem {
      return {parent: baseResult, value: val, key: key, remainingSpecifiers: specifers};
    };

    let base: ReducerResult = {
      done: false,
      result: result
    };

    function partitionResults(accum, val: mixed, key: string | number) : ReducerResult {
      if (accum.done)
        return accum;

      let done = false,
        result = accum.result,
        fullyMatched = result.fullyMatched,
        remainingCandidates = result.remainingCandidates,
        matchResult = specifier(val, key),
        matchesThisSpecifier = isDefined(matchResult),
        matchesAllSpecifiers = matchesThisSpecifier && isLastSpecifier;

      if (matchesAllSpecifiers) {
        fullyMatched.push(matchedResult(matchResult, key));
        if (!allBranches){
          done = !allBranches;
        }
      }
      else if (matchesThisSpecifier) {
        remainingCandidates.push(matchedResult(matchResult, key));
      }
      else if (typeof val == 'object') {
        remainingCandidates.push(unMatchedResult(val, key));
      }

      return {
        result: {
          fullyMatched: fullyMatched,
          remainingCandidates: remainingCandidates
        },
        done: done
      };
    }

    return _.isArray(baseVal) ? partitionResults(base, baseResult.value, baseResult.key).result : _.reduce(baseResult.value, partitionResults, base).result;
  } else {
    return null;
  }
};

function getResultValues(result: Array <SeekInObjResultItem>): Array<mixed> {
  return result.map((s) => s.value);
}

export function seekInObj(target :? {}, specifier: MixedSpecifier, ...otherSpecifiers : Array <MixedSpecifier>): ?mixed {
  let info = seekInObjWithInfo(target, specifier, ...otherSpecifiers);
  return info == null ? undefined : all[0];
}

export function seekInObjNoCheck(target :? {}, specifier: MixedSpecifier, ...otherSpecifiers : Array <MixedSpecifier>): ?mixed {
  let result = seekInObjNoCheckWithInfo(target, specifier, ...otherSpecifiers);
  return result == null ? undefined : result.value;
}

export function seekAllInObj(target :? {}, specifier: MixedSpecifier, ...otherSpecifiers : Array <MixedSpecifier>): Array <mixed> {
  return getResultValues((seekAllInObjWithInfo(target, specifier, ...otherSpecifiers)));
}

function addressOfSeekResult(seekResult: SeekInObjResultItem) : string {
  let strKey = toString(seekResult.key);
  return strKey === '' || seekResult.parent == null ? strKey :
      appendDelim(addressOfSeekResult(seekResult.parent), '.', strKey);
}

function objectAddresses(allInfo: Array <SeekInObjResultItem>): string {
  return allInfo.map(addressOfSeekResult).join(', ');
}

export function seekInObjWithInfo(target :? {}, specifier: MixedSpecifier, ...otherSpecifiers : Array <MixedSpecifier>): ?SeekInObjResultItem {
  let allInfo = seekAllInObjWithInfo(target, specifier, ...otherSpecifiers);
  if (allInfo.length === 0){
    return null;
  }
  else {
    ensure(allInfo.length > 1, 'More than one object matches supplied specifiers: ' + objectAddresses(allInfo));
    return allInfo[0];
  }
}

export function seekInObjNoCheckWithInfo(target :? {}, specifier: MixedSpecifier, ...otherSpecifiers : Array <MixedSpecifier>): ?SeekInObjResultItem {
  let allInfo = seekInObjBase(target, false, specifier, ...otherSpecifiers);
  return allInfo.length === 0 ? null : allInfo[0];
}

export function seekAllInObjWithInfo(target :? {}, specifier: MixedSpecifier, ...otherSpecifiers : Array <MixedSpecifier>): Array<SeekInObjResultItem> {
  return seekInObjBase(target, true, specifier, ...otherSpecifiers);
}

function seekInObjBase(target :? {}, allBranches : boolean, specifier: MixedSpecifier, ...otherSpecifiers : Array <MixedSpecifier>): Array<SeekInObjResultItem> {
    if(typeof target != 'object') {
      return [];
    };

    function getNextGeneration(itemResult : SeekInObjResultItem): ?GenerationMatchResult {
      return matchFirstSpecifierOnTarget(itemResult, allBranches);
    };

    function pluckFlatten(baseArray, propPame): Array <SeekInObjResultItem> {
      let result = _.chain(baseArray)
                          .map(propPame)
                          .flatten()
                          .value();
      return ((result: any): Array <SeekInObjResultItem>);
    }

    function widthSearch(generationResult : GenerationMatchResult): Array <SeekInObjResultItem> {
        let
          thisRemaining = _.chain(generationResult.remainingCandidates)
                              .map(getNextGeneration)
                              .compact()
                              .value(),

          remainingCandidates = pluckFlatten(thisRemaining, 'remainingCandidates'),
          fullyMatched  = pluckFlatten(thisRemaining, 'fullyMatched');

        fullyMatched = generationResult.fullyMatched.concat(fullyMatched);

        if (remainingCandidates.length > 0 && (allBranches || fullyMatched.length === 0)){
          let
            nextParam = {
             fullyMatched: fullyMatched,
             remainingCandidates: remainingCandidates,
             done: false
           };
           return widthSearch(nextParam);
         }
         else {
           return fullyMatched;
         }
    };

    let
      allSpecifiers = [specifier].concat(otherSpecifiers).map(standardiseSpecifier),
      seedResultItem: SeekInObjResultItem = {
        parent: null,
        value: target,
        key: '',
        remainingSpecifiers: allSpecifiers
      },
      seedResult: GenerationMatchResult = {
        fullyMatched: [],
        remainingCandidates: [seedResultItem],
        done: false
      };

    return widthSearch(seedResult);
};

export function isNullEmptyOrUndefined(arg : mixed): boolean {
  return !(arg != null) || arg === '';
}

export function isDefined(arg : mixed): boolean {
  return typeof arg !== 'undefined';
}

export function isUndefined(arg : mixed): boolean {
  return !isDefined(arg);
}

export function hasValue(arg : mixed): boolean {

  function notFalseVal(key : string): boolean {
    if(arg != null && typeof arg === 'object') {
      let val : mixed = arg[key];
      if (val != null) {
        return (typeof val === 'boolean') && val;
      } else {
        return true;
      }
    } else {
      return true;
    };
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
  export function all < a > (predicate : (a) => boolean, arr : Array < a >): boolean {
    return arr.reduce((accum, item) => accum && predicate(item), true);
  }

export function stringConvertableToNumber(val: ?string): boolean {

  if(val == null)
    return false;

  function isNumChars(str) {

    function isDot(chr) {
      return chr === '.';
    }

    let chrs = str.split(('')),
      dotCount = _.filter(chrs, isDot).length,
      allInts = (str : string) => {
        return all(isIntChr, _.reject(chrs, isCommaWhiteSpaceDot));
      };

    return dotCount > 1 || startsWith(str, '.') || endsWith(str, '.') || startsWith(str, '0') && !startsWith(str, '0.') && !(str === '0')
      ? false
      : allInts(str);
  }

  function isIntChr(chr : string): boolean {
    var chCode = chr.charCodeAt(0);
    return chCode > 47 && chCode < 58;
  }

  function isCommaWhiteSpaceDot(chr : string): boolean {
    return [',', '\t', ' ', '.'].includes(chr);
  }

  return hasValue(val) && isNumChars(val);
}

export function xOr(val1 : boolean, val2 : boolean): boolean {
  return(val1 || val2) && !(val1 && val2);
}

export function areEqualWithTolerance(expectedNumber : number | string, actualNumber : number | string, tolerance : number = 0) {
  let deemedEqual = _.isEqual(actualNumber, expectedNumber);

  function parseNumIfPossible(val : number | string) :
    ? number {
      return typeof val === 'string'
        ? stringConvertableToNumber(val) ? parseFloat(val) : null
          : (typeof val === 'number'  ? val : null);
    };

  if (!deemedEqual) {
    let expectedNumberConverted = parseNumIfPossible(expectedNumber),
      actualNumberConverted = parseNumIfPossible(actualNumber);

    if (expectedNumberConverted != null && actualNumberConverted != null) {
      var diff = Math.abs(actualNumberConverted - expectedNumberConverted);
      // 0.10 !== 0.10 in javascript :-( work around
      // deemedEqual = diff <= tolerance will not work
      deemedEqual = !(diff > (tolerance + 0.0000000000000001));
    };
  }
  return deemedEqual;
}

export function reorderProps(obj : {}, ...rest : Array < string >): {} {
  return _.defaults(_.pick(obj, rest), obj);
}

export function fillArray <a> (arrayLength : number, val : a): Array <a> {
  return _.times(arrayLength, _.constant(val));
}
