const _ : _.LoDashStatic = require('lodash');
_.mixin(require("lodash-deep"));

import { now } from './DateTimeUtils';
import { pathExists, projectSubDir, runTimeFile, TEMPLATE_BASE_FILE, parentDir } from './FileUtils';
import { log, logException } from './Logging';
import {appendDelim, endsWith, hasText, lwrFirst, newLine, replaceAll,
      show, startsWith, subStrBetween, wildCardMatch, subStrBefore} from './StringUtils';
import { sendWebUIDebugMessage } from './SeleniumIpcServer';

import child_process from 'child_process';
import * as yaml from 'js-yaml';

import * as os from 'os';
const moment = require('moment');
const  xjs = require('xml2js');
const deasync = require('deasync');


// https://stackoverflow.com/questions/30579940/reliable-way-to-check-if-objects-is-serializable-in-javascript
export function isSerialisable(obj: any): boolean {

  const nestedSerialisable = (ob: any) => (_.isPlainObject(ob) || _.isArray(ob))  &&
                                    _.every(ob, isSerialisable);

  return  _.overSome([
            _.isUndefined,
            _.isNull,
            _.isBoolean,
            _.isNumber,
            _.isString,
            nestedSerialisable
          ])(obj)
}

export const filePathFromCallStackLine = (l : string) =>  (hasText(l, ' (', true) ? subStrBetween(l, ' (', '.ts:', true) : subStrBefore(l, '.ts')) + '.ts';

// https://stackoverflow.com/questions/13227489/how-can-one-get-the-file-path-of-the-caller-function-in-node-js
// assumes javascript extension .js
export function callerString(filePathOnly: boolean = false): string {
  let stack = callstackStrings();
  // remove callerString
  // remove caller
  let result = stack[2];
  return filePathOnly ? filePathFromCallStackLine(result) : result;
}

// https://stackoverflow.com/questions/13227489/how-can-one-get-the-file-path-of-the-caller-function-in-node-js
export function callstackStrings(): string[] {
  // Save original Error.prepareStackTrace - don't know what this is
  let origPrepareStackTrace = Error.prepareStackTrace,
      stack = <string[]>[];
  try {
    Error.prepareStackTrace = (_, stack) => stack;
    // Create a new `Error`, which automatically gets `stack`
    stack = <any>(new Error()).stack;
    stack.shift();
  }  finally {
    Error.prepareStackTrace = origPrepareStackTrace;
  }
  return stack.map(s => s.toString())
}


export function isFrameworkProject(): boolean {
  return !pathExists(projectSubDir(TEMPLATE_BASE_FILE, false))
}

export function xmlToObj(xml: string): {} {

  let result = <null|{}>null;
  xjs.parseString(xml, {explicitArray: false, tagNameProcessors: [lwrFirst], attributeNameProcessors: [lwrFirst]}, (err: any, rslt: string) => {
    if (err != null){
      throw err;
    }
    result = rslt;
  });
  waitRetry(() => result != null, 60000, () => {}, 0);
 return <{}>result;
}

export function randomInt(lwrBound: number, upperBound: number) {
  return _.random(Math.trunc(lwrBound), Math.trunc(upperBound));
}

export function randomInt0(upperBound: number) {
  return randomInt(0, upperBound);
}

export function translateErrorObj(e: any, description: string) : any {
  let errObj;
  if (_.isObject(e) && hasValue((<any>e).stack)) {
    errObj = { 
      failureDescription: description,
      exceptionInfo: {
        name: (<any>e).name,
        message: (<any>e).message,
        stack: (<any>e).stack
      }
    }
  }
  else {
    errObj = { 
      failureDescription: description,
      exceptionInfo: e
    }
  }
  return errObj;
}


export type TaskListItem = {
  imageName: string,
  pid: number,
  sessionName: string,
  session: number,
  memUsage: number
}

function ensureFilePath(path: string) : string {
  return ensureReturn(pathExists(path), path, 'file does not exist: ' + path);
}

// may need more work split asynch and handle stdIn / out and error
export function executeFileSynch(path: string): Buffer {
 ensureFilePath(path);
 log(`executing ${path} synch`);
 return child_process.execSync(path);
}

