// @flow
//

import type { BaseCase, PartialItem, PartilalTestConfig, BaseRunConfig } from '../src/lib/CaseRunner';


type Environment = "TST" | "UAT" | "PVT";
type Depth = "Connectivity" | "Regression" | "DeepRegression" | "Special";
type Country = "Australia" | "New Zealand";

export type RunConfig = {
  name: string,
  country?: Country,
  environment?: Environment,
  depth?: Depth
}

export type PartialRunConfig = $Subtype<RunConfig>

export type TestConfig = {
  id: number,
  when: string,
  then: string,
  owner: string,
  countries?: (Country | Array<Country>),
  environments?: (Environment | Array<Environment>),
  depth?: Depth
}

export type TestCase<I, S, V> = BaseCase<RunConfig, TestConfig, I, S, V>
