// @flow

import { eachFile, testCaseFile } from '../lib/FileUtils';
import { forceArray, functionNameFromFunction, objToYaml } from '../lib/SysUtils';
import { toString } from '../lib/StringUtils';
import { logStartRun, logEndRun, logStartTest, logEndTest, logStartIteration,
          logEndIteration, logError, pushLogFolder, popLogFolder } from '../lib/Logging';
import moment from 'moment';
import { now } from '../lib/DateTimeUtils';


const allCases: Array<any> = [];

export function register<R: BaseRunConfig, T: BaseTestConfig, I: BaseItem, S, V>(testCase: BaseCase<R, T, I, S, V>): void {
  allCases.push(testCase);
}

export type GenericValidator<V, I : BaseItem, R> = (valState: V, item: I, runconfig: R, valTime: moment$Moment) => void

export type BaseRunConfig = $Subtype<RunConfigRequired>

export type RunConfigRequired = {
  name: string
}

export type BaseCase<R: BaseRunConfig, T: BaseTestConfig, I: BaseItem, S, V> = {
  config: T,
  interactor: (item: I, runConfig: R) => S,
  prepState: (apState: S) => V,
  summarise: (runConfig: R, item: I, apState: S, valState: V) => string,
  mockFileName?: (item: I, runConfig: R) => string,
  testItems: (runConfig: R) => Array<I>
}

export type BaseItem = $Subtype<ItemRequired>;

export type ItemRequired = {
                    id: number,
                    when: string,
                    then: string,
                    validators: GenericValidator<*, *, *> | Array<GenericValidator<*, *, *>>
                  };

export type BaseTestConfig = $Subtype<TestConfigRequired>;

export type TestConfigRequired = {
                    id: number,
                    when: string,
                    then: string,
                    enabled: boolean
                  };

type  NamedCase<R: BaseRunConfig, T: BaseTestConfig, I: BaseItem, S, V> =  NamedObj<BaseCase<R, T, I, S, V>>

type NamedObj<T> = T & {
  name: string
}

export function loadAll<R, T>(){

  function loadFile(name, pth) {
    // Delete cache entry to make sure the file is re-read from disk.
    delete require.cache[pth];
    // Load function from file.
    var func = require(pth);
  }

  eachFile(testCaseFile(''), loadFile);
  allCases.forEach((c) => {console.log(toString(c.testItems()))});
}

export type RunParams<T: BaseTestConfig, R: BaseRunConfig> = {|
  testList: Array<BaseTestConfig>,
  runConfig: R,
  defaultTestConfig: $Subtype<BaseTestConfig>,
  defaultRunConfig: $Subtype<R>,
  baseRunner: BaseTestRunner<T, R>,
  baseItemRunner: BaseItemRunner<T, R>
|}

function runTestItem<T: BaseTestConfig, R: BaseRunConfig, I: BaseItem, S, V>(baseCase: NamedCase<R, T, I, S, V>, item: I, runConfig: BaseRunConfig) {

  logStartIteration(item.id, baseCase.name, item.when, item.then);
  let stage = 'Executing Interactor';
  try {
    let apState: S = baseCase.interactor(item, runConfig);

    stage = 'Executing Prepstate - Transforming Apstate to ValState';
    let valState = baseCase.prepState(apState);

    stage = 'Executing Validators';
    let validators = forceArray(item.validators);

    function executeValidator(validator: GenericValidator<V, I, R>) {

      pushLogFolder(functionNameFromFunction(validator));
      try {
        validator(valState, item, runConfig, now())
      } finally {
        popLogFolder();
      }
    }
    validators.forEach(executeValidator)
  }
  catch (e) {
    logError(`Exception Thrown ${stage}`, objToYaml(e));
  } finally {
    logEndIteration(item.id)
  }

}


export function testRun<T: BaseTestConfig, R: BaseRunConfig> (params: RunParams<T, R>) {

}

export type BaseTestRunner<T: BaseTestConfig, R: BaseRunConfig> =
      <T: BaseTestConfig, R: BaseRunConfig, I: BaseItem, S, V>(BaseCase<R, T, I, S, V>) => void

export type BaseItemRunner<I: BaseItem, R: BaseRunConfig> =
      <T: BaseTestConfig, R: BaseRunConfig, I: BaseItem, S, V>(BaseCase<R, T, I, S, V>, item: I) => void

// function runTests(configFileNoDirOrConfigObj, defaultRunConfigInfo, defaultTestConfigInfo, testFilters, simpleLogProcessingMethod, testOverrideFunc, preTestRunFunction){
//   // TC Logging Defaults
//   fullyEnableCallStack();
//
//   // allow for multiple calls to run tests from one function call
//   if (simplifiedLog.length > 0){
//     simplifiedLogsForPreviousRuns.push(simplifiedLog);
//     simplifiedLog = [];
//   }
//
//   ensure(hasValue(configFileNoDirOrConfigObj), 'configFileNoDirOrConfigObj - is null');
//   var runConfig = _.isString(configFileNoDirOrConfigObj) ? getLastRunConfig() : configFileNoDirOrConfigObj;
//   runFromConfig(configFileNoDirOrConfigObj, defaultRunConfigInfo, defaultTestConfigInfo, testFilters, simpleLogProcessingMethod,  testOverrideFunc, preTestRunFunction);
// }