//todo: typed options corresponding to child_process - after change to typescript
export function executeFileAsynch(path: string): number {
  ensureFilePath(path);
  let wd = parentDir(path);
  log(`executing ${path} async`);
  const cp = child_process.exec(path, {cwd: wd});
  return cp.pid
}

export function executeRunTimeFileAsynch(fileNameNoPath: string): number {
  return executeFileAsynch(runTimeFile(fileNameNoPath));
}

export function executeRunTimeFileSynch(fileNameNoPath: string) : Buffer {
  return executeFileSynch(runTimeFile(fileNameNoPath));
}

export function findTask(pred : (i:TaskListItem) => boolean): TaskListItem | undefined {
  return listProcesses().find(pred);
}

export function taskExists(pred : (t:TaskListItem) => boolean): boolean {
  return listProcesses().some(pred);
}

// forcefully kills a task if found - 
// will return true if no matching tasks found or 
// mis able to kill all matching tasks
export function killTask(pred : (t:TaskListItem) => boolean, timeoutMs: number = 30000): boolean {
  const taskTokill = findTask(pred);
  if (taskTokill == null) {
    return true;
  }

  log(`Killing task: ${show(taskTokill)}`);
  child_process.execSync(`taskkill /im ${taskTokill.pid} /t /f`, {timeout: timeoutMs});

  if (findTask(t => t.pid === taskTokill.pid) != null){
    return false;
  }

  return killTask(pred, timeoutMs);
}

export function delay(ms: number) {
  deasync.sleep(ms);
}

export function waitRetry(isCompleteFunction: () => boolean, timeoutMs: number = 10000, retryFuction: () => void = () => {}, retryPauseMs: number = 100): boolean {

  let endTime = now().add(timeoutMs, 'ms'),
      complete = false;

  function done() {
    complete = isCompleteFunction();
    return complete;
  }

  while (!done() && now().isBefore(endTime)) {
    delay(retryPauseMs);
    retryFuction();
  };

  return complete;
}

export function listProcesses(): TaskListItem[] {
  let taskList = child_process.execSync('tasklist', {timeout: 30000}).toString();
  return _parseTaskList(taskList);
}

export function _parseTaskList(taskList: string): TaskListItem[] {
  let lines = taskList.split('\n').filter((s) => s.trim() != ''),
      headerLineIdx = lines.findIndex((s) => s.startsWith('=')),
      headerLine = lines[headerLineIdx],
      headerLineSegmentLens = (headerLine == null ? [] : headerLine.split(' ')).map((s) => s.length),
      headerLineIdxs = headerLineSegmentLens.reduce((accum: number[], len, idx) => {
        let start = idx > 0 ? accum[idx - 1] : 0;
        start = start + idx; // single space separators
        accum.push(start + len);
        return accum;
      },
      []
    );

  ensure(headerLineIdxs.length == 5, 'unexpected count of header lines');

  let processLines = lines.slice(headerLineIdx + 1);
  const convertLine = (s: string) => {
    return {
      imageName: s.slice(0, headerLineIdxs[0]).trim(),
      pid: parseInt(s.slice(headerLineIdxs[0], headerLineIdxs[1])),
      sessionName: s.slice(headerLineIdxs[1], headerLineIdxs[2]).trim(),
      session: parseInt(s.slice(headerLineIdxs[2], headerLineIdxs[3])),
      memUsage: parseInt(replaceAll(s.slice(headerLineIdxs[3], headerLineIdxs[4]), ',', ''))
    }
  }
  return processLines.map(convertLine);
}

export function functionNameFromFunction(func: any) : string {
  var str = show(func);
  return subStrBetween(str, 'function', '(').trim();
}

export function valueTracker<T>(mapName: string, generatorFunction: (...args: any) => T){
  let hashMap : {[k:string]: T} = {};

  function newVal(key: string, ...args: any): T {
    ensure(isUndefined(hashMap[key]), 'Name for key: ' + key + ' already created in ' + mapName);
    var result = generatorFunction(...args);
    hashMap[key] = result;
    return result;
  }

  function getVal(key: string): T{
    var result = hashMap[key];
    ensure(hasValue(result), 'No instance of value for key: ' + key + ' in ' + mapName);
    return result;
  }

  function getOrNew(key: string, ...args: any[]): T {
    var result = hashMap[key];
    return isUndefined(result) ? newVal(key, ...args) : result;
  }

  return {
          getVal: getVal,
          newVal: newVal,
          getOrNew: getOrNew
         };
}

