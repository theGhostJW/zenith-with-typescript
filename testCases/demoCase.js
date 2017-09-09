// @flow

import {chk, chkEq, chkEqJson, chkFalse} from '../src/lib/AssertionUtils';
import * as _ from 'lodash';
import { debug } from '../src/lib/SysUtils';
import { register } from '../src/lib/CaseRunner';
import { log } from '../src/lib/Logging';
import { toTempString } from '../src/lib/FileUtils';
import child_process from 'child_process'
import type { RunConfig, TestCase, TestConfig } from '../testCases/ProjectConfig';
import moment from 'moment';

var config: TestConfig = {
  id: 1,
  when: '',
  then: '',
  owner: 'JW',
  country: ''
}

type Item = {
  id: number,
  when: string,
  then: string,
  validators: Array<(ValState, Item, RunConfig, moment$Moment) => void>
}

type ApState = {
  obs: string
}

type ValState = {

}

function prepState(apState: ApState): ValState {
  return {}
}

function interactor(item: Item, runConfig: RunConfig): ApState {
  
  return {
    obs: 'blahh'
  }
}

function summarise(runConfig: RunConfig, item: Item, apState: ApState, valState: ValState): string {
  return 'Summarry not implemented'
}

function mockFilename(item: Item, runConfig: RunConfig) {
  return '';
}

function  testItems(runConfig: RunConfig): Array<Item> {
  return [];
}

const testcase: TestCase<Item, ApState, ValState>  = {
  config: config,
  interactor: interactor,
  prepState: prepState,
  summarise: summarise,
  testItems: testItems
}
