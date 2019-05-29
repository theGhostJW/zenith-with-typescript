import { hasValue, ensure, autoType, objToYaml, areEqual,
          xmlToObj, deepMapValues, debug } from '../lib/SysUtils';

const _ : _.LoDashStatic = require('lodash');

const parseCsvSync = require('csv-parse/lib/sync');
import { timeToSQLDateTimeSec } from '../lib/DateTimeUtils';

const format = require('xml-formatter');


export type XmlFormatOptions = {
  stripComments?: boolean,
  indentation?: string,
  debug?: boolean
}

const XML_DEF_OPTS: XmlFormatOptions  =  {
    stripComments: true,
    indentation: ' ',
    debug: false
}

export function formatXml(xml: string, options: XmlFormatOptions = XML_DEF_OPTS) : string {
  return format(xml, options);
}

/*
The character encodings currently supported by Node.js include:
    'ascii' - For 7-bit ASCII data only. This encoding is fast and will strip the high bit if set.
    'utf8' - Multibyte encoded Unicode characters. Many web pages and other document formats use UTF-8.
    'utf16le' - 2 or 4 bytes, little-endian encoded Unicode characters. Surrogate pairs (U+10000 to U+10FFFF) are supported.
    'ucs2' - Alias of 'utf16le'.
    'base64' - Base64 encoding. When creating a Buffer from a string, this encoding will also correctly accept "URL and Filename Safe Alphabet" as specified in RFC4648, Section 5.
    'latin1' - A way of encoding the Buffer into a one-byte encoded string (as defined by the IANA in RFC1345, page 63, to be the Latin-1 supplement block and C0/C1 control codes).
    'binary' - Alias for 'latin1'.
    'hex' - Encode each byte as two hexadecimal characters.
 */

export enum CharacterEncoding {
                                'utf8', 
                                'ucs2',
                                'ascii',
                                'utf16le',
                                'latin1',
                                'binary',
                                'base64',
                                'hex'
                              };

const ALL_CHAR_ENCODINGS = [
  CharacterEncoding.utf8, 
  CharacterEncoding.ucs2,
  CharacterEncoding.ascii,
  CharacterEncoding.utf16le,
  CharacterEncoding.latin1,
  CharacterEncoding.binary,
  CharacterEncoding.base64,
  CharacterEncoding.hex
]
/*
  try encodings on buffer and return the ones that do not blow up
 */
export function tryEncodings(buffer: any, options: CharacterEncoding[] = ALL_CHAR_ENCODINGS ): {CharacterEncoding: string}{

  function decode(enc: CharacterEncoding): string | undefined {
    let result = undefined;
    try {
      result = buffer.toString(CharacterEncoding[enc]);
    } catch (e) {
      // assume not valid
    }
    return result;
  }

  function addEncoding(encodings: {CharacterEncoding: string}, encoding: CharacterEncoding): {CharacterEncoding: string} {
    const str = decode(encoding) ;
    if (str != null){
      (<any>encodings)[encoding] = str;
    }
    return encodings;
  }
  return (<any>_.reduce(options, (<any>addEncoding), {}));
}

export function lwrFirst(str?: string) {
  return str == null ? str : str.charAt(0).toLowerCase() + str.slice(1);
}

// just to get stingify to look pretty
export function objToJson(obj: any) {
  return JSON.stringify(obj, null, ' ');
}

// used to generate properties object for templating from xml
export function propsObjectStringFromXml(xmlStr: string): string {
  var xmlObj = xmlToObj(xmlStr);
  return replaceAll(replaceAll(objToJson(deepMapValues(xmlObj, () => null)), '""', 'null'), '"', '');
}


// converts simple xml - one field per line
// tags closed to mostched template
export function convertXmlToSimpleTemplate(xml: string){
  var lines = standardiseLineEndings(xml).split(newLine());

  function makeTemplateLineIfSimple(str: string){
    let tagName = subStrBetween(str, '<','>'),
        result = str;

    if (hasValue(tagName) && hasText(str, '</' + tagName)) {
      let propName = lowerFirst(replaceAll(tagName, ' ', '')),
          prefix = subStrBefore(str, '>') + '>',
          suffix = '</' + subStrAfter(str, '</');
      result = prefix + '{{' + propName + '}}' + suffix;
    }

    return result;
  }

  return lines.map(makeTemplateLineIfSimple).join(newLine());
}


function transformSection(dataObj: {}, transformerFunc: (s: string, {}) => string, transformedTemplate: string, unTransformedTemplate: string, sectionName: string): SectionAccum {
  let parts = templateSectionParts(unTransformedTemplate, sectionName),
      transformedSection = transformerFunc(parts.section, dataObj);

  return {
        transformedTemplate: transformedTemplate + parts.prefix + transformedSection,
        unTransformedTemplate: parts.suffix
      };
}

