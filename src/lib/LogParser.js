//@flow

import {debug, areEqual, yamlToObj, reorderProps } from '../lib/SysUtils';
import type { PopControl, LogSubType, LogLevel, LogEntry } from '../lib/Logging';
import { RECORD_DIVIDER } from '../lib/Logging';
import { newLine, toString, subStrBefore } from '../lib/StringUtils';
import readline from 'readline';
import * as _ from 'lodash';
import * as fs from 'fs';

/*
timestamp: '2017-10-01 13:46:27'
level: info
subType: RunStart
popControl: PushFolder
message: 'Test Run: Test Test Run',
link: ?string,
callstack: any
additionalInfo: |
  name: Test Test Run
  country: Australia
  environment: TST
  testCases: []
  depth: Regression
 */


export type State = {
  filterLog: {[string]: string}
}

export const initalState: State = {
  filterLog: {}
}


function makeStep<S>(onEntry:(S, LogEntry) => S, endIteration: S => void, endTest: S => void, endRun: S => void): (S, LogEntry) => S {

  return function step(state, entry) {
    let newState: S = onEntry(state, entry);
    switch (entry.subType) {
      case 'IterationEnd':
        endIteration(newState);
        break;

      case 'TestEnd':
        endTest(newState);
        break;

      case 'RunEnd':
        endRun(newState);
        break;

      default:
        break;
    }

    return newState;
  }
}


export function entryStep(state: State, entry: LogEntry): State {

  switch (entry.subType) {
    case 'FilterLog':
      state.filterLog = filterLog(entry.additionalInfo == null ? '' : entry.additionalInfo);
      break;


    case 'RunEnd':
        console.log('MY FIRST STATE' + toString(state.filterLog));
        break;


    default:
      break;
  }

  return state;
}


function filterLog(str: string) {

  function cleanUpKey(acc, val, key) {
    acc[subStrBefore(key, '.js')] = val;
    return acc;
  }

  let filterLog = yamlToObj(str),
      result = _.reduce(filterLog, cleanUpKey, {}),
      logKeys = _.keys(result).sort();

   return reorderProps(result, ...logKeys);
}

export const parseLogDefault = <S>(fullPath: string) => parseLog(fullPath, entryStep, initalState);

export const parseLog = <S>(fullPath: string, step: (S, LogEntry) => S, initState: S) => logSplitter(fullPath, parser(step, initState) );

function parser<S>(step: (S, LogEntry) => S, initialState: S): (str: string) => void {

  let remainingLines = [],
      currentState = initialState;

  function accumLine(line) {
    if (line == RECORD_DIVIDER){
      let entry = entryFromLines(remainingLines.join(newLine()));
      currentState = step(currentState, entry);
      console.log('!!!!!!!!!!!!! NEW ENTRY !!!!!!!!');
      remainingLines = [];
    }
    else {
      console.log(`!!!!!!!!!!!!! NEW LINE !!!!!!!! ${line}`);
      remainingLines.push(line);
    }
  }

  return function parseChunk(str: string): void {
    let lines = str.split(newLine());
    lines.forEach(accumLine);
  }

}

export function entryFromLines(str: string): LogEntry  {
  return yamlToObj(str);
}

export function logSplitter(fullPath: string, itemParser: string => void ): void {

  let inputFile = fs.createReadStream(fullPath, { encoding: 'utf8',  autoClose: true });

  inputFile.on('data', (chunk) => {
    itemParser(chunk);
  }).on('end', () => {
    console.log('!!!!!!!!!!!!!!!!!!!!!!!!! There will be no more data !!!!!!!!!!!!!!!!!!!!!!');
  }).on('error', () => {
    console.log('There was an error');
  }

  );





//
//   let lineReader = readline.createInterface({
//     input: inputFile,
//     output: process.stdout
//   });
//
//    console.log('HERE');
//
//   let activeEntry = [];
//
//   lineReader.on('line', function (line) {
//     console.log(line);
//     if (line == RECORD_DIVIDER){
//       console.log(line);
//       let thisEntry = entryFromLines(activeEntry.join('\n'));
//       itemParser(thisEntry);
//       activeEntry = [];
//     }
//     else {
//       console.log(line);
//       activeEntry.push(line);
//     }
//   });
//
//
//
//  lineReader.on('close', () => {
//    console.log('file closed');
// });


}
