import { BaseCase, BaseItem, BaseTestConfig, BaseRunConfig,
              GenericValidator, RunParams, NamedCase
            } from '../src/lib/TestRunner';
import { runTestItem, defaultTestRunner, testRun, loadAll, itemFilter} from '../src/lib/TestRunner';
import { forceArray, areEqual, def } from '../src/lib/SysUtils';
import * as caseRunner from '../src/lib/TestRunner';
import { filters } from './TestFilters';
import { show } from '../src/lib/StringUtils';
import { fileOrFolderNameNoExt } from '../src/lib/FileUtils';
const _ = require('lodash');

export function mockFileNameUseEnvironment(itemId: number | null, testName: string, runConfig: RunConfig){
  return fileOrFolderNameNoExt(testName) + '_' + show(itemId) + '_' + show(runConfig.environment) + '.yaml';
}

export function testCaseEndPoint(endPointConfig: TestCaseEndPointParams<any, any, any, any, any>) {
  let allTestCases: NamedCase<RunConfig, TestConfig, BaseItem, any, any>[] = loadAll();

  let testCase: NamedCase<RunConfig, TestConfig, BaseItem, any, any> = <any>endPointConfig.testCase,
      testCaseConfig = testCase.testConfig,
      namedCase = allTestCases.find(tc => areEqual(tc.testConfig, testCaseConfig));

  testCase.name = (<any>def(namedCase, {})).name;
  testCase.path = (<any>def(namedCase, {})).path;

  let testCases: NamedCase<RunConfig, TestConfig, BaseItem, any, any>[] = [testCase],
      runConfig = _.omit(endPointConfig,  'testCase', 'selector');

  runConfig.name = `Test Case EndPoint ~ ${testCase.name}`;

  let runParams: RunParams<RunConfig, FullRunConfig, TestConfig, FullTestConfig> = setRunParamsDefaults(runConfig, testCases);
  runParams.testRunner = defaultTestRunner(itemFilter(endPointConfig.selector));
  testRun(runParams);
}

export function run(runConfig: RunConfig) {
  let testCases: NamedCase<RunConfig, TestConfig, BaseItem, any, any>[] = loadAll(),
      runParams: RunParams<RunConfig, FullRunConfig, TestConfig, FullTestConfig>  = setRunParamsDefaults(runConfig, testCases);
  testRun(runParams);
}

export enum Depth {
  Connectivity = 0,
  Regression = 100,
  DeepRegression = 200,
  Special = -999
};

export enum Environment { "TST", "UAT", "PVT"};
export enum Country {
                      "Australia",
                      "New Zealand"
                    };

export const AllCountries = [Country.Australia, Country["New Zealand"]];

// could be partly moved to testRunner plus filters
export type TestCaseEndPointParams<R extends BaseRunConfig, T extends BaseTestConfig, I extends BaseItem, S, V> = {
  testCase: BaseCase<R, T, I, S, V>,
  selector?: Number | Partial<I> | ((testItem: I, fullList: I[]) => boolean),
  mocked?: boolean,
  country?: Country,
  environment?: Environment,
  testCases?: (number|string)[] | number | string,
  depth?: Depth
}

export interface RunConfig {
  name: string,
  mocked: boolean,
  country?: Country,
  environment?: Environment,
  testCases?: (number|string)[] | number | string,
  depth?: Depth
}

export interface FullRunConfig {
  name: string,
  mocked: boolean,
  country: Country,
  environment: Environment,
  testCases: (number|string)[],
  depth: Depth
}

export interface TestConfig {
  when: string,
  then: string,
  owner: string,
  enabled: boolean,
  countries?: Country[] | Country,
  environments?: Environment[] | Environment,
  depth?: Depth
};

export interface FullTestConfig {
  when: string,
  then: string,
  owner: string,
  enabled: boolean,
  countries: Country[],
  environments: Environment[],
  depth: Depth
}

export type TestCase<I extends BaseItem, S, V> = BaseCase<RunConfig, TestConfig, I, S, V>

export type Validator<V> = GenericValidator<V>

export type Validators<V> = Validator<V> | Validator<V>[]

export const register = <I extends BaseItem, S, V>(testCase: TestCase<I, S, V>): void => caseRunner.register(testCase);

function setTestConfigDefaults(partialTestConfig: TestConfig): FullTestConfig {
  let defaultProps = {
    countries: Country.Australia,
    environments: 'TST',
    depth: Depth.Regression
  };
  let result = _.defaults(partialTestConfig, defaultProps);
  result.environments = forceArray(result.environments);
  result.countries = forceArray(result.countries);
  return result;
}

function setRunConfigDefaults(partialRunConfig: RunConfig): FullRunConfig {
  let defaultprops =  {
    country: Country.Australia,
    mocked: false,
    environment: 'TST',
    testCases: [],
    depth: Depth.Regression
  }
  return _.defaults(partialRunConfig, defaultprops);
}

function setRunParamsDefaults(runConfig: RunConfig, testList: NamedCase<RunConfig, TestConfig, BaseItem, any, any>[]): RunParams<RunConfig, FullRunConfig, TestConfig, FullTestConfig>  {
  return {
    rc: runConfig,
    testList: testList,
    runConfigDefaulter: setRunConfigDefaults,
    testConfigDefaulter: setTestConfigDefaults,
    testRunner: defaultTestRunner(),
    itemRunner: runTestItem,
    testFilters: filters,
    mockFileNameGenerator: mockFileNameUseEnvironment
  }
}
