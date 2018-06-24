// @flow

import { wildCardMatch } from '../src/lib/StringUtils';
import { forceArray, xOr, debug } from '../src/lib/SysUtils';
import { depthMap } from '../testCases/ProjectConfig';
import type { FullRunConfig, FullTestConfig } from '../testCases/ProjectConfig';
import type { TestFilter } from '../src/lib/TestRunner';
import * as _ from 'lodash';

export type TestCaseFilter = TestFilter<FullRunConfig, FullTestConfig>;

export const filters: TestCaseFilter[] = [
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
