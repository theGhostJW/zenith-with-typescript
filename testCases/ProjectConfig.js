// @flow

import type { BaseCase, BaseItem, BaseTestConfig, BaseRunConfig,
              GenericValidator, RunParams, NamedCase, TestFilter,
              EndPointInfo, MockFileNameFunction
            } from '../src/lib/TestRunner';
import { runTestItem, runTest, testRun, loadAll, itemFilter} from '../src/lib/TestRunner';
import { forceArray, cast, debug, areEqual, def } from '../src/lib/SysUtils';
import * as caseRunner from '../src/lib/TestRunner';
import { filters } from '../testCases/TestFilters';
import { toString } from '../src/lib/StringUtils';
import { fileOrFolderNameNoExt } from '../src/lib/FileUtils';
import * as _ from 'lodash';

export const mockFileNameUseEnvironment: MockFileNameFunction<RunConfig> =
                  (itemId, testName, runConfig) => fileOrFolderNameNoExt(testName) + '_' + toString(itemId) + '_' + toString(runConfig.environment) + '.yaml';


export function testCaseEndPoint(endPointConfig: TestCaseEndPointParams<*, *, *, *, *>) {
  let allTestCases: Array<NamedCase<RunConfig, TestConfig, BaseItem, *, *>> = loadAll();

  let testCase: NamedCase<RunConfig, TestConfig, BaseItem, *, *> = cast(endPointConfig.testCase),
      testCaseConfig = testCase.testConfig,
      namedCase = allTestCases.find(tc => areEqual(tc.testConfig, testCaseConfig));

  testCase.name = cast(def(namedCase, {})).name;

  let testCases: Array<NamedCase<RunConfig, TestConfig, BaseItem, *, *>> = [testCase],
      runConfig = _.omit(endPointConfig,  'testCase', 'selector');

  runConfig.name = `Test Case EndPoint ~ ${testCase.name}`;

  let runParams: RunParams<RunConfig, FullRunConfig, TestConfig, FullTestConfig> = setRunParamsDefaults(runConfig, testCases);
  runParams.testRunner = runTest(itemFilter(endPointConfig.selector));
  testRun(runParams);
}

export function run(runConfig: RunConfig) {
  let testCases: Array<NamedCase<RunConfig, TestConfig, BaseItem, *, *>> = loadAll();
  let runParams: RunParams<RunConfig, FullRunConfig, TestConfig, FullTestConfig>  = setRunParamsDefaults(runConfig, testCases);
  testRun(runParams);
}

export const depthMap = {
  Connectivity: 0,
  Regression: 100,
  DeepRegression: 200,
  Special: -999
};

export type Environment = "TST" | "UAT" | "PVT";
export type Depth = $Keys<typeof depthMap>;
export type Country = "Australia" | "New Zealand";


export type TestCaseEndPointParams<R, T, I, S, V> = {|
  testCase: BaseCase<R, T, I, S, V>,
  selector?: Number |  $Supertype<R> | (testItem: I, fullList: Array<I>) => boolean,
  mocked?: boolean,
  country?: Country,
  environment?: Environment,
  testCases?: Array<number|string> | number | string,
  depth?: Depth
|}

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
    testRunner: runTest(),
    itemRunner: runTestItem,
    testFilters: filters,
    mockFileNameGenerator: mockFileNameUseEnvironment
  }
}
