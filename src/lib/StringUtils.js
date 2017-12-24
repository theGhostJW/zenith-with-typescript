// @flow

import { def, debug, hasValue, ensure, autoType, objToYaml, ensureReturn, areEqual,
          cast } from '../lib/SysUtils';
import { toTemp } from '../lib/FileUtils';
import S from 'string';
import * as _ from 'lodash';
import parseCsvSync from 'csv-parse/lib/sync';
import { timeToSQLDateTimeSec } from '../lib/DateTimeUtils';

// converts simple xml - one field per line
// tags closed to mostched template
export function convertXmlToSimpleTemplate(xml: string){
  var lines = standardiseLineEndings(xml).split(newLine());

  function makeTemplateLineIfSimple(str){
    let tagName = subStrBetween(str, '<','>'),
        result = str;

    if (hasValue(tagName) && hasText(str, '</' + tagName)) {
      let propName = lowerFirst(replace(tagName, ' ', '')),
          prefix = subStrBefore(str, '>') + '>',
          suffix = '</' + subStrAfter(str, '</');
      result = prefix + '{{' + propName + '}}' + suffix;
    }

    return result;
  }

  return lines.map(makeTemplateLineIfSimple).join(newLine());
}


function transformSection(dataObj: {}, transformerFunc: (string, {}) => string, transformedTemplate: string, unTransformedTemplate: string, sectionName: string){
  let parts = templateSectionParts(unTransformedTemplate, sectionName),
      transformedSection = transformerFunc(parts.section, dataObj);

  return {
        transformedTemplate: transformedTemplate + parts.prefix + transformedSection,
        unTransformedTemplate: parts.suffix
      };
}

export function loadSectionedTemplate(template: string, transformers: {[string]: (string, {}) => string}, data: {}): string {


    function applyTransformer(accum, transformerFunc: (string, {}) => string, sectionName: string){
      return transformSection(data[sectionName],
                                      transformerFunc,
                                      accum.transformedTemplate,
                                      accum.unTransformedTemplate,
                                      sectionName
                                      );
    }

    let transformed = _.reduce(transformers, applyTransformer, {
                                                                   transformedTemplate: '',
                                                                   unTransformedTemplate: template
                                                                  });

    return transformed.transformedTemplate + transformed.unTransformedTemplate;
}


function standardStartEndSectionedTemplateTags(sectionName: string){
  return {
    recordStart: '<!-- ' + sectionName +' -->',
    recordFinish: '<!-- end ' + sectionName + ' -->'
  }
}

export function removeSection(template: string, sectionName: string){
  let parts = templateSectionParts(template, sectionName);
  return parts.prefix + parts.suffix;
}

export const templateSectionParts = (template: string, sectionName: string) =>
                  templateParts(template, '<!-- ' + sectionName +' -->', '<!-- end ' + sectionName + ' -->');

export function templateParts(template: string, recordStart: string, recordFinish: string){

  ensure(hasText(template, recordStart),
    'Cannot find section start in template: "' + recordStart + '"'+
      newLine() + 'looking in template remaining: '
      + template + newLine(2)
      + 'NOTE PROPERTIES OF THE TRANSFORMERS OBJECT MUST BE LISTED IN THE SAME ORDER AS THEY APPEAR IN THE TEMPLATE');

  let prefixTarget = bisect(template, recordStart),
      prefix = prefixTarget[0],
      target = prefixTarget[1];

  ensure(hasText(target, recordFinish, true),
                'Cannot find section end in template (case sensitive): ' +  newLine() + recordFinish  +
                newLine() + 'looking in template remaining: ' + newLine() +
                + target);

  let targetRemainder = bisect(target, recordFinish),
      remainder = targetRemainder[1],
      finalTarget = targetRemainder[0];

  return {
          prefix: prefix,
          section: finalTarget,
          suffix: remainder
         };
}

export function templateLoader(templateString: string): {} => string {
  _.templateSettings.interpolate = /{{([\s\S]+?)}}/g;
  return _.template(templateString);
}

export function loadTemplate(templateString: string, data: {}): string {
  return templateLoader(templateString)(data);
}


