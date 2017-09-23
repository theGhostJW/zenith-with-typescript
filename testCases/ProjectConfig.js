// @flow
//

import type { BaseCase, BaseItem, BaseTestConfig, BaseRunConfig, GenericValidator, RunParams, NamedCase} from '../src/lib/TestRunner';
import { runTestItem, runTest, testRun } from '../src/lib/TestRunner';
import { forceArray } from '../src/lib/SysUtils';
import * as caseRunner from '../src/lib/TestRunner';
import * as _ from 'lodash';

export type Environment = "TST" | "UAT" | "PVT";
export type Depth = "Connectivity" | "Regression" | "DeepRegression" | "Special";
export type Country = "Australia" | "New Zealand";

export type RunConfig = {
  name: string,
  country?: Country,
  environment?: Environment,
  testCases?: Array<number|string> | number | string,
  depth?: Depth
}

export type FullRunConfig = {|
  name: string,
  country: Country,
  environment: Environment,
  testCases?: Array<number|string>,
  depth: Depth
|}

export type TestConfig = {
  id: number,
  when: string,
  then: string,
  owner: string,
  enabled: boolean,
  countries?: Array<Country> | Country,
  environments?: Array<Environment> | Environment,
  depth?: Depth
};

export type FullTestConfig = {|
  id: number,
  when: string,
  then: string,
  owner: string,
  enabled: boolean,
  countries: Array<Country>,
  environments: Array<Environment>,
  depth: Depth
|}

export type TestCase<I: BaseItem, S, V> = BaseCase<RunConfig, TestConfig, I, S, V>

export type Validator<V, I: BaseItem> = GenericValidator<V, I, RunConfig>

export type Validators<V, I: BaseItem> = Validator<V, I> | Array<Validator<V, I>>

export const register = <I: BaseItem, S, V>(testCase: TestCase<I, S, V>): void => caseRunner.register(testCase);

function setTestConfigDefaults(partialTestConfig: TestConfig): FullTestConfig {
  let defaultProps = {
    countries: 'Australia',
    environments: 'TST',
    depth: 'Regression'
  };
  let result = _.defaults(partialTestConfig, defaultProps);
  result.environments = forceArray(result.environments);
  result.countries = forceArray(result.countries);
  return result;
}

function setRunConfigDefaults(partialRunConfig: RunConfig): FullRunConfig {
  let defaultprops =  {
    country: 'Australia',
    environment: 'TST',
    testCases: null,
    depth: 'Regression'
  }
  return _.defaults(partialRunConfig, defaultprops);
}

function setRunparamsDefaults(runConfig: RunConfig, testList: Array<NamedCase<RunConfig, TestConfig, BaseItem, *, *>>): RunParams<RunConfig, FullRunConfig, TestConfig, FullTestConfig>  {
  return {
    runConfig: runConfig,
    testList: testList,
    runConfigDefaulter: setRunConfigDefaults,
    testConfigDefaulter: setTestConfigDefaults,
    testRunner: runTest,
    itemRunner: runTestItem
  }
}
