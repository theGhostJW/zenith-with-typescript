// @flow

import {
  def,
  debug,
  objToYaml,
  ensure,
  yamlToObj
} from '../lib/SysUtils';
import {
  newLine,
  trimChars,
  toString
} from '../lib/StringUtils';
import {
} from '../lib/DateTimeUtils';
import * as _ from 'lodash';

export type RunSummary = {|
  runConfig: {[string]: string},
  startTime: string,
  endTime:  string,
  filterLog: {[string]: string},
  stats: RunStats
|}

export type FullSummaryInfo = {
  rawFile: string,
  elementsFile: string,
  testSummaries: {[string]: TestSummary},
  runSummary: ?RunSummary
}

export type RunStats =  {|
  testCases: number,
  passedTests: number,
  failedTests: number,
  testsWithWarnings: number,
  testsWithKnownDefects: number,
  testsWithType2Errors: number,

  iterations: number,
  passedIterations: number,
  failedIterations: number,
  iterationsWithWarnings: number,
  iterationsWithKnownDefects: number,
  iterationsWithType2Errors: number,

  outOfTestErrors: number,
  outOfTestWarnings: number,
  outOfTestType2Errors: number,
  outOfTestKnownDefects: number
|};

export type WithScript = {
   script: string
};

export type TestSummary = {|
  testConfig: WithScript,
  startTime: string,
  endTime:  string,
  stats: TestStats
|}

export type TestStats = {|
  iterations: number,
  passedIterations: number,
  failedIterations: number,
  iterationsWithWarnings: number,
  iterationsWithKnownDefects: number
|};



export const testPrivate = {
  headerLine: headerLine,
  summaryBlock: summaryBlock,
  padProps: padProps
};

function padProps(obj: {}, leftJustify: boolean = true, prefix: string = ''): string {

  function toStringPairs(obj): Array<[string, string]> {
    return _.chain(obj)
            .toPairs()
            .map((kv) => [toString(kv[0]), toString(kv[1])])
            .value()
  }

  function maxlenOfIdx(idx: 0 | 1) {
    return (accum, kv) => Math.max(kv[idx].length, accum)
  }

  let pairs = toStringPairs(obj),
      padding = {};

  if (leftJustify){

    function totalKVLenPlus1Map(maxLen: number) {
      return function totalKeyLenPlus1(accum: {}, kv: [string, string]) {
        let k = kv[0];
        accum[k] = maxLen + 1 - k.length;
        return accum;
      }
    }

    let maxLen = _.reduce(pairs, maxlenOfIdx(0) , 0);
    padding = _.reduce(pairs, totalKVLenPlus1Map(maxLen), {});
  }
  else {

    function totalKVLenPlus1Map(maxLen: number) {
      return function totalKVLenPlus1(accum: {}, kv: [string, string]) {
        let [k, v] = kv;
        accum[k] = maxLen + 1 - k.length - v.length;
        return accum;
      }
    }

    let maxLen = _.reduce(pairs, maxlenOfIdx(0) , 0) + _.reduce(pairs, maxlenOfIdx(1) , 0);
    padding = _.reduce(pairs, totalKVLenPlus1Map(maxLen), {});
  }

  function padValStringify(kv) {
    let [k, v] = kv,
        pad = ' '.repeat(padding[k]);
    return prefix + k + ':' + pad + v;
  }

  return _.map(pairs, padValStringify).join(newLine());
}

export function summaryBlock(runSummary: RunSummary): string {
  debug(typeof runSummary)
  let {
        startTime,
        endTime,
        runConfig
      } = debug(runSummary),
      name = def(debug(runConfig)['name'], 'Unnamed Test Run'),
      headerLine = `Summary - ${name}`,
      heading = majorHeader('', false) + newLine() +
                majorHeader(headerLine, false) + newLine() +
                majorHeader('', false);

  return heading;
}


const majorHeader = (header: string, wantPrcntChar: boolean): string => standardHeader(header, '#', wantPrcntChar);
const standardHeader = (header: string, padder: string, wantPrcntChar: boolean): string => headerLine(header, padder, wantPrcntChar, 80);

function headerLine(header: string, padder: string, wantPrcntChar: boolean, len: number): string {
  ensure(padder.length === 1, 'Padder length must be 1');

  let result = '';
  if (header.length === 0) {
    result = padder.repeat(len) ;
  }
  else {
    let pHeadLen = header.length + 2,
        pLen = Math.ceil((len - pHeadLen) / 2),
        suffix = padder.repeat(pLen),
        prefix = (suffix + ' ' + header +  ' ' + suffix).length > len ? suffix.slice(0, -1) : suffix;


    result = prefix + ' ' + header +  ' ' + suffix;
  }

  return wantPrcntChar ? result.replace(padder + padder, padder + '%'): result;
}