/*
_.deepMapValues(object, function(value, path){
    return path + ' is ' + value)
});
 */
//@ts-ignore
export const deepMapValues = _.deepMapValues;

export function deepReduceValues<T>(obj: {}, func: (accum: T, val: any, propertyPath: string, baseObj: {}) => T, accum: T): T{
  // func(accum, value, propertyPath, baseObj)
  let thisAccum = accum;
  function executeFunc(value: any, propertyPath: string){
    thisAccum = func(thisAccum, value, propertyPath, obj);
  }

  deepMapValues(obj, executeFunc);
  return thisAccum;
}

export function flattenObj(obj: {}, allowDuplicateKeyOverwrites: boolean = false): {} {

  var result: {} = {}
  function flattenKey(val: any, path: string): void {
    let lastDot = path.lastIndexOf('.'),
         key = lastDot == -1 ? path : path.slice(lastDot + 1);
    ensure(allowDuplicateKeyOverwrites || (<any>result)[key] == null, 'the key: ' + key + ' would appear more than once in the flattened object');
    (<any>result)[key] = val;
  }
  deepMapValues(obj, flattenKey);
  return result;
}

export const hostName = () => os.hostname();

export function setParts<T>(arLeftSet: T[], arRightSet: T[]): [T[], T[], T[]] {

  function intersect(ar1: T[], ar2: T[]){
    var inIntersection = <T[]>[],
        uniqueToFirst = <T[]>[];

    function isInar2(item: T){
      function equalsTarg(ar2Item: T){
        return areEqual(ar2Item, item);
      }
      return _.find(ar2, equalsTarg)
    }

    function clasify(ar1Item: T){
      var pushTo = isInar2(ar1Item) ? inIntersection : uniqueToFirst;
      pushTo.push(ar1Item);
    }

    _.each(ar1, clasify);
    return [uniqueToFirst, inIntersection];
  }

  var leftCommon = intersect(arLeftSet, arRightSet),
      rightCommon = intersect(arRightSet, arLeftSet);


  return [leftCommon[0], leftCommon[1], rightCommon[0]];
}


export function forceArray<T>(...args: (T[]|T|undefined)[] ): T[] {

  function forceArraySingleVal(val: T): T[] {
     return isUndefined(val) ? [] :
             _.isArray(val) ? _.flattenDeep(val) : [val];
  }

  // @ts-ignore
  return _.chain(args)
          .map(forceArraySingleVal)
          .flatten()
          .value();
}

export function autoType(arr: {[k:string]: string}[]) : {[k:string]: any}[] {

  let exclusions: string[] = 
      arr.length === 0 ? [] : _.reduce(
                                        arr[0],
                                        (accum: string[], val, key) => startsWith(val, '`') ? accum.concat(key) : accum,
                                        []
                                      );

  function nullDotProps(obj: {[k:string]: string}){
    return dotToNulls(obj, exclusions)
  }

  let result = arr.map(nullDotProps);

  function validateParsers(parsers: any, obj: any){

    function compatitableParser(remainingParsers: any, key: string){
      function canParse(parser: any){
        let result = !exclusions.includes(key) && parser.canParse(obj[key]);
        return result;
      }
      return _.filter(remainingParsers, canParse);
    }

    let result = _.mapValues(parsers, compatitableParser);
    return result;
  }

  function firstOrNull<T>(arr: T[]): T | null {
    return arr.length > 0 ? arr[0] : null;
  }

  function parseFields(obj: {}){
    function parseField(val: any, key: string | number){
      var psr = (<any>validParsers)[key];
      return _.isNull(psr) ? val : psr.parse(val);
    }
    return _.mapValues(obj, parseField);
  }

  if (result.length > 0){
    var parsers = _.mapValues(result[0], _.constant(allParsers()));
    var validParsers = _.reduce(result, validateParsers, parsers);

    validParsers = _.mapValues(validParsers, firstOrNull);

 

    result = _.map(result, parseFields);

    let rec0 = result[0];

    function mutateBackTickedprops(val: any, key: string | number, obj: {}): any {
      (<any>obj)[key] = typeof val == 'string' && startsWith(val, '`') ? val.slice(1, val.length) : val;
    }

    // mutates underlying values
    _.mapValues(rec0, mutateBackTickedprops);
  }

  return result;
}

