// @flow
//

import type { BaseCase, BaseItem, BaseTestConfig, BaseRunConfig, GenericValidator, RunParams } from '../src/lib/TestRunner';
import { runTestItem,  } from '../src/lib/TestRunner';
import * as caseRunner from '../src/lib/TestRunner';

export type Environment = "TST" | "UAT" | "PVT";
export type Depth = "Connectivity" | "Regression" | "DeepRegression" | "Special";
export type Country = "Australia" | "New Zealand";

export type RequiredRunConfig = {
  name: string
}

export type OptionalRunConfig = {
  country?: Country,
  environment?: Environment,
  testCases?: Array<number|string> | number | string,
  depth?: Depth
}

export type PartialRunConfig = RequiredRunConfig & OptionalRunConfig;

export type RunConfig = {|
  name: string,
  country: Country,
  environment: Environment,
  testCases: Array<number|string> | number | string,
  depth: Depth
|}

export type RequiredTestConfig = {
  id: number,
  when: string,
  then: string,
  owner: string,
  enabled: boolean
}

export type OptionalTestConfig = {
  countries?: Array<Country> | Country,
  environments?: Array<Environment> | Environment,
  depth?: Depth
}

export type TestConfig = RequiredTestConfig & OptionalTestConfig;

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

export type TestCase<I, S, V> = BaseCase<RunConfig, RequiredTestConfig, I, S, V>

export type Validator<V, I: BaseItem> = GenericValidator<V, I, RunConfig>

export type Validators<V, I: BaseItem> = Validator<V, I> | Array<Validator<V, I>>

export const register = <I: BaseItem, S, V>(testCase: TestCase<I, S, V>): void => caseRunner.register(testCase);

// export const DEFAULT_RUN_CONFIG: RunConfig = {
//   name: 'Default Config',
//   country: 'Australia',
//   environment: 'TST',
//   depth: 'Regression'
// }

// export const DEFAULT_TEST_CONFIG: TestConfig = {
//   id: -1,
//   when: '',
//   then: '',
//   owner: string,
//   enabled: boolean,
//   countries: Array<Country>,
//   environments: Array<Environment>,
//   depth: Depth
// }
//
// export function runParams(testList: Array<PartialTestConfig>, runConfig: PartialRunConfig): RunParams<PartialTestConfig, PartialRunConfig> {
//   return {
//     testList: testList,
//     runConfig: runConfig,
//     defaultTestConfig: $Subtype<T>,
//     defaultRunConfig: DEFAULT_RUN_CONFIG,
//     itemRunner: ItemRunner<R, T>,
//     testRunner: TestRunner<R, T>
//   }
// }
