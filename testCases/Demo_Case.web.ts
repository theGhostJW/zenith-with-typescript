import { log, expectDefect, endDefect } from '../src/lib/Logging';
import { RunConfig, TestCase, TestConfig, Validators, Country, Depth, register } from './ProjectConfig';
import { chk, chkFalse} from '../src/lib/CheckUtils';
import { Moment } from 'moment';
const wd = require('webdriverio');
const moment = require('moment');

let config: TestConfig = {
  title: 'a randome demo case',
  owner: 'JW',
  enabled: true,
  countries: ["Australia", "New Zealand"]
}

export type Item = {
  id: number,
  url?: string,
  when: string,
  then: string,
  data?: string,
  validators: Validators<DState>
}

export type ApState = {
  id: number,
  url: string,
  observation: string
}

type DState = {
  id: number,
  url: string,
  title: string
}

export function interactor(item: Item, runConfig: RunConfig): ApState {
  log("starting");
  let url = item.url,
      title = 'NO URL IN ITEM - TITLE IS N/A',
      actualUrl = 'NO URL IN ITEM - URL IS N/A';

  if (url != null){
    browser.url(url);
    actualUrl = <any>browser.getUrl();
  }

  return {
    id: item.id,
    url: actualUrl,
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

function mockFilename(item: Item, runConfig: RunConfig) {
  return '';
}

function check_id_less_than_2(dState: DState) {
  expectDefect('should fail');
  chk(dState.id < 2, 'expect less than 2', `${dState.id} should be less than 2`);
  endDefect();
}

function check_less_than_3(dState: DState) {
  chk(dState.id < 3, 'expect less than 2')
}

function check_bad_validator(dState: DState) {
  throw('ARGGGHHHHHH!!!')
}

function check_with_disabled_expectation(dState: DState) {
  expectDefect('should not fail', false);
  chk(true, 'true is true');
  endDefect();
}

function check_with_incorrect_disabled_expectation(dState: DState) {
  expectDefect('should fail', false);
  chkFalse(true, 'false is true');
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
  testItems: testItems
}

register(testCase)