function allParsers(){
  return _.map(
               [
                  boolParser(),
                  // check number first as moment parses
                  // number as date
                  numberParser(),
                  dateParser()
                ],
               wrapParser
             );
}

function wrapParser(parser: any){
  return {
    name: parser.name,
    canParse: function(val: any){
                      return val == null || _.isString(val) && parser.canParse(val);
                    },
    parse:  function(val: any){
                      return val == null  || !_.isString(val) ? val : parser.parse(val);
                    }
  };
}

function boolParser(){
  const BOOL_CHARS = ['Y', 'N', 'T', 'F'];

  function parse(val: string){
     return _.includes(['Y', 'T'], val);
  }

  function canParse(val: string){
    return _.includes(BOOL_CHARS, val);
  }

  return {
      name: 'boolParser',
      canParse: canParse,
      parse: parse
  }
}

function numberParser(){

  function parse(val: any){
     return val.search('.') > -1 ? parseFloat(val): parseInt(val);
  }

  function canParse(val: any){
    return stringConvertableToNumber(val);
  }

  return {
      name: 'numberParser',
      canParse: canParse,
      parse: parse
  }
}

function dateParser(){

  // assumes null and str check already done
  function isNumber(str: string){
    var els = str.split('');
    function isNumChar(chr: string){
      return chr.charCodeAt(0) > 47 && chr.charCodeAt(0) < 58;
    }

    var nonNums = _.reject(els, isNumChar);
    return nonNums.length < 2;
  }

  function parse(val: string){
     return moment(val, 'YYYY-MM-DD');
  }

  function canParse(val: any){
    let result = false,
        pr = null;

    try {
      pr = parse(val);
      result = true;
    }
    catch (e) {
      if (e.message !== 'The string cannot be parsed.'){
        throw(e);
      }
    }

    // wierd hasValue error when use hasvalue in the return
    return result && pr != null && pr.isValid();
  }

  return {
      name: 'dateParser',
      canParse: canParse,
      parse: parse
  }
}

function dotToNulls(obj: {}, exclusions: string[]): {} {
  function dotToNull(val: any, key: any){
    return (val == '.') && !exclusions.includes(key) ? null : val;
  }
  return _.mapValues(obj, dotToNull);
}

export function objToYaml(obj: any, useRefs: boolean = false) : string {
  return (<any>yaml).safeDump(obj, {skipInvalid: true, noRefs: !useRefs });
}

function trimLine1Leading(str: string): string {
  let lines = str.split(newLine()),
      line0 = lines.find(s => s.trim() !== '');

  if (line0 != null){
    let len = line0.length,
        n = 0;

    while (n < len && line0[n] == ' ') {
      n++;
    }

    if (n == 0){
      return str;
    }
    else {
      let prefix = _.repeat(' ', n);

      function ensureEmpty(str: string, idx: number) {
        ensure(str.trim() == '', `Bad padding line ${idx}: stars with less spaces than leading line [${str}]`);
        return str;
      }

      function trimLine(line: string, idx: number) {
        return line.startsWith(prefix) ? line.slice(n) : ensureEmpty(line, idx);
      }
      return lines.map(trimLine).join(newLine());
    }
  }
  else {
    return str;
  }
}

export function yamlToObj<T>(yamlStr: string, trimLeadingSpaceBaseOnFirstLine: boolean = false): T {
  yamlStr = trimLeadingSpaceBaseOnFirstLine ? trimLine1Leading(yamlStr): yamlStr;
  let untypedVal: any = (<any>yaml).safeLoad(yamlStr);
	return (<T>untypedVal);
}

type LazyT<T> = () => T;

let debugSink : (s:string) => void = s => sendWebUIDebugMessage(s) ? undefined : console.log(s);
function callOrVal<T>(val: T | LazyT<T>): T {
  return typeof val === 'function' ? (<any>val)() : val;
}

export function debugStk<T>(msg: T | LazyT<T>, label: string = 'DEBUG'): T {
  let msgStr = callOrVal(msg);
  debugSink(appendDelim(_.toUpper(label), ': ', show(msgStr)) + newLine()  + '=========================' + newLine()  +
                                                                      callstackStrings().join(', ' + newLine()) + newLine()  +
                                                                      '=========================') ;
  return msgStr;
}

