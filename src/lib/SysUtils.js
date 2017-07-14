// @flow

import * as _ from 'lodash';
import {toString, startsWith, endsWith} from '../lib/StringUtils';

export const ARRAY_QUERY_ITEM_LABEL = '[Array Query Item]';

export function areEqual <T, U> (val1 : T, val2 : U, reasonableTypeCoercian : boolean = false) : boolean {
  return _.isEqualWith(val1, val2, eqCustomiser);
}

export function ensure(val : boolean, msg : string = '') : void {
  if(!val) {
    throw new Error('chk failure ' + msg);
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

  if (typeof mixedSpec === 'string' || typeof mixedSpec === 'number') {
    return function keyMatch(val : mixed, key : string | number) : any {
      return areEqual(mixedSpec, key)
        ? val
        : undefined;
    }
  }

  // IndexSpecifier
  return function indexmatch(val : mixed, key : string | number): any {
    ensure(typeof val === 'Array', 'expect this to be an array');
    let indexer: IndexSpecifier = ((mixedSpec : any) : IndexSpecifier);
    return val != null && val.constructor == Array && (indexer[0] < ((val : any) : Array < any >).length)
      ? ((val : any): Array < any >)[indexer[0]]
      : undefined;
  }
}

type GenerationMatchResult = {
  fullyMatched: Array <SeekInObjResultItem>,
  remainingCandidates: Array <SeekInObjResultItem>,
  done: boolean
};

function matchFirstSpecifierOnTarget(baseResult : SeekInObjResultItem, allBranches : boolean) : GenerationMatchResult {

  ensure(typeof baseResult.value != 'object', 'baseResult.value be an object')

  let
    baseVal = baseResult.value,
    specifers = baseResult.remainingSpecifiers,
    result = {
      fullyMatched: ([] : Array <SeekInObjResultItem>),
      remainingCandidates: ([] : Array <SeekInObjResultItem>)
    },

    base = {
      done: false,
      result: result
    };

  if (specifers.length > 0 && !_.isArray(baseVal) && typeof baseVal == 'object') {

    let [specifier, ...otherSpecs] = baseResult.remainingSpecifiers,
      isLastSpecifier = otherSpecs.length === 0;

    function matchedResult(val : mixed, key : string | number) : SeekInObjResultItem {
      return {parent: baseResult, value: val, key: key, remainingSpecifiers: otherSpecs};
    };

    function unMatchedResult(val : mixed, key : string | number) : SeekInObjResultItem {
      return {parent: baseResult, value: val, key: key, remainingSpecifiers: otherSpecs};
    };

    function partitionResults(accum, val : mixed, key : string) {
      if (accum.done)
        return accum;

      let done = false,
        result = accum.result,
        fullyMatched = result.fullyMatched,
        remainingCandidates = result.remainingCandidates,
        matchResult = specifier(val, key);

      if (isDefined(matchResult)) {
        fullyMatched.push(matchedResult(val, key));
        done = !allBranches && isLastSpecifier;
      } else if (typeof val == 'object') {
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

    return _.reduce(baseResult.value, partitionResults, base).result;
  } else {


  }
}


function seekInObjBase(target :? {}, specifiers : Array <FuncSpecifier>, allBranches : boolean): Array<SeekInObjResultItem> {
    if(typeof target != 'object') {
      return [];
    };

    function getNextGeneration(itemResult : SeekInObjResultItem): GenerationMatchResult {
      return matchFirstSpecifierOnTarget(itemResult, allBranches);
    };

    function widthSearch(generationResult : GenerationMatchResult): Array <GenerationMatchResult> {
        let thisRemaining = _.map(generationResult.remainingCandidates, getNextGeneration),

            remainingItems = _.chain(thisRemaining)
                              .pluck('remainingCandidates')
                              .flatten()
                              .value(),

            fullyMatched = _.chain(thisRemaining)
                            .pluck('fullyMatched')
                            .flatten()
                            .value();

         fullyMatched = generationResult.fullyMatched.concat(fullyMatched);

         if (remainingItems.length > 0 && (allBranches || fullyMatched.length === 0)){
           let nextParam = {
             fullyMatched: fullyMatched,
             remainingCandidates: remainingItems,
             done: false
           };
           return widthSearch(nextParam);
         }
         else {
           return fullyMatched;
         }
    };

    let seedResultItem: SeekInObjResultItem = {
        parent: null,
        value: target,
        key: '',
        remainingSpecifiers: specifiers
    },
    seedResult: GenerationMatchResult = {
      fullyMatched: [],
      remainingCandidates: [seedResultItem],
      done: false
    };

    return widthSearch(seedResult).fullyMatched;
  }
}


export function def < a > (val :
    ? a, defaultVal : a): a {
    // != null === not null or undefined
    if(val != null) {
      return val;
    } else {
      return defaultVal;
    }
  }

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
  export function all < a > (predicate : (a) => boolean, arr : Array < a >): boolean {
    return arr.reduce((accum, item) => accum && predicate(item), true);
  }

  export function stringConvertableToNumber(val :
    ? string): boolean {

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
          ? stringConvertableToNumber(val)
            ? parseFloat(val)
            : null : (typeof val === 'number'
              ? val
              : null);
      }

    if (!deemedEqual) {
      let expectedNumberConverted = parseNumIfPossible(expectedNumber),
        actualNumberConverted = parseNumIfPossible(actualNumber);

      if (expectedNumberConverted != null && actualNumberConverted != null) {
        var diff = Math.abs(actualNumberConverted - expectedNumberConverted);
        // 0.10 !== 0.10 in javascript :-( work around
        // deemedEqual = diff <= tolerance will not work
        deemedEqual = !(diff > (tolerance + 0.0000000000000001));
      }
    }
    return deemedEqual;
  }

  export function reorderProps(obj : {}, ...rest : Array < string >): {}
  {
    return _.defaults(_.pick(obj, rest), obj);
  }

  export function fillArray < a > (arrayLength : number, val : a): Array < a > {
    return _.times(arrayLength, _.constant(val));
  }
