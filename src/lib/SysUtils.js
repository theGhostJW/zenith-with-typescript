// @flow

import * as _ from 'lodash';
import {toString, startsWith, endsWith, appendDelim, wildCardMatch} from '../lib/StringUtils';


export function debug<T>(msg: T, label: string = 'DEBUG'): T {
  console.log(appendDelim(_.toUpper(label), ': ', toString(msg)));
  return msg;
}

export function def <T> (val : ?T, defaultVal: T): T {
    // != null === not null or undefined
  return val == null ? defaultVal : val;
}

export function areEqual <T, U> (val1 : T, val2 : U, reasonableTypeCoercian : boolean = false) : boolean {
  return _.isEqualWith(val1, val2, eqCustomiser);
}

export function fail(description: string) {
  throw new Error(description);
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

type MixedSpecifier = string | Predicate | IndexSpecifier | {};

type Predicate = (val : mixed, key : string | number) => bool;

type ArrayItemPredicate = (val : mixed) => bool;

type FuncSpecifier = (val : any, key : string | number) => any;

type IndexSpecifier = [number | ArrayItemPredicate];

type SeekInObjResultItem = {
  parent: SeekInObjResultItem | null,
  value: any,
  key: string | number,
  specifiers: Array <FuncSpecifier>
};

function standardiseSpecifier(mixedSpec: MixedSpecifier) : FuncSpecifier {

  // assume predicate
  if(typeof mixedSpec === 'function') {
    return function keyMatch(val : mixed, key : string | number) : any {
      return ((mixedSpec: any) : Predicate)(val, key) ? val : undefined;
    }
  }

  if (typeof mixedSpec == 'string' || typeof mixedSpec == 'number') {
    return function keyMatch(val : mixed, key : string | number) : any {
      return wildCardMatch(toString(key), toString(mixedSpec)) ? val : undefined;
    }
  }

  if (isPOJSO(mixedSpec)) {
    return function keyMatch(val : mixed, key : string | number) : any {
      if (isPOJSO(val)) {
        let specObj = ((mixedSpec: any): {}),
            valObj = ((val: any): {}),
            specKeys = _.keys(specObj),
            valKeys = _.keys(valObj);

        function matchesKeys(keys) {

          if (areEqual(keys, [])){
            return true;
          }
          else {
            let [specKey, ...otherSpecKeys] = keys,
                valKey = _.find(valKeys, (vk) => wildCardMatch(vk, specKey, true));

            if (valKey != null){
              let valPropVal = valObj[valKey],
                  specPropVal = specObj[specKey];

              return  _.isString(valPropVal) &&
                      _.isString(specPropVal) &&
                      wildCardMatch(valPropVal, specPropVal)  ||
                          areEqual(valPropVal, specPropVal);
            }
            else {
              return false;
            }
          }
        }
        return matchesKeys(specKeys) ? val : undefined;
      }
      else {
        return undefined;
      }
    }
  }

  // IndexSpecifier / or HOFIndex Specifier
  ensure(_.isArray(mixedSpec) && ((mixedSpec: any): Array<any>).length === 1, 'expect this to be a single item array: ' + toString(mixedSpec));

  let dummy = (val : mixed, key : string | number) => {return undefined},
      indexer : IndexSpecifier = ((mixedSpec : any) : IndexSpecifier),
      item = indexer[0],
      indexerSpec: FuncSpecifier = typeof item == 'function' ? (val: Array<any>) => { return _.find(val, ((item: any): ArrayItemPredicate)); } :
                                    typeof item == 'number' ? (val: Array<any>) => {
                                                                        let idx: number = ((item: any): number);
                                                                        return val.length > idx ? val[idx] : undefined;
                                                                      }  : dummy;

  ensure(indexerSpec !== dummy, 'array indexer must be a single element array of function or integer: [int] or [(val) => bool]');

  return function indexmatch(val : mixed, key : string | number): any {
    return _.isArray(val) ? indexerSpec(val, key) : undefined;
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

function matchFirstSpecifierOnTarget(parent: SeekInObjResultItem, allBranches : boolean) : ?GenerationMatchResult {
  let
    baseVal = parent.value,
    specifers = parent.specifiers,
    result = {
      fullyMatched: ([] : Array <SeekInObjResultItem>),
      remainingCandidates: ([] : Array <SeekInObjResultItem>)
    };

  if (specifers.length > 0 &&  typeof baseVal == 'object') {

    let
      base: ReducerResult = {
        done: false,
        result: result
      };

    function resultPartition(accum: ReducerResult, val: mixed, key: string | number) : ReducerResult {
      return partitionResults(parent, allBranches, accum, val, key);
    }

    return _.isArray(baseVal) ? resultPartition(base, parent.value, parent.key).result : _.reduce(parent.value, resultPartition, base).result;
  } else {
    return null;
  }
};

export function isPOJSO(val: mixed): boolean {
  return _.isObject(val) &&  !_.isArray(val);
}

function partitionResults(parent: SeekInObjResultItem, allBranches: boolean, accum: ReducerResult, val: mixed, key: string | number) : ReducerResult {
  if (accum.done)
    return accum;

  let
    specifiers = parent.specifiers,
    [specifier, ...otherSpecs] = specifiers,
    isLastSpecifier = otherSpecs.length === 0,
    done = false,
    result = accum.result,
    fullyMatched = result.fullyMatched,
    remainingCandidates = result.remainingCandidates,
    matchResult = specifier(val, key),
    matchesThisSpecifier = isDefined(matchResult),
    matchesAllSpecifiers = matchesThisSpecifier && isLastSpecifier;

    function newMatchInfo(val: mixed, key: string | number, specifiers: Array<FuncSpecifier>) : SeekInObjResultItem {
      return {parent: parent, value: val, key: key, specifiers: specifiers};
    };

  if (matchesAllSpecifiers) {
    fullyMatched.push(newMatchInfo(matchResult, key, otherSpecs));
    if (!allBranches){
      done = !allBranches;
    }
  }
  else if (matchesThisSpecifier) {
    remainingCandidates.push(newMatchInfo(matchResult, key, otherSpecs));
  }
  else if (isPOJSO(val)) {
    remainingCandidates.push(newMatchInfo(val, key, specifiers));
  }

  return {
    result: {
      fullyMatched: fullyMatched,
      remainingCandidates: remainingCandidates
    },
    done: done
  };
}

function getResultValues(result: Array <SeekInObjResultItem>): Array<mixed> {
  return result.map((s: SeekInObjResultItem) => s.value);
}

export function seekInObj(target :? {}, specifier: MixedSpecifier, ...otherSpecifiers : Array <MixedSpecifier>): ?mixed {
  let info = seekInObjWithInfo(target, specifier, ...otherSpecifiers);
  return info == null ? undefined : info.value;
}

export function setInObjn(target : {}, specifiers : Array <MixedSpecifier>, value: mixed): {}{
  return setInObjnPrivate(false, target, specifiers, value);
}

// export function cast<T>(val: any){
//   return ((val : any): T);
// }

function setInObjnPrivate(noCheck: boolean, target : {}, specifiers : Array <MixedSpecifier>, value: mixed) : {} {

  let [spec, ...otherSpecs] = specifiers,
      propInfo = noCheck ?  seekInObjNoCheckWithInfo(target, spec, ...otherSpecs) :  seekInObjWithInfo(target, spec, ...otherSpecs);

  if (propInfo == null){
    fail( 'setInObj matching property not found for specification: ' + _.map(specifiers, toString).join(', '));
  }
  else {
    let parent = propInfo.parent;
    if (parent == null){
      fail('parent is null - this should not happen');
    }
    else if (parent.value == null) {
      fail('parent is null - this should not happen');
    }
    else {
      parent.value[parent.key] = value;
    }
  }
  return target;
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
    return undefined;
  }
  else {
    ensure(allInfo.length === 1, 'More than one object matches supplied specifiers: ' + objectAddresses(allInfo));
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

    function pluckFlatten(baseArray, propName): Array <SeekInObjResultItem> {
      let result = _.chain(baseArray)
                          .map(propName)
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
        specifiers: allSpecifiers
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
