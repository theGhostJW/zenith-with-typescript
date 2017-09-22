// @flow

import { eachFile, testCaseFile, fileOrFolderName } from '../lib/FileUtils';
import { forceArray, functionNameFromFunction, objToYaml } from '../lib/SysUtils';
import { toString } from '../lib/StringUtils';
import { logStartRun, logEndRun, logStartTest, logEndTest, logStartIteration,
          logEndIteration, logError, pushLogFolder, popLogFolder, log } from '../lib/Logging';
import moment from 'moment';
import { now } from '../lib/DateTimeUtils';


const allCases: Array<any> = [];

let lastLoadedFileName = '??';
export function register<R: BaseRunConfig, T: BaseTestConfig, I: BaseItem, S, V>(testCase: BaseCase<R, T, I, S, V>): void {
  let namedCase: NamedCase<R, T, I, S, V> = ((testCase: any): NamedCase<R, T, I, S, V>);
  namedCase.name = lastLoadedFileName;
  allCases.push(namedCase);
}

export type GenericValidator<V, I : BaseItem, R> = (valState: V, item: I, runconfig: R, valTime: moment$Moment) => void

export type BaseRunConfig = $Subtype<RunConfigRequired>

export type RunConfigRequired = {
  name: string
}

export type BaseCase<R: BaseRunConfig, T: BaseTestConfig, I: BaseItem, S, V> = {
  testConfig: T,
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

export type  NamedCase<R: BaseRunConfig, T: BaseTestConfig, I: BaseItem, S, V> =  NamedObj<BaseCase<R, T, I, S, V>>

type NamedObj<T> = T & {
  name: string
}

export function loadAll<R, T>(){

  function loadFile(name, pth) {
    // Delete cache entry to make sure the file is re-read from disk.
    delete require.cache[pth];
    // Load function from file.
    lastLoadedFileName = name;
    var func = require(pth);
  }

  eachFile(testCaseFile(''), loadFile);
  allCases.forEach((c) => {
    console.log('==== ' + c.name + ' ====');
    console.log(toString(c.testItems()))
  });
}

export type RunParams<R: BaseRunConfig, T: BaseTestConfig> = {|
  testList: Array<NamedCase<R, T, *, *, *>>,
  runConfig: R,
  defaultTestConfig: $Subtype<BaseTestConfig>,
  defaultRunConfig: $Subtype<R>,
  itemRunner: ItemRunner<R, T>,
  testRunner: TestRunner<R, T>
|}

function executeValidator<T: BaseTestConfig, R: BaseRunConfig, I: BaseItem, V>(validator: GenericValidator<V, I, R>, valState: V, item: I, runConfig: R, valTime: moment$Moment) {
  pushLogFolder(functionNameFromFunction(validator));
  try {
    validator(valState, item, runConfig, valTime);
  } finally {
    popLogFolder();
  }
}

function runValidators<T: BaseTestConfig, R: BaseRunConfig, I: BaseItem, V>(validators: GenericValidator<V, I, R> | Array<GenericValidator<V, I, R>>, valState: V, item: I, runConfig: R, valTime: moment$Moment) {
  validators = forceArray(validators);
  const validate = (validator) => {
    let currentValidator = functionNameFromFunction(validator);
    pushLogFolder(currentValidator);
    try {
      executeValidator(validator, valState, item, runConfig, valTime);
    } catch (e) {
      logError('Exception thrown in validator: ' + currentValidator, objToYaml(e));
      throw(e);
    } finally {
      popLogFolder();
    }
  }
  validators.forEach(validate);
}

export function runTestItem<R: BaseRunConfig, T: BaseTestConfig, I: BaseItem, S, V>(baseCase: NamedCase<R, T, I, S, V>, runConfig: BaseRunConfig, item: I) {

  logStartIteration(item.id, baseCase.name, item.when, item.then);
  let stage = 'Executing Interactor';
  try {
    let apState: S = baseCase.interactor(item, runConfig);

    stage = 'Executing Prepstate - Transforming Apstate to ValState';
    let valState = baseCase.prepState(apState);

    stage = 'Executing Validators';
    runValidators(item.validators, valState, item, runConfig, now());
  }
  catch (e) {
    logError(`Exception Thrown ${stage}`, objToYaml(e));
  } finally {
    logEndIteration(item.id)
  }

}


function runTest<R: BaseRunConfig, T: BaseTestConfig, I: BaseItem, S, V>(testCase: NamedCase<R, T, I, S, V>, runConfig: R, itemRunner: ItemRunner<R, I>) : void {
  log('Loading Test Items');
  let itemList = testCase.testItems(runConfig);
  itemList.forEach((item) => itemRunner(testCase, runConfig, item));
}


export function testRun<T: BaseTestConfig, R: BaseRunConfig> (params: RunParams<T, R>): void {

  let runConfig = params.runConfig,
      runName = runConfig.name;

  logStartRun(runName, runConfig);
  try {
    let {itemRunner, testRunner, testList} = params;

    function runTestInstance(testCase) {
      let {
            testItems,
            testConfig,
            name
           } = testCase,
           id = testConfig.id
      logStartTest(id, name, testConfig.when, testConfig.then, testConfig);
      testRunner(testCase, runConfig, itemRunner);
      logEndTest(id, name);
    }
    testList.forEach(runTestInstance);

  } catch (e) {
    logError('Exception logged in a test run', objToYaml(e));
  } finally {
    logEndRun(runName);
  }

}

export type TestRunner<R: BaseRunConfig, T: BaseTestConfig> =
      <R: BaseRunConfig, T: BaseTestConfig, I: BaseItem, S, V>(NamedCase<R, T, I, S, V>, runConfig: R, itemRunner: ItemRunner<R, I>) => void

export type ItemRunner<R: BaseRunConfig, I: BaseItem> =
      <R: BaseRunConfig, T: BaseTestConfig, I: BaseItem, S, V>(baseCase: NamedCase<R, T, I, S, V>, runConfig: R, item: I) => void

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
