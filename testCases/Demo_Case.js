// @flow

import {chk, chkEq, chkEqJson, chkFalse} from '../src/lib/AssertionUtils';
import * as _ from 'lodash';
import { debug, fail, waitRetry } from '../src/lib/SysUtils';
import { log, expectDefect, endDefect, logException } from '../src/lib/Logging';
import { toTempString } from '../src/lib/FileUtils';
import child_process from 'child_process'
import type { RunConfig, TestCase, TestConfig, Validators, Country, Depth } from '../testCases/ProjectConfig';
import { register } from '../testCases/ProjectConfig';
import { check, checkFalse} from '../src/lib/CheckUtils';
import moment from 'moment';
import unirest from 'unirest';
import "babel-polyfill";
import deasync from 'deasync';


var config: TestConfig = {
  when: 'I cannot think of anything ~ Demo_Case',
  then: 'I just write something',
  owner: 'JW',
  enabled: true,
  countries: ['New Zealand', 'Australia']
}

function interactor(item: Item, runConfig: RunConfig): ApState {

  if (item.id == 4){
    fail('I do not like 4');
  }

  debug('before test');
//  test();
  debug('after test');

  // while(gi < 8) {
  //   deasync.sleep(100);
  // }
  //

  waitRetry(() => gi > 8)
  debug(gi)

  return {
    id: item.id,
    observation: 'blahh'
  }
}

function wait(ms) {
  return new Promise(resolve => setTimeout(() => resolve(), ms));
}

let gi = 0;

// const test = async function() {
//   for (let i = 0; i < 10; ++i) {
//     await wait(1000);
//     // Prints out "Hello, World!" once per second and then exits
//     gi++;
//     console.log('Hello, World!');
//   }
// }

// function callRest(): {} {
//
//   let response = request('POST', 'https://jsonplaceholder.typicode.com/posts',
//     {
//       headers: {
//         'Content-type': 'application/json',
//         'charset': 'UTF-8'
//       },
//       body: JSON.stringify({
//           title: 'foo',
//           body: 'bar',
//           userId: 1
//         })
//     }
//
//   );
//
//   response.body = JSON.parse(response.body.toString('UTF-8'));
//   return response;
// }

type ApState = {|
  id: number,
  observation: string
|}

type ValState = {|
  id: number,
  someWords: string
|}

function prepState(apState: ApState): ValState {
  return {
    id: apState.id,
    someWords: 'YES WE CAN'
  }
}

function summarise(runConfig: RunConfig, item: Item, apState: ApState, valState: ValState): string {
  return 'Summary not implemented'
}

function mockFilename(item: Item, runConfig: RunConfig) {
  return '';
}

type Item = {|
  id: number,
  when: string,
  then: string,
  data?: string,
  validators: Validators<ValState, Item>
|}

function check_less_than_2(valState: ValState, item: Item, runConfig: RunConfig, valTime: moment$Moment) {
  expectDefect('should fail');
  check(valState.id < 2, 'expect less than 2', `${valState.id} should be less than 2`);
  endDefect();
}

function check_less_than_3(valState: ValState, item: Item, runConfig: RunConfig, valTime: moment$Moment) {
  check(valState.id < 3, 'expect less than 2')
}

function check_bad_validator(valState: ValState, item: Item, runConfig: RunConfig, valTime: moment$Moment) {
  throw('ARGGGHHHHHH!!!')
}

function check_with_disabled_expectation(valState: ValState, item: Item, runConfig: RunConfig, valTime: moment$Moment) {
  expectDefect('should not fail', false);
  check(true, 'true is true');
  endDefect();
}

function check_with_incorrect_disabled_expectation(valState: ValState, item: Item, runConfig: RunConfig, valTime: moment$Moment) {
  expectDefect('should fail', false);
  checkFalse(true, 'false is true');
  endDefect();
}

function  testItems(runConfig: RunConfig): Array<Item> {
  return [
    {
      id: 1,
      when: 'I run a test',
      then: 'i get the result',
      validators: [
        check_less_than_2,
        check_with_disabled_expectation,
        check_with_incorrect_disabled_expectation
      ]
    },

    {
      id: 2,
      when: 'I run another test',
      then: 'i get another result',
      validators: [
        check_less_than_2,
        check_less_than_3
      ]
    },

    {
      id: 3,
      when: 'I run another test',
      then: 'i get another result',
      data: 'random info used in test',
      validators: [
        check_bad_validator
      ]
    },

    {
      id: 4,
      when: 'I run another test',
      then: 'i get another result',
      validators: [
        check_bad_validator
      ]
    }

  ];
}

export const testCase: TestCase<Item, ApState, ValState>  = {
  testConfig: config,
  interactor: interactor,
  prepState: prepState,
  summarise: summarise,
  testItems: testItems
}

register(testCase)