export function templateLoader(templateString: string): (({}) => string) {
  _.templateSettings.interpolate = /{{([\s\S]+?)}}/g;
  return _.template(templateString);
}

export function loadTemplate(templateString: string, data: {}): string {
  return templateLoader(templateString)(data);
}

export function loadTemplatePositional(templateString: string, ...data: any): string {
  // note lodash does not work with numeric keys so can't use lodash templating for this
  function applyKey(accum: string, val: any, idx: number) {
    let tag = '{{' + show(idx) + '}}'
    return replaceAll(accum, tag, show(val))
  }
  return data.reduce(applyKey, templateString);
}

interface SectionAccum {
  transformedTemplate: string,
  unTransformedTemplate: string
};

export function loadSectionedTemplate(template: string, transformers: Map<string, (s: string, m: {}) => string>, data: {}): string {

    function applyTransformer(accum: SectionAccum, transformerFunc: (t: string, d: {}) => string, sectionName: string): SectionAccum {
      return transformSection( (<{}>(<any>data)[sectionName]),
                                      transformerFunc,
                                      accum.transformedTemplate,
                                      accum.unTransformedTemplate,
                                      sectionName
                                      );
    }

    let transformed = _.reduce(transformers, <any>applyTransformer, {
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

export function trimChars(str: string, arChars: string[]): string {
  ensure(!arChars.includes(''), 'Empty string passed in to trimChars char array (param: arChars) - you cannot trim an empty string');

  const inTrim = (chr: string) => arChars.includes(chr);

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

export const parseCsv = (text: string, options: {[key:string]: string | boolean} = DEFAULT_CSV_PARSE_OPTIONS, wantAutoType: boolean = true): {[key:string]: string}[] => {
  let result = (<any>parseCsvSync)(text, options);
  return wantAutoType ? autoType(result) : result;
}

export const DEFAULT_CSV_PARSE_OPTIONS = {
                                          comment: '#',
                                          skip_empty_lines: true,
                                          skip_lines_with_empty_values: true,
                                          trim: true,
                                          columns: true
                                        };

export const stringToArray = (str: string): string[] => str.split(newLine());
export const arrayToString = (ar: string[]): string => ar.join(newLine());

export function trim(str: string): string {
  return _.trim(str);
}

const lut = (<any>Array(256)).fill().map((_: any, i: number) => (i < 16 ? '0' : '') + (i).toString(16));
// @ts-ignore
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


type FieldTransformer = (val: any, key: string, obj: {[key:string]: any}) => any;
type RowTransformer<T> = (m:{[key:string]: any}) => T;

export function transformGroupedTable<T>(unTypedTable: {[key:string]: any}[][], rowTransformer: RowTransformer<T>) : T[][] {
  return unTypedTable.map((row) => row.map(rowTransformer));
}

function fieldToRowTransformer(fieldTransformer: FieldTransformer): (m:{[key:string]: any}) => {[k:string]: any} {
  return (obj) => _.mapValues(obj, fieldTransformer);
}

export function stringToTableMap<T>(txt: string, rowTransformer: RowTransformer<T>, ...fieldTransformers: FieldTransformer[]) : {[k:string]: T[]} {
  var sections = splitOnPropName(txt);
  return _.mapValues(sections, (txt) => stringToTable(txt, rowTransformer, ...fieldTransformers));
}

export function stringToGroupedTableMap<T>(txt: string, rowTransformer: RowTransformer<T>, ...fieldTransformers: FieldTransformer[]) : {[k:string]: T[][]} {
  var sections = splitOnPropName(txt);
  return _.mapValues(sections, (txt) => stringToGroupedTable(txt, rowTransformer, ...fieldTransformers));
}

function safeCheckedFirst<T>(nested: T[][]): T[] {
  ensure(nested.length < 2, 'loading nested rows with stringToTable - use stringToGroupedTable for such cases');
  return nested.length === 0 ? [] : nested[0];
}

export function stringToTable<T>(txt: string, rowTransformer: RowTransformer<T>, ...fieldTransformers: FieldTransformer[]) : T[] {
  let result = stringToGroupedTableLooseTyped(txt, ...fieldTransformers);
  result = transformGroupedTable(result, rowTransformer);
  // @ts-ignore
  return safeCheckedFirst(result);
}

export function stringToGroupedTableDefinedTabSize<T>(txt: string, spaceCountToTab: number = 2, rowTransformer: RowTransformer<T>, ...fieldTransformers: FieldTransformer[]) : T[][] {
  let result = stringToGroupedTableLooseTypedDefinedTabSize(txt, spaceCountToTab, ...fieldTransformers);
  return transformGroupedTable(result, rowTransformer);
}

export function stringToGroupedTable<T>(txt: string, rowTransformer: RowTransformer<T>, ...fieldTransformers: FieldTransformer[]) : T[][] {
  return stringToGroupedTableDefinedTabSize(txt, 2, rowTransformer, ...fieldTransformers);
}

export function stringToTableLooseTyped(txt: string, ...fieldTransformers: FieldTransformer[]) : {[k:string]: any}[] {
  let result: {[k:string]: any}[][] = stringToGroupedTableLooseTyped(txt, ...fieldTransformers);
  return safeCheckedFirst(result);
}

export function stringToGroupedTableLooseTyped(txt: string, ...fieldTransformers: FieldTransformer[]) : {[k:string]: any}[][] {
  return stringToGroupedTableLooseTypedDefinedTabSize(txt, 2, ...fieldTransformers);
}

const stdLinesAndSplit = (str: string) => standardiseLineEndings(str).split(newLine());

export function stringToGroupedTableLooseTypedDefinedTabSize(txt: string, spaceCountToTab: number = 2, ...fieldTransformers: FieldTransformer[]) : {[k:string]: any}[][] {
  let lines = stdLinesAndSplit(txt),
      result = linesToGroupedObjects(lines, '', spaceCountToTab).map(autoType);

  return applyFieldTransformers(result, fieldTransformers);
}

function applyFieldTransformers(target: {[k:string]: any}[][], fieldTransformers: FieldTransformer[]): {[k:string]: any}[][] {
  let rowTrans = fieldTransformers.map(fieldToRowTransformer);

  function transformRows(rows: {[k:string]: any}[]): {[k:string]: any}[] {
    return _.reduce(rowTrans, (accum, rowTrans) => accum.map(rowTrans), rows);
  }

  return target.map(transformRows);
}


function linesToGroupedObjects(lines: string[], errorInfo: string, spaceCountToTab: number) : {[k:string]: any}[][]  {
  let headAndLines = headerAndRemainingLines(lines, spaceCountToTab),
      header: string[] = headAndLines.header,
      groups: string[][] = headAndLines.groups,
      arrToObjs = makeArrayToObjectsFunction(errorInfo, spaceCountToTab, header),
     // arrToObjs: ((string[]) => {[string]: any}[]) = makeArrayToObjectsFunction(errorInfo, spaceCountToTab, header),
      result: {[k:string]: any}[][] = _.map(groups, arrToObjs);

   return result;
}

function makeArrayToObjectsFunction(errorInfo: string, spaceCountToTab: number, header: string[]): (arr: string[]) => {[k:string]: any}[]  {
  return (lines: string[]): {[k:string]: any}[] => {
    function makeObjs(accum: {}[], fields: string[], idx: number): {}[] {
      ensure(header.length === fields.length, errorInfo + ' row no: ' + idx +
                                            ' has incorrect number of elements expect: ' + header.length +
                                            ' actual is: ' + fields.length + '. ' + 'property names' +  newLine() +
                                            header.join(', ') +  newLine() + 'fields' +  newLine() + fields.join(', ')
                                          );
      function addProp(accum: {[k:string]: any} , prpVal: [string, string]): {[k:string]: any} {
        accum[prpVal[0]] = prpVal[1];
        return accum;
      }

      function makeRecord(){
       return _.chain(header)
                .zip(fields)
                // @ts-ignore
                .reduce(addProp, <{[k:string]: any}>{})
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
    header: string[],
    groups: string[][]
}

function headerAndRemainingLines(lines: string[], spaceCountToTab: number){

  interface Accum {
    groups: string[][],
    activeGroup: string[],
    props: string[],
    lastLine: string,
    started: boolean,
    done: boolean,
    nullLineEncountered: boolean
  }

  function pushGroup(accum: Accum){
    let newGroup = <string[]>[];
    accum.groups.push(newGroup);
    accum.activeGroup = newGroup;
  }

  function filterLine(accum: Accum, line: string){

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
                                            groups: <string[][]>[],
                                            activeGroup: <string[]>[],
                                            props: <string[]>[],
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

function makeSplitTrimFunction(spaceCountToTab: number){
  function tabReplace(txt: string){
    return spaceCountToTab < 1 ? txt : replaceAll(txt, ' '.repeat(spaceCountToTab), '\t');
  }

  function splitLine(line: string){
    return dedupeTabSpaces(line).split('\t');
  }

  function trimElements(elems: [string]){
    return _.map(elems, trim);
  }

  return function splitTrim(str: string){
     return _.flowRight([trimElements, splitLine, tabReplace])(str);
  }
}

function dedupeTabSpaces(str: string): string {
  let result = replaceWithTabs(str, '\t ');
  result = replaceWithTabs(result, '\t\t');
  return result;
}

function replaceWithTabs(str: string, strToReplace: string, lastLength: number = 0): string {
  str = replaceAll(str, strToReplace, '\t');
  var len = str.length;
  return len === lastLength ? str : replaceWithTabs(str, strToReplace, len);
}

function isGroupDivider(line: string){
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

function splitOnPropName(txt: string) : {[k:string]: string}{

  let lines = stdLinesAndSplit(txt);

  interface Accum {
    result: {},
    active: string[] | null
  };

  function buildSection(accum: Accum, line: string){
    if (hasText(line, '::')){
      var prop = subStrBefore(line, '::');
      ensure(!hasValue((<any>accum)[prop]), 'Duplicate property names in text');
      (<any>accum).result[prop] = [];
      accum.active = (<any>accum).result[prop];
    }
    else if (accum.active != null){
      accum.active.push(line);
    }
    return accum;
  }

  let result = _.reduce(lines, buildSection,  {
                                          result: {},
                                          active: (<string[] | null>null)
                                        }
                                        ).result;

  result = _.mapValues(result, (ar: string[]) => ar.join(newLine()));
  return result;
}

// from https://codepen.io/avesus/pen/wgQmaV?editors=0012
export const createGuid = () => formatUuid(getRandomValuesFunc());

export const createGuidTruncated = (length: number) => replaceAll(createGuid(), '-', '').slice(0, length);

export function standardiseLineEndings(str: string): string {
  var result = replaceAll(str, '\n\r', '\n');
  result = replaceAll(result, '\r\n', '\n');
  result = replaceAll(result, '\r', '\n');
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

export const upperCase : (s: string) => string = (s) => s.toUpperCase();

export const lowerCase : (s: string) => string = (s) => s.toLowerCase();

export function appendDelim(str1: string | null | undefined, delim: string = "", str2:  string | null | undefined){
  str1 = str1 == null ? "" : str1;
  str2 = str2 == null ? "" : str2;
  return (str1 == '' || str2 == '') ? str1 + str2 : str1 + delim + str2;
 };

export function replaceAll(hayStack: string, needle: string, replacement: string, caseSensitive: boolean = false): string {
   // https://stackoverflow.com/questions/7313395/case-insensitive-replace-all
   let esc = needle.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'),
       reg = new RegExp(esc, (caseSensitive ? 'g' : 'ig'));

   return hayStack.replace(reg, replacement);
}


export function wildCardMatch(hayStack: string, needlePattern: string, caseSensitive: boolean = true, checkForAll: boolean = false,
                            processFragmentResult: (fragment: string, remainder: string, found: boolean) => void = (f,r,ff) => {} ): boolean {

  if (!caseSensitive){
    hayStack = lowerCase(hayStack);
    needlePattern = lowerCase(needlePattern);
  }

  function findNextPattern(accum: {result: boolean, remainder: string}, fragment: string){
    if (!checkForAll && !accum.result){
      return false;
    }

    // make forgiving with spaces
    fragment = trim(fragment);
    let remainder = accum.remainder,
        idx = remainder.indexOf(fragment),
        found = (idx > -1);

      processFragmentResult(fragment, remainder, found);

      accum.result = accum.result && found;
      accum.remainder = found ? remainder.slice(idx + fragment.length) : remainder;
  }

  let result = _.chain(needlePattern.split('*'))
                  .filter(hasValue) // ignore empty strings in pattern
                  .transform(findNextPattern, {result: true, remainder: hayStack})
                  .value();

  return result.result;
}

export function show<T>(val : T): string {
  if (val === null)
    return 'null';

  if (val === undefined)
    return 'undefined';

  switch (typeof val) {
    case 'object':
      return (<any>val)._isAMomentObject ? timeToSQLDateTimeSec(<any>(val)) : objToYaml(val);

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

export function startsWith(str: string | undefined | null, preFix: string) : boolean {
  return str != null ? str.indexOf(preFix) === 0 : false;
}


export function endsWith(str: string | undefined | null, suffix: string) {
  return str != null ? str.indexOf(suffix, str.length - suffix.length) !== -1 : false;
}

export function hasText(hayStack: string | undefined | null, needle: string, caseSensitive: boolean = false): boolean {
  return hayStack == null ? false :
                            caseSensitive ? hayStack.includes(needle) :
                                            hayStack.toLowerCase().includes(needle.toLowerCase()) ;
}
