// @flow

import { eachFile, testCaseFile, fileOrFolderName, logFile, pathExists, mockFile, fromMock } from '../lib/FileUtils';
import { forceArray, functionNameFromFunction, objToYaml, reorderProps, debug, areEqual, cast, fail} from '../lib/SysUtils';
import { toString, newLine, hasText} from '../lib/StringUtils';
import { logStartRun, logEndRun, logStartTest, logEndTest, logStartIteration,
          logEndIteration, logError, pushLogFolder, popLogFolder, log,
          logIterationSummary, logFilterLog, logException, logValidationStart,
          logStartInteraction, logStartValidator, logEndValidator, logValidationEnd,
          logStartIterationSummary, logEndInteraction, logPrepValidationInfoStart,
          logPrepValidationInfoEnd, latestRawPath } from '../lib/Logging';
import moment from 'moment';
import { now, strToMoment } from '../lib/DateTimeUtils';
import * as _ from 'lodash';
import { defaultLogParser } from '../lib/LogParser'
import * as webLauncher from '../lib/WebLauncher';

export type MockFileNameFunction<R> = (itemId: ?number, testName: string, runConfig: R) => string

export function defaultTestRunner(itemFilter?: ItemFilter<*>){
  return function runTest<R: BaseRunConfig, T: BaseTestConfig, I: BaseItem, S, V>(testCase: NamedCase<R, T, I, S, V>, runConfig: R, itemRunner: ItemRunner<R, I>, mockFileNameFunc: MockFileNameFunction<R>) : void {
    log('Loading Test Items');
    let itemList = testCase.testItems(runConfig);
    if (itemFilter != null){
      itemList = filterTestItems(itemList, itemFilter);
    }

    let webUI = true;
    if (webUI) {
      debug('launchWebInteractor from test runner');
      webLauncher.launchWebInteractor();
      debug('Launched from test runner !!!! ');
      try {
        itemList.forEach((item) => itemRunner(testCase, runConfig, item, mockFileNameFunc));
      } catch (e) {
        debug(e, '--- BANG ---');
        fail(e);
      } finally {
        webLauncher.stopServer();
      }


    } else {
      itemList.forEach((item) => itemRunner(testCase, runConfig, item, mockFileNameFunc));
    }

  }
}

export type EndPointInfo<R: BaseRunConfig, T: BaseTestConfig, I: BaseItem, S, V> = {
  testCase: BaseCase<R, T, I, S, V>,
  selector?: Number |  $Supertype<I> | (testItem: I, fullList: Array<I>) => boolean
}

export function filterTestItems<FR>(testItems: Array<BaseItem>, fltr: (testItem: BaseItem, fullList: Array<BaseItem>) => boolean ): Array<BaseItem> {
  let predicate = (testItem: BaseItem): boolean => fltr(testItem, testItems);
  return testItems.filter(predicate);
}

export function itemFilter<I: BaseItem>(selector?: Number |  $Supertype<I> | (testItem: I, fullList: Array<I>) => boolean): (testItem: I, fullList: Array<I>) => boolean {
  if (selector == null){
    return lastItem;
  }
  else if (_.isFunction(selector)) {
    return cast(selector);
  }
  else if (_.isNumber(selector)){
    return idFilter(cast(selector));
  }
  else  if (_.isObject(selector)){
    return matchesProps(selector)
  }

  fail('Invalid item selector property: ' + newLine() + toString(selector));
  // will never get here this is just to keep flow happy
  return allItems;
}

// endpoint item filters
export function lastItem(testItem: BaseItem, fullList: Array<BaseItem>): boolean {
  return areEqual(_.last(fullList), testItem);
}

