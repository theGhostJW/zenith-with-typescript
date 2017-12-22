// @flow

import { eachFile, testCaseFile, fileOrFolderName, logFile } from '../lib/FileUtils';
import { forceArray, functionNameFromFunction, objToYaml, reorderProps, debug, areEqual } from '../lib/SysUtils';
import { toString, newLine} from '../lib/StringUtils';
import { logStartRun, logEndRun, logStartTest, logEndTest, logStartIteration,
          logEndIteration, logError, pushLogFolder, popLogFolder, log,
          logIterationSummary, logFilterLog, logException, logValidationStart,
          logStartInteraction, logStartValidator, logEndValidator, logValidationEnd,
          logStartIterationSummary, logEndInteraction, logPrepValidationInfoStart,
          logPrepValidationInfoEnd, latestRawPath } from '../lib/Logging';
import moment from 'moment';
import { now } from '../lib/DateTimeUtils';
import * as _ from 'lodash';
import { parseLogDefault } from '../lib/LogParser';

export function runTest(itemFilter?: ItemFilter<*>){
  return function runTest<R: BaseRunConfig, T: BaseTestConfig, I: BaseItem, S, V>(testCase: NamedCase<R, T, I, S, V>, runConfig: R, itemRunner: ItemRunner<R, I>) : void {
    log('Loading Test Items');
    let itemList = testCase.testItems(runConfig);
    if (itemFilter != null){
      itemList = filterTestItems(itemList, itemFilter);
    }
    itemList.forEach((item) => itemRunner(testCase, runConfig, item));
  }
}

export function filterTestItems<FR>(testItems: Array<BaseItem>, fltr: (testItem: BaseItem, fullList: Array<BaseItem>) => boolean ): Array<BaseItem> {
  let predicate = (testItem: BaseItem): boolean => fltr(testItem, testItems);
  return testItems.filter(predicate);
}

// endpoint item filters
export function lastItem(testItem: BaseItem, fullList: Array<BaseItem>): boolean {
  return areEqual(_.last(fullList), testItem);
}

export function matchesProps<FR>(target: {[string]: any}): (testItem: BaseItem, fullList: Array<BaseItem>) => boolean {
  return function propsMatch(testItem: BaseItem, fullList: Array<BaseItem>): boolean {
    return _.chain(target)
            .keys()
            .every(k => areEqual(target[k], testItem[k]))
            .value();
  }
}

export function idFilter(id: number): (testItem: BaseItem, fullList: Array<BaseItem>) => boolean {
  return matchesProps({id: id});
}

export function allItems(testItem: BaseItem, fullList: Array<BaseItem>) {
  return true;
}

export type ItemFilter<I: BaseItem> = (I, Array<I>) => boolean

export function testRun<R: BaseRunConfig, FR: BaseRunConfig, T: BaseTestConfig, FT: BaseTestConfig> (params: RunParams<R, FR, T, FT>): void {

  let {
        itemRunner,
        testRunner,
        testList,
        runConfig,
        runConfigDefaulter,
        testConfigDefaulter,
        testFilters
      } = params,
      runName = runConfig.name;

  runConfig = runConfigDefaulter(runConfig);

  let filterResult = filterTests(testList, t => testConfigDefaulter(t.testConfig), testFilters, runConfig);
  logFilterLog(filterResult.log);
  testList = ((filterResult.items: any): Array<NamedCase<R, T, *, *, *>>);

  logStartRun(runName, runConfig);
  try {

    function runTestInstance(testCase: NamedCase<R, T, *, *, *>) {
      let {
            testItems,
            testConfig,
            name
           } = testCase,
           id = testConfig.id;

      // ensure the testConfig is fully populated
      testConfig = testConfigDefaulter(testConfig);
      testCase.testConfig = ((testConfig: any): T);

      logStartTest(id, name, testConfig.when, testConfig.then, testConfig);
      testRunner(testCase, runConfig, itemRunner);
      logEndTest(id, name);
    }

    testList.forEach(runTestInstance);

  } catch (e) {
    logException(`Exception thrown in test run`, e);
  } finally {
    logEndRun(runName);
  }

  parseLogDefault(latestRawPath());
}

const allCases: Array<any> = [];

export type BaseRunConfig = {
  name: string,
  mocked: boolean
}

export type TestFilter<FR, FT> = (string, FT, FR) => boolean;

export type RunParams<R: BaseRunConfig, FR, T: BaseTestConfig, FT> = {|
  testList: Array<NamedCase<R, T, *, *, *>>,
  runConfig: R,
  testConfigDefaulter: T => FT,
  runConfigDefaulter: R => FR,
  testRunner: TestRunner<FR, FT>,
  itemRunner: ItemRunner<FR, *>,
  testFilters: Array<TestFilter<FR, FT>>,
  // used for endpoints
  itemFilter?: (FR, testItem: {[string]: any}, fullList: Array<{[string]: any}>) => boolean
|}

let lastLoadedFileName = '??';
export function register<R: BaseRunConfig, T: BaseTestConfig, I: BaseItem, S, V>(testCase: BaseCase<R, T, I, S, V>): void {
  let namedCase: NamedCase<R, T, I, S, V> = ((testCase: any): NamedCase<R, T, I, S, V>);
  namedCase.name = lastLoadedFileName;
  allCases.push(namedCase);
}

