// @flow

import {chk, chkEq, chkEqJson, chkFalse} from '../src/lib/AssertionUtils';
import * as _ from 'lodash';
import { debug } from '../src/lib/SysUtils';
import { log } from '../src/lib/Logging';
import { toTempString } from '../src/lib/FileUtils';
import child_process from 'child_process'
import type { RunConfig, TestCase, TestConfig, Validators, Country, Depth } from '../testCases/ProjectConfig';
import { register } from '../testCases/ProjectConfig';
import { check } from '../src/lib/CheckUtils';
import moment from 'moment';

var config: TestConfig = {
  id: 1,
  when: '',
  then: '',
  owner: 'JW',
  enabled: true,
  countries: 'New Zealand'
}

function interactor(item: Item, runConfig: RunConfig): ApState {

  return {
    id: item.id,
    obs: 'blahh'
  }
}

type ApState = {|
  id: number,
  obs: string
|}

type ValState = {|
  id: number
|}

function prepState(apState: ApState): ValState {
  return {
    id: 1
  }
}

function summarise(runConfig: RunConfig, item: Item, apState: ApState, valState: ValState): string {
  return 'Summarry not implemented'
}

function mockFilename(item: Item, runConfig: RunConfig) {
  return '';
}

type Item = {|
  id: number,
  when: string,
  then: string,
  validators: Validators<ValState, Item>
|}

function check_something(valState: ValState, item: Item, runConfig: RunConfig, valTime: moment$Moment) {

}

function check_something_else(valState: ValState, item: Item, runConfig: RunConfig, valTime: moment$Moment) {

}

function  testItems(runConfig: RunConfig): Array<Item> {
  return [
    {
      id: 1,
      when: 'I run a test',
      then: 'i get the result',
      validators: check_something
    },

    {
      id: 2,
      when: 'I run another test',
      then: 'i get another result',
      validators: [
        check_something,
        check_something_else
      ]
    }

  ];
}

const testCase: TestCase<Item, ApState, ValState>  = {
  testConfig: config,
  interactor: interactor,
  prepState: prepState,
  summarise: summarise,
  testItems: testItems
}

register(testCase)
