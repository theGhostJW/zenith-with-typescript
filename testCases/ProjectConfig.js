// @flow
//

import type { BaseCase, BaseItem, BaseTestConfig, BaseRunConfig, GenericValidator } from '../src/lib/TestRunner';
import * as caseRunner from '../src/lib/TestRunner';

export type Environment = "TST" | "UAT" | "PVT";
export type Depth = "Connectivity" | "Regression" | "DeepRegression" | "Special";
export type Country = "Australia" | "New Zealand";

export type RunConfig = {
  name: string,
  country: Country,
  environment: Environment,
  depth: Depth
}

export type PartialRunConfig = {
  name: string,
  country?: Country,
  environment?: Environment,
  depth?: Depth
}

export type TestConfig = {|
  id: number,
  when: string,
  then: string,
  owner: string,
  enabled: boolean,
  countries?: (Country | Array<Country>),
  environments?: (Environment | Array<Environment>),
  depth?: Depth
|}

export type FullTestConfig = {
  id: number,
  when: string,
  then: string,
  owner: string,
  countries: Array<Country>,
  environments: Array<Environment>,
  depth: Depth
}

export type TestCase<I, S, V> = BaseCase<RunConfig, TestConfig, I, S, V>

export type Validator<V, I: BaseItem> = GenericValidator<V, I, RunConfig>

export type Validators<V, I: BaseItem> = Validator<V, I> | Array<Validator<V, I>>

export const register = <I: BaseItem, S, V>(testCase: TestCase<I, S, V>): void => caseRunner.register(testCase)
