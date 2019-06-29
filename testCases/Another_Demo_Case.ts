import * as _ from 'lodash';
import { register, RunConfig, TestCase, TestConfig, Validators, Country, Depth } from './ProjectConfig';
import { chkTextContains } from '../src/lib/CheckUtils';

const config: TestConfig = {
  title: 'another test case',
  owner: 'JW',
  enabled: true,
  countries: "Australia"
}

interface ApState {
  theWhen: string,
  obs: string
}

interface DState {
  when: string
}

export function interactor(item: Item, runConfig: RunConfig): ApState {

  return {
    theWhen: item.when,
    obs: 'blahh'
  }
}

function prepState(apState: ApState, item: Item, runConfig: RunConfig): DState {
  return {
    when: apState.theWhen
  }
}

interface Item {
  id: number,
  when: string,
  then: string,
  validators: Validators<DState>
}

function check_when_text_contains_another(dState: DState) {
  chkTextContains(dState.when, 'another')
}

function  testItems(runConfig: RunConfig): Item[] {
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

export const testCase: TestCase<Item, ApState, DState>  = {
  testConfig: config,
  interactor: interactor,
  prepState: prepState,
  testItems: testItems
}

register(testCase)