export function loadTemplatePositional(templateString: string, ...data: any): string {
  // note lodays does not work with numeric keys so can't use lodash templating for this
  function applyKey(accum, val, idx) {
    let tag = '{{' + toString(idx) + '}}'
    return replace(accum, tag, toString(val))
  }
  return data.reduce(applyKey, templateString);
}

export function trimLines(str: string) {
  return standardiseLineEndings(str).split(newLine()).map(s => s.trim()).join(newLine());
}


export function sameText(str1: string, str2: string, caseSensitive: boolean = false) {
  return caseSensitive ? areEqual(str1, str2) : areEqual(str1.toLowerCase(), str2.toLowerCase());
}

export function subStrBetween(haystack: string, startDelim: string, endDelim: string, trim: boolean = true): string {
  let result = subStrAfter(haystack, startDelim);
  result = subStrBefore(result, endDelim);
  return trim ? result.trim() : result;
}

export function trimChars(str: string, arChars: Array<string>): string {
  ensure(!arChars.includes(''), 'Empty string passed in to trimChars char array (param: arChars) - you cannot trim an empty string');

  const inTrim = (char) => arChars.includes(char);

  while (inTrim(str.substr(0, 1))){
    str = str.substr(1);
  }

  let result = '',
      trimFinished = false;

  for (var counter = str.length - 1; counter > -1; counter--) {
    var thisChar = str.charAt(counter);
    if (trimFinished || !inTrim(thisChar)){
      result = thisChar + result;
      trimFinished = true;
    }
  }
  return result;
}

export const parseCsv = (text: string, options: {[string]: string | boolean} = DEFAULT_CSV_PARSE_OPTIONS, wantAutoType: boolean = true): Array<{[string]: string}> => {
  let result = parseCsvSync(text, options);
  return wantAutoType ? autoType(result) : result;
}

export const DEFAULT_CSV_PARSE_OPTIONS = {
                                          comment: '#',
                                          skip_empty_lines: true,
                                          skip_lines_with_empty_values: true,
                                          trim: true,
                                          columns: true
                                        };

export const stringToArray = (str: string): Array<string> => str.split(newLine());
export const arrayToString = (ar: Array<string>): string => ar.join(newLine());

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


type FieldTransformer = (val: any, key: string, obj: {[string]: any}) => any;
type RowTransformer<T> = {[string]: any} => T;

export function transformGroupedTable<T>(unTypedTable: Array<Array<{[string]: any}>>, rowTransformer: RowTransformer<T>) : Array<Array<T>> {
  return unTypedTable.map((row) => row.map(rowTransformer));
}

function fieldToRowTransformer(fieldTransformer: FieldTransformer): ({[string]: any}) => {[string]: any} {
  return (obj) => _.mapValues(obj, fieldTransformer);
}

export function stringToTableMap<T>(txt: string, rowTransformer: RowTransformer<T>, ...fieldTransformers: Array<FieldTransformer>) : {[string]: Array<T>} {
  var sections = splitOnPropName(txt);
  return _.mapValues(sections, (txt) => stringToTable(txt, rowTransformer, ...fieldTransformers));
}

export function stringToGroupedTableMap<T>(txt: string, rowTransformer: RowTransformer<T>, ...fieldTransformers: Array<FieldTransformer>) : {[string]: Array<Array<T>>} {
  var sections = splitOnPropName(txt);
  return _.mapValues(sections, (txt) => stringToGroupedTable(txt, rowTransformer, ...fieldTransformers));
}


export function stringToTable<T>(txt: string, rowTransformer: RowTransformer<T>, ...fieldTransformers: Array<FieldTransformer>) : Array<T> {
  let result = stringToGroupedTableLooseTyped(txt, ...fieldTransformers);
  result = transformGroupedTable(result, rowTransformer);
  return safeCheckedFirst(result);
}

