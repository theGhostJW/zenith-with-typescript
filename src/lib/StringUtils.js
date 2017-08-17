// @flow

import { def, debug, hasValue, ensure } from '../lib/SysUtils';
import S from 'string'
import * as _ from 'lodash'

export function trim(str: string): string {
  return _.trim(str);
}

const lut = Array(256).fill().map((_, i) => (i < 16 ? '0' : '') + (i).toString(16));
const formatUuid = ({d0, d1, d2, d3}) =>
  lut[d0       & 0xff]        + lut[d0 >>  8 & 0xff] + lut[d0 >> 16 & 0xff] + lut[d0 >> 24 & 0xff] + '-' +
  lut[d1       & 0xff]        + lut[d1 >>  8 & 0xff] + '-' +
  lut[d1 >> 16 & 0x0f | 0x40] + lut[d1 >> 24 & 0xff] + '-' +
  lut[d2       & 0x3f | 0x80] + lut[d2 >>  8 & 0xff] + '-' +
  lut[d2 >> 16 & 0xff]        + lut[d2 >> 24 & 0xff] +
  lut[d3       & 0xff]        + lut[d3 >>  8 & 0xff] +
  lut[d3 >> 16 & 0xff]        + lut[d3 >> 24 & 0xff];

const getRandomValuesFunc =
  () => ({
    d0: Math.random() * 0x100000000 >>> 0,
    d1: Math.random() * 0x100000000 >>> 0,
    d2: Math.random() * 0x100000000 >>> 0,
    d3: Math.random() * 0x100000000 >>> 0,
  });

function stringToTable<T : {}>(txt: string, rowTransformer: ({}) => T) : Array<T> | Array<Array<T>> {
  return stringToTableDefinedTabSize(txt, 2, rowTransformer);
}

function stringToTableDefinedTabSize<T : {}>(txt: string, spaceCountToTab: number = 2, rowTransformer: ({}) => T) : Array<Array<T>> {
  let lines = standardiseLineEndings(txt).split(newLine()),
      result : Array<Array<{}>> = linesToObjects(lines, '', spaceCountToTab),
      finalResult = result.map((row) => row.map(rowTransformer));

  return finalResult;
}

function linesToObjects(lines: Array<string>, errorInfo: string, spaceCountToTab: number) : Array<Array<{}>>  {
  let headAndLines = headerAndRemainingLines(lines, spaceCountToTab),
      header: Array<string> = headAndLines.header,
      groups: Array<Array<string>>  = headAndLines.groups,
      arrToObjs: (Array<string>) => Array<{}> = makeArrayToObjectsFunction(errorInfo, spaceCountToTab, header),
      result: Array<Array<{}>> = _.map(groups, arrToObjs);

   return result;
}

function makeArrayToObjectsFunction(errorInfo: string, spaceCountToTab: number, header: Array<string>): (Array<string>) => Array<{}> {
  return (lines: Array<string>): Array<{}> => {
    function makeObjs(accum: Array<{}>, fields: Array<string>, idx: number): Array<{}> {
      ensure(header.length === fields.length, errorInfo + ' row no: ' + idx +
                                            ' has incorrect number of elements expect: ' + header.length +
                                            ' actual is: ' + fields.length,
                                            'property names' +  newLine() +
                                            header.join(', ') +  newLine() +
                                            'fields' +  newLine() +
                                            fields.join(', ')
                                          );
      function addProp(accum, prpVal){
        accum[prpVal[0]] = prpVal[1];
        return accum;
      }

      function makeRecord(){
       return _.chain(header)
                .zip(fields)
                .reduce(addProp, {})
                .value();
      }
      accum.push(makeRecord());
      return accum;
    }

    return _.chain(lines)
              .map(makeSplitTrimFunction(spaceCountToTab))
              .reduce(makeObjs, [])
              .value();
  }
}

type HeaderAndLines = {
    header: Array<string>,
    groups: Array<Array<string>>
}

function headerAndRemainingLines(lines: Array<string>, spaceCountToTab: number){

  function pushGroup(accum){
    let newGroup = [];
    accum.groups.push(newGroup);
    accum.activeGroup = newGroup;
  }

  function filterLine(accum, line){

    if (accum.done){
      return accum;
    }

    if (accum.started){
      if (isGroupDivider(line)){
        pushGroup(accum);
      }
      else if (hasValue(trim(line))){
        accum.nullLineEncountered = false;
        accum.activeGroup.push(line);
      }
      else {
        // use double blank to signal done so can use blank lines for formatting
        if (accum.nullLineEncountered){
          accum.done = true;
          accum.nullLineEncountered = false;
        }
        else {
          accum.nullLineEncountered = true;
        }
      }
    }
    else if (isGroupDivider(line)){
      accum.started = true;
      accum.props = makeSplitTrimFunction(spaceCountToTab)(accum.lastLine);
      pushGroup(accum);
    }
    else {
      accum.lastLine = line;
    }
    return accum;
  }

  var propsAndLines = _.reduce(lines, filterLine, {
                                            groups: ([] : Array<Array<string>>),
                                            activeGroup: ((null: any): ?Array<string>),
                                            props: ([] : Array<string>),
                                            lastLine: '',
                                            started: false,
                                            done: false,
                                            nullLineEncountered: false
                                          });

  return {
      header: propsAndLines.props,
      groups: propsAndLines.groups
  };

}