export function matchesProps<I: BaseItem>(target: $Supertype<I>): (testItem: I, fullList: Array<BaseItem>) => boolean {
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
        testFilters,
        mockFileNameGenerator
      } = params;

  runConfig = runConfigDefaulter(runConfig);

  let runName = runConfig.name;

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
           } = testCase;

      // ensure the testConfig is fully populated
      testConfig = testConfigDefaulter(testConfig);
      testCase.testConfig = ((testConfig: any): T);

      logStartTest(name, testConfig.when, testConfig.then, testConfig);
      // dodgy cast for itemRunner I think the type issue is because the
      // TestItem type changes on every test
      testRunner(testCase, cast(runConfig), cast(itemRunner), mockFileNameGenerator);
      logEndTest(name);
    }

    testList.forEach(runTestInstance);

  } catch (e) {
    logException(`Exception thrown in test run`, e);
  } finally {
    logEndRun(runName);
  }

  defaultLogParser(mockFileNameGenerator)(latestRawPath());
}

let allCases: Array<any> = [];

export type BaseRunConfig = {
  name: string,
  mocked: boolean
}

export type TestFilter<FR, FT> = (string, FT, FR) => boolean;

export type RunParams<R: BaseRunConfig, FR: BaseRunConfig, T: BaseTestConfig, FT: BaseTestConfig> = {|
  testList: Array<NamedCase<R, T, *, *, *>>,
  runConfig: R,
  testConfigDefaulter: T => FT,
  runConfigDefaulter: R => FR,
  testRunner: TestRunner<FR, FT>,
  itemRunner: ItemRunner<FR, *>,
  testFilters: Array<TestFilter<FR, FT>>,
  mockFileNameGenerator: (itemId: ?number, testName: string, runConfig: R) => string
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

  function isTestCaseFile(path: string, name: string) {
    return !hasText(name, 'testfilters.js') &&
           !hasText(name, '.integration.') &&
           !hasText(name, '.endpoint.') &&
           !hasText(name, '.endpoints.') &&
           !hasText(name, 'ProjectConfig.js')
  }

  allCases = [];
  eachFile(testCaseDir, loadFile, isTestCaseFile);
  return cast(allCases);
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

export function runTestItem<R: BaseRunConfig, T: BaseTestConfig, I: BaseItem, S, V>(baseCase: NamedCase<R, T, I, S, V>, runConfig: R, item: I, mockFileNameFunc: MockFileNameFunction<R>) {

 logStartIteration(item.id, baseCase.name, item.when, item.then, validatorsToString(item));
 try {
    let apState: S,
        valState: V,
        continu = true,
        mocked = runConfig.mocked,
        mockFileName = mockFileNameFunc(item.id, baseCase.name, runConfig),
        mockPath = mockFile(mockFileName),
        useMock = mocked && pathExists(mockPath),
        valTime,
        isWebUi = true;

    function interactOrMock() {
      if (useMock) {
        let mockObj = fromMock(mockFileName);
        valTime = strToMoment(mockObj.valTime);
        apState =  mockObj.apState;
      }
      else {
        valTime = now();
        apState = isWebUi ? cast(webLauncher.interact(item, runConfig)) : baseCase.interactor(item, runConfig);
      }
    }

    continu = exStage(  interactOrMock,
                        (useMock ? 'Mocking' : 'Executing') + ' Interactor',
                        logStartInteraction,
                        () => logEndInteraction(apState, useMock),
                        continu);

    continu = exStage(() => {valState = baseCase.prepState(apState)},
                              'Preparing Validation Info',
                              logPrepValidationInfoStart,
                              () => logPrepValidationInfoEnd(valState),
                              continu);

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
      <R: BaseRunConfig, T: BaseTestConfig, I: BaseItem, S, V>(NamedCase<R, T, I, S, V>, runConfig: R, itemRunner: ItemRunner<R, I>, MockFileNameFunction<R>) => void

export type ItemRunner<R: BaseRunConfig, T: BaseTestConfig> =
      <R: BaseRunConfig, T: BaseTestConfig, I: BaseItem, S, V>(baseCase: NamedCase<R, T, I, S, V>, runConfig: R, item: I, mockFileNameFunc: MockFileNameFunction<R>) => void