export function debug<T>(msg: T | LazyT<T>, label: string = 'DEBUG'): T {
  let msgStr = callOrVal(msg);
  debugSink(appendDelim(label, ': ', show(msgStr)));
  return <T>msgStr;
}

export function def <T> (val : T | undefined | null, defaultVal: T): T {
    // != null === not null or undefined
  return val == null ? defaultVal : val;
}

export function areEqual <T, U> (val1 : T, val2 : U) : boolean {
  return _.isEqualWith(val1, val2, eqCustomiser);
}

export function fail(description: string, e?: any): any {
  let err = translateErrorObj(e, description);
  logException(description, err);
  throw err;
}

export function failInfoObj(description: string) {
  let err = new Error();
  return {
    message: description,
    callStack: err.stack
  }
}

export function ensureReturn<T>(condition : boolean, successVal: T, failMsg : string = '') : T {
  ensure(condition, failMsg);
  return successVal;
}

export function ensure(condition : boolean, failMsg : string = '') {
  if(!condition) {
    fail('ensure failure - ' + failMsg);
  }
}

export function ensureHasVal<T>(successVal: T | null | undefined, failMsg : string = '') : T {
  if(!hasValue(successVal)) {
    throw new Error('value must not be null or an empty string or undefined - ' + failMsg);
  }
  return <any>successVal;
}

export function ensureHasValAnd<T>(successVal:T | null | undefined, predicate: (p:T) => boolean, failMsg : string = '') : T {
  let result = ensureHasVal(successVal, failMsg);
  return ensureReturn(predicate(result), result, failMsg);
}

function eqCustomiser <T, U> (val1 : T, val2 : U) : undefined | boolean {
  return typeof val1 == 'string' && typeof val2 == 'string'
    ? val1.valueOf() == val2.valueOf()
    : undefined;
}

export type AnySpecifier = string | Predicate | IndexSpecifier | {};

export type Predicate = (val : any, key : string | number) => boolean;

type ArrayItemPredicate = (val : any) => boolean;

type FuncSpecifier = (val : any, key : string | number) => any;

export type IndexSpecifier = [number | ArrayItemPredicate];

type SeekInObjResultItem = {
  parent: SeekInObjResultItem | null,
  value: any,
  key: string | number,
  specifiers: Array <FuncSpecifier>
};

