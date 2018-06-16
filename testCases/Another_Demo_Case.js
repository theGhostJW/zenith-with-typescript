// @flow

import {chk, chkEq, chkEqJson, chkFalse} from '../src/lib/AssertionUtils';
import * as _ from 'lodash';
import { debug } from '../src/lib/SysUtils';
import { hasText } from '../src/lib/StringUtils';
import { log, logError } from '../src/lib/Logging';
import { toTempString } from '../src/lib/FileUtils';
import type { RunConfig, TestCase, TestConfig, Validators, Country, Depth } from '../testCases/ProjectConfig';
import { register } from '../testCases/ProjectConfig';
import { check, checkTextContains } from '../src/lib/CheckUtils';
import moment from 'moment';

const config: TestConfig = {
  id: 2,
  when: 'i test anther case',
  then: 'it still works',
  owner: 'JW',
  enabled: true,
  countries: 'Australia'
}

type ApState = {|
  theWhen: string,
  obs: string
|}

type ValState = {|
  when: string
|}

export function interactor(item: Item, runConfig: RunConfig): ApState {

  return {
    theWhen: item.when,
    obs: 'blahh'
  }
}

function prepState(apState: ApState, item: Item, runConfig: RunConfig): ValState {
  return {
    when: apState.theWhen
  }
}

function summarise(runConfig: RunConfig, item: Item, apState: ApState, valState: ValState): string | null {
  return null;
}

function mockFilename(item: Item, runConfig: RunConfig) {
  return '';
}

type Item = {|
  id: number,
  when: string,
  then: string,
  validators: Validators<ValState>
|}

function check_when_text_contains_another(valState: ValState, valTime: moment$Moment) {
  checkTextContains(valState.when, 'another')
}

function  testItems(runConfig: RunConfig): Array<Item> {
  return [
    {
      id: 1,
      when: 'I run a test',
      then: 'the when statement is as expected',
      validators: check_when_text_contains_another
    },

    {
      id: 2,
      when: 'I run another test',
      then: 'the when statement is as expected',
      validators: [
          check_when_text_contains_another
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