export function stringToGroupedTableDefinedTabSize<T>(txt: string, spaceCountToTab: number = 2, rowTransformer: RowTransformer<T>, ...fieldTransformers: Array<FieldTransformer>) : Array<Array<T>> {
  let result = stringToGroupedTableLooseTypedDefinedTabSize(txt, spaceCountToTab, ...fieldTransformers);
  return transformGroupedTable(result, rowTransformer);
}

export function stringToGroupedTable<T>(txt: string, rowTransformer: RowTransformer<T>, ...fieldTransformers: Array<FieldTransformer>) : Array<Array<T>> {
  return stringToGroupedTableDefinedTabSize(txt, 2, rowTransformer, ...fieldTransformers);
}

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

const stdLinesAndSplit = (str: string) => standardiseLineEndings(str).split(newLine());

export function stringToGroupedTableLooseTypedDefinedTabSize(txt: string, spaceCountToTab: number = 2, ...fieldTransformers: Array<FieldTransformer>) : Array<Array<{[string]: any}>> {
  let lines = stdLinesAndSplit(txt),
      result = linesToGroupedObjects(lines, '', spaceCountToTab).map(autoType);

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
      groups: Array<Array<string>> = headAndLines.groups,
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

// splits a string on the first delimiter returns two parts
// EXCLUDING the delimiter
export function bisect(strSource: string, delim: string): [string, string] {
  let delimLength = delim.length,
      pos = strSource.indexOf(delim),
      srcLength = strSource.length,
      before,
      after;

  if (pos < 0){
    before = strSource;
    after = "";
  }
  else {
    before = strSource.slice(0, pos);
    after = (pos < srcLength - delimLength) ?
              strSource.slice(pos + delimLength):
              "";
  }

  return [before, after]
}

export function subStrBefore(strSource: string, delim: string): string {
  var pos = strSource.indexOf(delim);
  return (pos < 0) ? '' : bisect(strSource, delim)[0];
}

export function subStrAfter(strSource: string, delim: string){
  var result = bisect(strSource, delim);
  return result[1];
}

export function capFirst(str: string): string {
  return hasValue(str) ? str.charAt(0).toUpperCase() + str.slice(1): str;
}

function splitOnPropName(txt: string) : {[string]: string}{

  let lines = stdLinesAndSplit(txt);

  function buildSection(accum, line){
    if (hasText(line, '::')){
      var prop = subStrBefore(line, '::');
      ensure(!hasValue(accum[prop]), 'Duplicate property names in text');
      accum.result[prop] = [];
      accum.active = accum.result[prop];
    }
    else if (accum.active != null){
      accum.active.push(line);
    }
    return accum;
  }

  let result = _.reduce(lines, buildSection,  {
                                          result: {},
                                          active: (null: ?Array<string>)
                                        }
                                        ).result;

  result = _.mapValues(result, (ar) => ar.join(newLine()));
  return result;
}

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

export function wildCardMatch(hayStack: string, needlePattern: string, caseSensitive: boolean = true, checkForAll: boolean = true, processFragmentResult: (fragment: string, remainder: string, found: boolean) => void = (f,r,ff) => {} ): boolean {

  if (!caseSensitive){
    hayStack = lowerCase(hayStack);
    needlePattern =  lowerCase(needlePattern);
  }

  function findNextPattern(accum, fragment){
    if (!checkForAll && !accum.result){
      return accum;
    }

    // make forgiving with spaces
    fragment = trim(fragment);
    let result = {},
        remainder = accum.remainder,
        idx = remainder.indexOf(fragment),
        found = (idx > -1);

    processFragmentResult(fragment, remainder, found);

    return {
      result: accum.result && found,
      remainder: found ? remainder.slice(idx + fragment.length) : remainder
    };
  }

  let result = _.chain(needlePattern.split('*'))
                  .filter(hasValue) // ignore empty strings in pattern
                  .reduce(findNextPattern, {result: true, remainder: hayStack})
                  .value();

  return result.result;
}

export function toString<T>(val : T): string {
  if (val === null)
    return 'null';

  if (val === undefined)
    return 'undefined';

  switch (typeof val) {
    case 'object':
      return val._isAMomentObject ? timeToSQLDateTimeSec(cast(val)) : objToYaml(val);

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