function standardiseSpecifier(anySpec: AnySpecifier) : FuncSpecifier {

  // assume predicate
  if(typeof anySpec === 'function') {
    return function keyMatch(val: any, key: string | number) : any {
      return anySpec(val, key) ? val : undefined;
    }
  }

  if (typeof anySpec == 'string' || typeof anySpec == 'number') {
    let matcher = typeof anySpec == 'string' && hasText(anySpec, '*') ? wildCardMatch : areEqual;
    return function keyMatch(val : any, key : string | number) : any {
      return matcher(show(key), show(anySpec)) ? val : undefined;
    }
  }

  //todo - more testing on this 
  if (isPOJSO(anySpec)) {
    return function keyMatch(val : any, key : string | number) : any {
      if (isPOJSO(val)) {
        let specObj = <{}>anySpec,
            valObj = <{}>val,
            specKeys = _.keys(specObj),
            valKeys = _.keys(valObj);

        function matchesKeys(keys: string[]) {

          if (areEqual(keys, [])){
            return true;
          }
          else {
            let [specKey, ...otherSpecKeys] = keys,
                valKey = _.find(valKeys, (vk) => wildCardMatch(vk, specKey, true));

            if (valKey != null){
              let valPropVal = (<any>valObj)[valKey],
                  specPropVal = (<any>specObj)[specKey];

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
  ensure(_.isArray(anySpec) && (anySpec).length === 1, 'expect this to be a single item array: ' + show(anySpec));

  let dummy = (val : any, key : string | number) => {return undefined},
      indexer : IndexSpecifier = <IndexSpecifier>anySpec,
      item = indexer[0],
      indexerSpec: FuncSpecifier = typeof item == 'function' ? (val: any[]) => { return _.find(val, <ArrayItemPredicate>item); } :
                                    typeof item == 'number' ? (val: any[]) => {
                                                                        let idx: number = <number>item;
                                                                        return val.length > idx ? val[idx] : undefined;
                                                                      }  : dummy;

  ensure(indexerSpec !== dummy, 'array indexer must be a single element array of function or integer: [int] or [(val) => boolean]');

  return function indexmatch(val : any, key : string | number): any {
    return _.isArray(val) ? indexerSpec(val, key) : undefined;
  }
}

interface GenerationMatchResult {
  fullyMatched: Array <SeekInObjResultItem>,
  remainingCandidates: Array <SeekInObjResultItem>
};

interface ReducerResult {
    done: boolean,
    result: GenerationMatchResult
};

function matchFirstSpecifierOnTarget(parent: SeekInObjResultItem, searchType: SearchDirective): GenerationMatchResult | null | undefined {
  let
    baseVal = parent.value,
    specifers = parent.specifiers,
    result = {
      fullyMatched: <SeekInObjResultItem[]>[],
      remainingCandidates: <SeekInObjResultItem[]>[]
    };

  if (specifers.length > 0 &&  typeof baseVal == 'object') {

    let
      base: ReducerResult = {
        done: false,
        result: result
      };

    function resultPartition(accum: ReducerResult, val: any, key: string | number) : ReducerResult {
      return partitionResults(parent, searchType, accum, val, key);
    }

    return _.isArray(baseVal) ? resultPartition(base, parent.value, parent.key).result : _.reduce(parent.value, resultPartition, base).result;
  } else {
    return null;
  }
}

export function isPOJSO(val: any): boolean {
  return _.isObject(val) &&  !_.isArray(val);
}

function partitionResults(parent: SeekInObjResultItem, searchType: SearchDirective, accum: ReducerResult, val: any, key: string | number) : ReducerResult {
  if (accum.done){
    return accum;
  }

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

    function newMatchInfo(val: any, key: string | number, specifiers: FuncSpecifier[]) : SeekInObjResultItem {
      return {parent: parent, value: val, key: key, specifiers: specifiers};
    };

  if (matchesAllSpecifiers) {
    fullyMatched.push(newMatchInfo(matchResult, key, otherSpecs));
    done = searchType == 'singleton';
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

function getResultValues(result: Array <SeekInObjResultItem>): any[] {
  return result.map((s: SeekInObjResultItem) => s.value);
}

export function seekInObj<T>(target: {} | null | undefined, specifier: AnySpecifier, ...otherSpecifiers: AnySpecifier[]): T | undefined {
  let info = seekInObjWithInfo(target, specifier, ...otherSpecifiers);
  return info == null ? undefined : info.value;
}

export function setInObjn(target : {}, specifiers : AnySpecifier[], value?: any): {}{
  return setInObjnPrivate(false, target, specifiers, value);
}

export function setInObj1(target : {}, specifier : AnySpecifier, value: any): {}{
  return setInObjnPrivate(false, target, [specifier], value);
}

export function setInObj2(target : {}, specifier : AnySpecifier, specifier1 : AnySpecifier, value: any): {}{
  return setInObjnPrivate(false, target, [specifier, specifier1], value);
}

export function setInObj3(target : {}, specifier : AnySpecifier, specifier1 : AnySpecifier, specifier2: AnySpecifier, value: any): {}{
  return setInObjnPrivate(false, target, [specifier, specifier1, specifier2], value);
}

export function setInObj4(target : {}, specifier : AnySpecifier, specifier1 : AnySpecifier, specifier2: AnySpecifier, specifier3: AnySpecifier, value: any): {}{
  return setInObjnPrivate(false, target, [specifier, specifier1, specifier2, specifier3], value);
}

function setInObjnPrivate(noCheck: boolean, target : {}, specifiers : AnySpecifier[], value: any) : {} {

  let [spec, ...otherSpecs] = specifiers,
      propInfo = noCheck ?  seekInObjNoCheckWithInfo(target, spec, ...otherSpecs) :  seekInObjWithInfo(target, spec, ...otherSpecs);

  if (propInfo == null){
    fail( 'setInObj matching property not found for specification: ' + _.map(specifiers, show).join(', '));
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
      parent.value[propInfo.key] = value;
    }
  }
  return target;
}

export function seekInObjNoCheck(target: null | undefined | {}, specifier: AnySpecifier, ...otherSpecifiers : AnySpecifier[]): any {
  let result = seekInObjNoCheckWithInfo(target, specifier, ...otherSpecifiers);
  return result == null ? undefined : result.value;
}

export const seekManyInObj = _.flowRight([getResultValues, seekManyInObjWithInfo]); 

function addressOfSeekResult(seekResult: SeekInObjResultItem) : string {
  let strKey = show(seekResult.key);
  return strKey === '' || seekResult.parent == null ? strKey :
      appendDelim(addressOfSeekResult(seekResult.parent), '.', strKey);
}

function objectAddresses(allInfo: Array <SeekInObjResultItem>): string {
  return allInfo.map(addressOfSeekResult).join(', ');
}

interface SearchDirectiveMap  {
  includeNested: number,
  eachBranch: number,
  singleton: number
};

const SEARCH_DIRECTIVE = {
  includeNested: 2,
  eachBranch: 1,
  singleton: 0
};

type SearchDirective = keyof SearchDirectiveMap;

export function seekInObjWithInfo(target: {} | null | undefined, specifier: AnySpecifier, ...otherSpecifiers : AnySpecifier[]): SeekInObjResultItem | undefined {
  let allInfo = seekManyInObjWithInfo(target, specifier, ...otherSpecifiers);
  if (allInfo.length === 0){
    return undefined;
  }
  else {
    return ensureReturn(allInfo.length === 1, allInfo[0], 'More than one object matches supplied specifiers: ' + objectAddresses(allInfo));
  }
}

export function seekInObjNoCheckWithInfo(target: {} | null | undefined, specifier: AnySpecifier, ...otherSpecifiers : AnySpecifier[]): SeekInObjResultItem | null | undefined {
  let allInfo = seekInObjBase(target, 'singleton', specifier, ...otherSpecifiers);
  return allInfo.length === 0 ? null : allInfo[0];
}

export function seekAllInObjWithInfo(target: {} | null | undefined, specifier: AnySpecifier, ...otherSpecifiers : AnySpecifier[]): SeekInObjResultItem[] {
  return seekInObjBase(target, 'includeNested', specifier, ...otherSpecifiers);
}

export const seekAllInObj = _.flowRight([getResultValues, seekAllInObjWithInfo]); // flow issues _.flowRight(getResultValues, seekAllInObjWithInfo);

export function seekManyInObjWithInfo(target: {} | null | undefined, specifier: AnySpecifier, ...otherSpecifiers : AnySpecifier[]): SeekInObjResultItem[] {
  return seekInObjBase(target, 'eachBranch', specifier, ...otherSpecifiers);
}

function seekInObjBase(target: {} | null | undefined, searchType: SearchDirective, specifier: AnySpecifier, ...otherSpecifiers : AnySpecifier[]): SeekInObjResultItem[] {
    if(typeof target != 'object') {
      return [];
    };

    function getNextGeneration(itemResult : SeekInObjResultItem): GenerationMatchResult | null | undefined {
      return matchFirstSpecifierOnTarget(itemResult, searchType);
    };

    function pluckFlatten(baseArray: GenerationMatchResult[], propName: string | number): SeekInObjResultItem[]{
      let result = _.chain(baseArray)
                          .map(propName)
                          .flatten()
                          .value();

      return <any>result;
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

        if (remainingCandidates.length > 0 && (searchType == 'includeNested' || fullyMatched.length === 0)){
          let
            nextParam = {
             fullyMatched: fullyMatched,
             remainingCandidates: remainingCandidates
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
        remainingCandidates: [seedResultItem]
      };

    return widthSearch(seedResult);
}

export function isNullEmptyOrUndefined(arg : any): boolean {
  return !(arg != null) || arg === '';
}

export function isDefined(arg : any): boolean {
  return typeof arg !== 'undefined';
}

export function isUndefined(arg : any): boolean {
  return !isDefined(arg);
}

export function hasValue(arg: any): boolean {
  return !isNullEmptyOrUndefined(arg);
}

export function all < a > (predicate : (a: any) => boolean, arr : Array < a >): boolean {
  return arr.reduce((accum, item) => accum && predicate(item), <boolean>true);
}

export function stringConvertableToNumber(val: string | null | undefined): boolean {

  if(val == null)
    return false;

  function isNumChars(str: string) {

    function isDot(chr: string) {
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

  function parseNumIfPossible(val : number | string) : number | null {
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