function makeSplitTrimFunction(spaceCountToTab){
  function tabReplace(txt){
    return spaceCountToTab < 1 ? txt : replace(txt, ' '.repeat(spaceCountToTab), '\t');
  }

  function splitLine(line){
    return dedupeTabSpaces(line).split('\t');
  }

  function trimElements(elems){
    return _.map(elems, trim);
  }

  return function splitTrim(str){
    return _.flowRight(trimElements, splitLine, tabReplace)(str);
  }
}

function dedupeTabSpaces(str: string): string {
  let result = replaceWithTabs(str, '\t ');
  result = replaceWithTabs(result, '\t\t');
  return result;
}

function replaceWithTabs(str: string, strToReplace: string, lastLength: number = 0): string {
  str = replace(str, strToReplace, '\t');
  var len = str.length;
  return len === lastLength ? str : replaceWithTabs(str, strToReplace, len);
}

function isGroupDivider(line){
  return hasText(line, '----');
}



// unp to here
// export type =
//                  {
//                   txt: _.first(arArgs),
//                   spaceCountToTab: def(_.find(arArgs, _.isNumber), 2),
//                   wantAutoTyping: def(_.find(arArgs, _.isBoolean), true),
//                   postProcessFunctions: _.filter(arArgs, _.isObject),
//                   excludedFieldsN: _.chain(_.rest(arArgs))
//                                       .reject(_.isBoolean)
//                                       .reject(_.isNumber)
//                                       .reject(_.isObject)
//                                       .value()
//                   };
//
//     return result;
//   }

// from https://codepen.io/avesus/pen/wgQmaV?editors=0012
export const createGuid = () => formatUuid(getRandomValuesFunc());

export const createGuidTruncated = (length: number) => replace(createGuid(), '-', '').slice(0, length);

export function standardiseLineEndings(str: string): string {
  var result = replace(str, '\n\r', '\n');
  result = replace(result, '\r\n', '\n');
  result = replace(result, '\r', '\n');
  return result;
}

export function newLine(repeatCount: number = 1): string {
  return "\n".repeat(repeatCount);
}

export function lowerFirst(str: string): string {
  return str.length > 0 ? str.charAt(0).toLowerCase() + str.slice(1) : str;
}

export function upperFirst(str: string): string  {
  return str.length > 0 ? str.charAt(0).toUpperCase() + str.slice(1): str;
}

export const upperCase : string => string = (s) => s.toUpperCase();

export const lowerCase : string => string = (s) => s.toLowerCase();

export function appendDelim(str1: ?string, delim: string, str2: ?string){
   str1 = def(str1, "");
   delim = def(delim, "");
   str2 = def(str2, "");

   return (str1 === "" || str2 === "") ? str1 + str2 : str1 + delim + str2;
 };

export function replace(hayStack: string, needle: string, replacement: string, caseSensitive: boolean = false): string {
   // https://stackoverflow.com/questions/7313395/case-insensitive-replace-all

   let esc = needle.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'),
       reg = new RegExp(esc, (caseSensitive ? 'g' : 'ig'));
   return hayStack.replace(reg, replacement);
}

export function wildCardMatch(hayStack: ?string, needle: string, caseSensitive: boolean = false): boolean {
  // https://stackoverflow.com/questions/26246601/wildcard-string-comparison-in-javascript
  return hayStack == null ? false: new RegExp("^" + needle.split("*").join(".*") + "$", (caseSensitive ? undefined :'i')).test(hayStack);
}

export function toString<T>(val : T): string {
  if (val === null)
    return 'null';

  if (val === undefined)
    return 'undefined';

  switch (typeof val) {
    case 'object':
      return JSON.stringify(val);

    case 'boolean':
      return val ? 'true' : 'false';

    case 'number':
      return val.toString();

    case 'string':
        return val;

    case 'function':
      return val.toString();

    default:
      return `<<${typeof val}>>`;
  }
}

export function startsWith(str: ?string, preFix: string) : boolean {
  return str != null ? str.indexOf(preFix) === 0 : false;
}


export function endsWith(str: ?string, suffix: string) {
  return str != null ?  str.indexOf(suffix, str.length - suffix.length) !== -1 : false;
}

export function hasText(hayStack: ?string, needle: string, caseSensitive: boolean = false): boolean {
  return hayStack == null ? false :
                            caseSensitive ? hayStack.includes(needle) :
                                            hayStack.toLowerCase().includes(needle.toLowerCase()) ;
}
