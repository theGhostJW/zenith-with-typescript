// @flow

import type { BaseCase, BaseItem, BaseTestConfig, BaseRunConfig,
              GenericValidator, RunParams, NamedCase, TestFilter
            } from '../src/lib/TestRunner';
import { runTestItem, runTest, testRun, loadAll} from '../src/lib/TestRunner';
import { forceArray, xOr, debug } from '../src/lib/SysUtils';
import { wildCardMatch } from '../src/lib/StringUtils';
import * as caseRunner from '../src/lib/TestRunner';
import * as _ from 'lodash';

const depthMap = {
  Connectivity: 0,
  Regression: 100,
  DeepRegression: 200,
  Special: -999
};

export type Environment = "TST" | "UAT" | "PVT";
export type Depth = $Keys<typeof depthMap>;
export type Country = "Australia" | "New Zealand";

export type RunConfig = {
  name: string,
  mocked: boolean,
  country?: Country,
  environment?: Environment,
  testCases?: Array<number|string> | number | string,
  depth?: Depth
}

export type FullRunConfig = {|
  name: string,
  mocked: boolean,
  country: Country,
  environment: Environment,
  testCases: Array<number|string>,
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
    mocked: false,
    environment: 'TST',
    testCases: [],
    depth: 'Regression'
  }
  return _.defaults(partialRunConfig, defaultprops);
}

function setRunParamsDefaults(runConfig: RunConfig, testList: Array<NamedCase<RunConfig, TestConfig, BaseItem, *, *>>): RunParams<RunConfig, FullRunConfig, TestConfig, FullTestConfig>  {
  return {
    runConfig: runConfig,
    testList: testList,
    runConfigDefaulter: setRunConfigDefaults,
    testConfigDefaulter: setTestConfigDefaults,
    testRunner: runTest,
    itemRunner: runTestItem,
    testFilters: filters,
    itemFilter: undefined
  }
}

export function run(runConfig: RunConfig) {
  let testCases: Array<NamedCase<RunConfig, TestConfig, BaseItem, *, *>> = loadAll();
  let runParams: RunParams<RunConfig, FullRunConfig, TestConfig, FullTestConfig>  = setRunParamsDefaults(runConfig, testCases);
  testRun(runParams);
}

/* Test Filtering */
export type TestCaseFilter = TestFilter<FullRunConfig, FullTestConfig>;

const filters: Array<TestCaseFilter> = [
    is_enabled,
    in_list,
    test_depth,
    environment_match,
    country_match
]

export function is_enabled(name: string, testConfig: FullTestConfig, runConfig: FullRunConfig): boolean {
  return testConfig.enabled;
}

export function in_list(name: string, testConfig: FullTestConfig, runConfig: FullRunConfig): boolean {
  let testCases = runConfig.testCases;
  return testCases.length == 0 ||
        testCases.find(s => typeof s == 'string' && wildCardMatch(name, s)) != null ||
        testCases.find(n => typeof n == 'number' && n === testConfig.id) != null;
}

export function test_depth(name: string, testConfig: FullTestConfig, runConfig: FullRunConfig) {
  let testDepth = testConfig.depth,
      runDepth = runConfig.depth;

  return !xOr(testDepth == 'Special', runDepth == 'Special') && depthMap[runDepth] >= depthMap[testDepth];
}

export function environment_match(name: string, testConfig: FullTestConfig, runConfig: FullRunConfig): boolean {
  return testConfig.environments.includes(runConfig.environment);
}

export function country_match(name: string, testConfig: FullTestConfig, runConfig: FullRunConfig) {
  return testConfig.countries.includes(runConfig.country);
}