export type GenericValidator<V, I : BaseItem, R> = (valState: V, item: I, runconfig: R, valTime: moment$Moment) => void

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

export type BaseTestConfig = {
                    id: number,
                    when: string,
                    then: string,
                    enabled: boolean
                  };

export type NamedCase<R: BaseRunConfig, T: BaseTestConfig, I: BaseItem, S, V> =  NamedObj<BaseCase<R, T, I, S, V>>

type NamedObj<T> = T & {
  name: string
}

export function loadAll<R: BaseRunConfig, T: BaseTestConfig>(): Array<NamedCase<R, T, *, *, *>> {

  function loadFile(name, pth) {
    // Delete cache entry to make sure the file is re-read from disk.
    delete require.cache[pth];
    // Load function from file.
    lastLoadedFileName = name;
    var func = require(pth);
  }

  let testCaseDir = testCaseFile('');
  eachFile(testCaseDir, loadFile);
  return ((allCases: any): Array<NamedCase<R, T, *, *, *>>);
}

function runValidators<T: BaseTestConfig, R: BaseRunConfig, I: BaseItem, V>(validators: GenericValidator<V, I, R> | Array<GenericValidator<V, I, R>>, valState: V, item: I, runConfig: R, valTime: moment$Moment) {
  validators = forceArray(validators);
  function validate(validator){
    let currentValidator = functionNameFromFunction(validator);
    logStartValidator(currentValidator);
    try {
      validator(valState, item, runConfig, valTime);
    } catch (e) {
      throw('Exception thrown in validator: ' + currentValidator + newLine() + toString(e));
    }
    logEndValidator(currentValidator);
  }
  validators.forEach(validate);
}

type Action = () => void;

function exStage(stage: Action, stageName: string, preLog: Action, postLog: Action, continu: boolean) : boolean {
  if (!continu){
    return continu;
  }

  preLog();
  try {
    stage();
  }
  catch (e) {
    logException(`Exception Thrown ${stageName}`, e);
    continu = false;
  } finally {
    postLog();
  }
  return continu;
}

function validatorsToString(item): {} {
  let result = _.cloneDeep(item);
  result.validators = forceArray(result.validators).map(functionNameFromFunction);
  if (result.validators.length == 1) {
    result.validators = result.validators[0];
  }
  return result;
}

export function runTestItem<R: BaseRunConfig, T: BaseTestConfig, I: BaseItem, S, V>(baseCase: NamedCase<R, T, I, S, V>, runConfig: R, item: I) {

 logStartIteration(item.id, baseCase.name, item.when, item.then, validatorsToString(item));
 try {
    let apState: S,
        valState: V,
        continu = true;

    continu = exStage(() => {apState = baseCase.interactor(item, runConfig)},
                        'Executing Interactor',
                        logStartInteraction,
                        logEndInteraction,
                        continu);

    continu = exStage(() => {valState = baseCase.prepState(apState)},
                              'Preparing Validation Info',
                              logPrepValidationInfoStart,
                              logPrepValidationInfoEnd,
                              continu);
    let valTime = now();
    continu = exStage(() => runValidators(item.validators, valState, item, runConfig, valTime),
                              'Running Validators',
                              () => logValidationStart(valTime, valState),
                              logValidationEnd,
                              continu);

    let summary = '';
    continu = exStage(() => {summary = baseCase.summarise(runConfig, item, apState, valState)},
                                'Generating Summary',
                                logStartIterationSummary,
                                () => logIterationSummary(summary),
                                continu);
  }
  catch (e) {
    logException('Exception thrown in iteration');
  } finally {
    logEndIteration(item.id)
  }
}

export type FilterResult<C> = {
  items: Array<C>,
  log: {[string]: string}
}

export function filterTests<T, TC, R>(testCases: Array<NamedObj<T>>, configExtractor: T => TC, predicates: Array<(string, TC, R) => boolean>, runConfig: R): FilterResult<T> {

  let predicateNames = predicates.map(functionNameFromFunction);

  function pushLog(accum, testCase: NamedObj<T>) {
    let caseName = testCase.name,
        failIdx = predicates.findIndex(p => !p(caseName, configExtractor(testCase), runConfig)),
        accepted = failIdx < 0;

    if (accepted) {
      accum.items.push(testCase);
    }

    accum.log[caseName] = accepted ? 'Accepted' : predicateNames[failIdx];
    return accum;
  }

  let result = testCases.reduce(pushLog, {
                                items: [],
                                log: {}
                              });
  return result;
}

export type TestRunner<R: BaseRunConfig, T: BaseTestConfig> =
      <R: BaseRunConfig, T: BaseTestConfig, I: BaseItem, S, V>(NamedCase<R, T, I, S, V>, runConfig: R, itemRunner: ItemRunner<R, I>) => void

export type ItemRunner<R: BaseRunConfig, T: BaseTestConfig> =
      <R: BaseRunConfig, T: BaseTestConfig, I: BaseItem, S, V>(baseCase: NamedCase<R, T, I, S, V>, runConfig: R, item: I) => void
