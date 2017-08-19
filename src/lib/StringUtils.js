// @flow

import { def, debug, hasValue, ensure, autoType, objToYaml, ensureReturn } from '../lib/SysUtils';
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

export function transformGroupedTable<T>(unTypedTable: Array<Array<{[string]: any}>>, rowTransformer: RowTransformer<T>) : Array<Array<T>> {
  return unTypedTable.map((row) => row.map(rowTransformer));
}

function fieldToRowTransformer(fieldTransformer: FieldTransformer): ({[string]: any}) => {[string]: any} {
   return (obj) => _.mapValues(obj, fieldTransformer);
}

// export function stringToTableTyped(txt: string) : Array<{[string]: any}> {
//   let result: Array<Array<{[string]: any}>> = stringToGroupedTable(txt);
//   ensure(result.length < 2, 'loading nested rows with stringToTable - use stringToGroupedTable for such cases');
//   return result.length === 0 ? [] : result[0];
// }
//
// export const stringToGroupedTableTyped: <T>(txt: string) => Array<Array<{[string]: T}>> = _.flowRight(transformGroupedTable, stringToGroupedTableDefinedTabSize)(txt, 2);

// export function stringToGroupedTable<T : {}>(txt: string, rowTransformer: {[string]: any} => T, ...fieldTransformers: Array<FieldTransformer>) : Array<Array<T>> {
//   return stringToGroupedTableDefinedTabSize(txt, 2, ...fieldTransformers);
// }
//
// export export function stringToGroupedTableDefinedTabSize(txt: string, spaceCountToTab: number = 2, ...fieldTransformers: Array<FieldTransformer>) : Array<Array<{[string]: any}>>


export function stringToTable<T>(txt: string, rowTransformer: RowTransformer<T>, ...fieldTransformers: Array<FieldTransformer>) : Array<T> {
  let result = stringToGroupedTableLooseTyped(txt, ...fieldTransformers);
  result = transformGroupedTable(result, rowTransformer);
  return safeCheckedFirst(result);
}

export function stringToGroupedTableTypedDefinedTabSize<T>(txt: string, spaceCountToTab: number = 2, rowTransformer: RowTransformer<T>, ...fieldTransformers: Array<FieldTransformer>) : Array<Array<T>> {
  let result = stringToGroupedTableLooseTypedDefinedTabSize(txt, spaceCountToTab, ...fieldTransformers);
  return transformGroupedTable(result, rowTransformer);
}

type FieldTransformer = (val: any, key: string, obj: {[string]: any}) => any;
type RowTransformer<T> = {[string]: any} => T;


export function stringToTableLooseTyped(txt: string, ...fieldTransformers: Array<FieldTransformer>) : Array<{[string]: any}> {
  let result: Array<Array<{[string]: any}>> = stringToGroupedTableLooseTyped(txt, ...fieldTransformers);
  return safeCheckedFirst(result);
}

function safeCheckedFirst<T>(nested: Array<Array<T>>): Array<T> {
  ensure(nested.length < 2, 'loading nested rows with stringToTable - use stringToGroupedTable for such cases');
  return nested.length === 0 ? [] : nested[0];
}

export function stringToGroupedTableLooseTyped(txt: string, ...fieldTransformers: Array<FieldTransformer>) : Array<Array<{[string]: any}>> {
  return stringToGroupedTableLooseTypedDefinedTabSize(txt, 2, ...fieldTransformers);
}

export function stringToGroupedTableLooseTypedDefinedTabSize(txt: string, spaceCountToTab: number = 2, ...fieldTransformers: Array<FieldTransformer>) : Array<Array<{[string]: any}>> {
  let lines = standardiseLineEndings(txt).split(newLine()),
      result =  linesToGroupedObjects(lines, '', spaceCountToTab).map(autoType);

  return applyFieldTransformers(result, fieldTransformers);
}

function applyFieldTransformers(target: Array<Array<{[string]: any}>>, fieldTransformers: Array<FieldTransformer>): Array<Array<{[string]: any}>> {
  let rowTrans = fieldTransformers.map(fieldToRowTransformer);

  function transformRows(rows: Array<{[string]: any}>): Array<{[string]: any}> {
    return _.reduce(rowTrans, (accum, rowTrans) => accum.map(rowTrans), rows);
  }

  return target.map(transformRows);
}

function linesToGroupedObjects(lines: Array<string>, errorInfo: string, spaceCountToTab: number) : Array<Array<{[string]: any}>>  {
  let headAndLines = headerAndRemainingLines(lines, spaceCountToTab),
      header: Array<string> = headAndLines.header,
      groups: Array<Array<string>>  = headAndLines.groups,
      arrToObjs: (Array<string>) => Array<{[string]: any}> = makeArrayToObjectsFunction(errorInfo, spaceCountToTab, header),
      result: Array<Array<{[string]: any}>> = _.map(groups, arrToObjs);

   return result;
}

function makeArrayToObjectsFunction(errorInfo: string, spaceCountToTab: number, header: Array<string>): (Array<string>) => Array<{[string]: any}>  {
  return (lines: Array<string>): Array<{[string]: any}> => {
    function makeObjs(accum: Array<{}>, fields: Array<string>, idx: number): Array<{}> {
      ensureReturn(header.length === fields.length, errorInfo + ' row no: ' + idx +
                                            ' has incorrect number of elements expect: ' + header.length +
                                            ' actual is: ' + fields.length,
                                            'property names' +  newLine() +
                                            header.join(', ') +  newLine() +
                                            'fields' +  newLine() +
                                            fields.join(', ')
                                          );
      function addProp(accum: {[string]: any} , prpVal: [string, string]): {[string]: any} {
        accum[prpVal[0]] = prpVal[1];
        return accum;
      }

      function makeRecord(){
       return _.chain(header)
                .zip(fields)
                .reduce(addProp, ({}: {[string]: any}) )
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
      return objToYaml(val);

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
