// @flow

import { eachFile, testCaseFile } from '../lib/FileUtils';
import moment from 'moment';


const allCases: Array<any> = [];

export function register<R: PartialRunConfig, T: BaseTestConfig>(testCase: RegisteredCase<R, T>): void {
  allCases.push(testCase);
}

export type Validator<V, I : PartialItem, R> = (valState: V, item: I, runconfig: R, valTime: moment$Moment) => void

export type BaseRunConfig = $Subtype<MinRunConfig>

type MinRunConfig = {
  name: string
}

export type RegisteredCase<R: PartialRunConfig, T: BaseTestConfig> = {
  config: T,
  interactor: (runConfig: R, item: PartialItem) => {[string]: any},
  prepState: (apState: {[string]: any}) => {[string]: any},
  summarise: (runConfig: R, item: PartialItem, apState: {[string]: any}) => string,
  mockFileName: ?(item: PartialItem, runConfig: R) => string,
  testItems: (runConfig: R) => Array<PartialItem>
}

export type BaseCase<R: PartialRunConfig,  T: BaseTestConfig, I: PartialItem, S, V> = {
  config: T,
  interactor: (item: I, runConfig: R) => S,
  prepState: (apState: S) => V,
  summarise: (runConfig: R, item: I, apState: S, valState: V) => string,
  mockFileName?: (item: I, runConfig: R) => string,
  testItems: (runConfig: R) => Array<I>
}

export type PartialRunConfig = $Subtype<RunConfigRequired>;

export type RunConfigRequired = {
  name: string
}

export type PartialItem = $Subtype<ItemRequired>;

export type ItemRequired = {
                    id: number,
                    when: string,
                    then: string,
                    validators: Array<Validator<*, *, *>>
                  };

export type BaseTestConfig = $Subtype<TestConfigRequired>;

export type TestConfigRequired = {
                    id: number,
                    when: string,
                    then: string
                  };

export function loadAll<R, T>(){

  function loadFile(name, pth) {
    // Delete cache entry to make sure the file is re-read from disk.
    delete require.cache[pth];
    // Load function from file.
    var func = require(pth);
  }

  eachFile(testCaseFile(''), loadFile);
//  cases.forEach((info) => {console.log(info.name); info.func()});

}
