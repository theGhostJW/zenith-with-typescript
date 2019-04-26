// @flow

import {chk, chkEq, chkEqJson, chkFalse} from '../src/lib/AssertionUtils';
import * as _ from 'lodash';
import { debug, fail, waitRetry, delay } from '../src/lib/SysUtils';
import { log, expectDefect, endDefect, logException, logError } from '../src/lib/Logging';
import { toTempString } from '../src/lib/FileUtils';
import { show } from '../src/lib/StringUtils';
import child_process from 'child_process'
import type { RunConfig, TestCase, TestConfig, Validators, Country, Depth } from '../testCases/ProjectConfig';
import { register } from '../testCases/ProjectConfig';
import { check, checkFalse} from '../src/lib/CheckUtils';
import * as wd from 'webdriverio';
import moment from 'moment';


let config: TestConfig = {
  when: 'I go to catch',
  then: 'I get caught',
  owner: 'JW',
  enabled: true,
  countries: ['New Zealand', 'Australia']
}

export type Item = {|
  id: number,
  url?: string,
  when: string,
  then: string,
  data?: string,
  validators: Validators<DState>
|}

export type ApState = {|
  id: number,
  url: string,
  observation: string
|}

type DState = {|
  id: number,
  url: string,
  title: string
|}

const catchUrl : string = "https://www.catch.com.au";
/*
 login
 choose category 
 mouse over category 
 list categories
 click each check no 404 ing



*/

export function interactor(item: Item, runConfig: RunConfig): ApState {
  log("Going URL");
  browser.url(catchUrl);
  log("Gone URL");

  let url = browser.getUrl();
  log("Got URL");   

  let title = browser.getTitle();
  log("Got title");

  //$('a.is-category:nth-child(1)').moveTo();
  //delay(5000);
  // let url = catchUrl,
  //     title = 'NO URL IN ITEM - TITLE IS N/A',
  //     actualUrl = 'NO URL IN ITEM - URL IS N/A';

  // if (url != null){
  //   browser.url(url);
  //   title = browser.getTitle();
  //   actualUrl = browser.getUrl();
  // }

  return {
    id: item.id,
    url: url,
    observation: title
  }
}

function prepState(apState: ApState, item: Item, runConfig: RunConfig): DState {
  return {
    id: apState.id,
    url: apState.url,
    title: apState.observation
  }
}

function summarise(runConfig: RunConfig, item: Item, apState: ApState, dState: DState): string | null {
  return null;
}

function mockFilename(item: Item, runConfig: RunConfig) {
  return '';
}

function check_id_less_than_2(dState: DState, valTime: moment$Moment) {
  expectDefect('should fail');
  check(dState.id < 2, 'expect less than 2', `${dState.id} should be less than 2`);
  endDefect();
}

function check_less_than_3(dState: DState, valTime: moment$Moment) {
  check(dState.id < 3, 'expect less than 2')
}

function check_bad_validator(dState: DState, valTime: moment$Moment) {
  throw('ARGGGHHHHHH!!!')
}

function check_with_disabled_expectation(dState: DState, valTime: moment$Moment) {
  expectDefect('should not fail', false);
  check(true, 'true is true');
  endDefect();
}

function check_with_incorrect_disabled_expectation(dState: DState, valTime: moment$Moment) {
  expectDefect('should fail', false);
  checkFalse(true, 'false is true');
  endDefect();
}

function  testItems(runConfig: RunConfig): Item[] {
  return [
    {
      id: 1,
      when: 'I run a test',
      then: 'i get the result',
      url: 'http://google.com',
      validators: [
        check_id_less_than_2,
        check_with_disabled_expectation,
        check_with_incorrect_disabled_expectation
      ]
    },

    {
      id: 2,
      when: 'I run another test',
      then: 'i get another result',
      url: 'http://webdriver.io/api.html',
      validators: [
        check_id_less_than_2,
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

export const testCase: TestCase<Item, ApState, DState>  = {
  testConfig: config,
  interactor: interactor,
  prepState: prepState,
  summarise: summarise,
  testItems: testItems
}

register(testCase)
