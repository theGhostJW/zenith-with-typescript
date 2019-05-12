// @flow

import { eachFile, testCaseFile, fileOrFolderName, logFile, pathExists, mockFile, fromMock } from '../lib/FileUtils';
import {
          forceArray, functionNameFromFunction, objToYaml, reorderProps, debug, areEqual, cast, fail,
          translateErrorObj, def
        } from '../lib/SysUtils';
import { show, newLine, hasText} from '../lib/StringUtils';
import { logStartRun, logEndRun, logStartTest, logEndTest, logStartIteration,
          logEndIteration, logError, pushLogFolder, popLogFolder, log,
          logIterationSummary, logFilterLog, logException, logValidationStart,
          logStartInteraction, logStartValidator, logEndValidator, logValidationEnd,
          logStartIterationSummary, logEndInteraction, logPrepValidationInfoStart,
          logPrepValidationInfoEnd, latestRawPath } from '../lib/Logging';
import moment from 'moment';
import { now, strToMoment } from '../lib/DateTimeUtils';
import * as _ from 'lodash';
import { defaultLogParser, destPath } from '../lib/LogParser'
import * as webLauncher from '../lib/WebLauncher';

// think about this later ~ complications around web
// need to some how build go home logic into interactor
// start by registering restart
export type Restart = {
  rollOver: () => void,
  goHome: () => void,
  isHome: () => boolean,
}

export function doNothingRestart(): Restart {
  return {
    rollOver: () => undefined,
    goHome: () =>  undefined,
    isHome: () => true
  };
}

//
// function executeRestart(includeRollover: boolean, restart: Restart) {
//   function executeStage<T>(stage: string, func: () => T) : T {
//     try {
//       log('')
//     } catch (e) {
//
//     }
//   }
// }

export type MockFileNameFunction<R> = (itemId: ?number, testName: string, runConfig: R) => string

const WEB_FILE_FRAGMENT = '.web.';
export function defaultTestRunner(itemFilter?: ItemFilter<*>){
  return function runTest<R: BaseRunConfig, T: BaseTestConfig, I: BaseItem, S, V>(testCase: NamedCase<R, T, I, S, V>, runConfig: R, itemRunner: ItemRunner<R, I>, mockFileNameFunc: MockFileNameFunction<R>) : void {
    log('Loading Test Items');
    let itemList = testCase.testItems(runConfig);
    if (itemFilter != null){
      itemList = filterTestItems(itemList, itemFilter);
    }

    let webUI = hasText(testCase.name, WEB_FILE_FRAGMENT),
        useMockForItem = item => canUseMock(testCase, runConfig, item, mockFileNameFunc),
        canMockAllWebUi = webUI && itemList.every(useMockForItem);

    if (webUI && !canMockAllWebUi) {
      webLauncher.launchWebInteractor(testCase.path, null, 'interactor', false);

      try {
        itemList.forEach((item) => itemRunner(testCase, runConfig, item, mockFileNameFunc));
      } catch (e) {
        fail('item runner failed', e);
      } finally {
        webLauncher.stopSession()
      }

    } else {
      itemList.forEach((item) => itemRunner(testCase, runConfig, item, mockFileNameFunc));
    }

  }
}

export type EndPointInfo<R: BaseRunConfig, T: BaseTestConfig, I: BaseItem, S, V> = {
  testCase: BaseCase<R, T, I, S, V>,
  selector?: Number |  $Supertype<I> | (testItem: I, fullList: I[]) => boolean
}

export function filterTestItems<FR>(testItems: BaseItem[], fltr: (testItem: BaseItem, fullList: BaseItem[]) => boolean ): BaseItem[] {
  let predicate = (testItem: BaseItem): boolean => fltr(testItem, testItems);
  return testItems.filter(predicate);
}

export function itemFilter<I: BaseItem>(selector?: Number |  $Supertype<I> | (testItem: I, fullList: I[]) => boolean): (testItem: I, fullList: I[]) => boolean {
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

  fail('Invalid item selector property: ' + newLine() + show(selector));
  // will never get here this is just to keep flow happy
  return allItems;
}

// endpoint item filters
export function lastItem(testItem: BaseItem, fullList: BaseItem[]): boolean {
  return areEqual(_.last(fullList), testItem);
}

export function matchesProps<I: BaseItem>(target: $Supertype<I>): (testItem: I, fullList: BaseItem[]) => boolean {
  return function propsMatch(testItem: BaseItem, fullList: BaseItem[]): boolean {
    return _.chain(target)
            .keys()
            .every(k => areEqual(target[k], testItem[k]))
            .value();
  }
}

export function idFilter(id: number): (testItem: BaseItem, fullList: BaseItem[]) => boolean {
  return matchesProps({id: id});
}

export function allItems(testItem: BaseItem, fullList: BaseItem[]) {
  return true;
}

export type ItemFilter<I: BaseItem> = (I, I[]) => boolean

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
  testList = ((filterResult.items: any): NamedCase<R, T, *, *, *>[]);

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
    logException(`Exception thrown in test run`, translateErrorObj(e));
  } finally {
    logEndRun(runName);
  }

  console.log("");
  console.log("... parsing results");
  console.log("");

  const {
    rawFile,
    runSummary
  } = defaultLogParser(mockFileNameGenerator)(latestRawPath());

  const message = "\n\n=== Summary ===\n" + show(runSummary) +
      "\n=== Logs ===\nraw: " + rawFile +
      "\nfull: " + destPath(rawFile, 'raw', 'full') +
      "\nissues: " + destPath(rawFile, 'raw', 'issues') +
      "\n";

  log(message);
  console.log("");

}

let allCases: any[] = [];

export type BaseRunConfig = {
  name: string,
  mocked: boolean
}

export type TestFilter<FR, FT> = (string, FT, FR) => boolean;

export type RunParams<R: BaseRunConfig, FR: BaseRunConfig, T: BaseTestConfig, FT: BaseTestConfig> = {|
  testList: NamedCase<R, T, *, *, *>[],
  runConfig: R,
  testConfigDefaulter: T => FT,
  runConfigDefaulter: R => FR,
  testRunner: TestRunner<FR, FT>,
  itemRunner: ItemRunner<FR, *>,
  testFilters: TestFilter<FR, FT>[],
  mockFileNameGenerator: (itemId: ?number, testName: string, runConfig: R) => string
|}

let lastLoadedFileName = '??',
    lastLoadedFilePath = '??';

// needs tor register restarts as well
// is home go home logic to be moved to web side when web interaction
// rollover logic stays non web side
export function register<R: BaseRunConfig, T: BaseTestConfig, I: BaseItem, S, V>(testCase: BaseCase<R, T, I, S, V>): void {
  let namedCase: NamedCase<R, T, I, S, V> = cast(testCase);
  namedCase.name = lastLoadedFileName;
  namedCase.path = lastLoadedFilePath;
  allCases.push(namedCase);
}

export type GenericValidator<V> = (dState: V, valTime: moment$Moment) => void

export type BaseCase<R: BaseRunConfig, T: BaseTestConfig, I: BaseItem, S, V> = {
  testConfig: T,
  interactor: (item: I, runConfig: R) => S,
  prepState: (S, I, R) => V,
  summarise: (runConfig: R, item: I, apState: S, dState: V) => string | null,
  mockFileName?: (item: I, runConfig: R) => string,
  testItems: (runConfig: R) => I[]
}

export type BaseItem = $Subtype<ItemRequired>;

export type ItemRequired = {
                    id: number,
                    when: string,
                    then: string,
                    validators: GenericValidator<*> | GenericValidator<*>[]
                  };

export type BaseTestConfig = {
                    when: string,
                    then: string,
                    enabled: boolean
                  };

// test case with a name and a path property
export type NamedCase<R: BaseRunConfig, T: BaseTestConfig, I: BaseItem, S, V> = NamedPathedObj<BaseCase<R, T, I, S, V>>

type NamedPathedObj<T> = T & {
  name: string,
  path: string
}

export function loadAll<R: BaseRunConfig, T: BaseTestConfig>(): NamedCase<R, T, *, *, *>[] {

  function loadFile(name, pth) {
    // Delete cache entry to make sure the file is re-read from disk.
    delete require.cache[pth];
    // Load function from file.
    lastLoadedFileName = name;
    lastLoadedFilePath = pth;
    // this will invoke register on
    // test that conforms to conventions
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

function runValidators<V>(validators: GenericValidator<V> | GenericValidator<V>[], dState: V, valTime: moment$Moment) {
  validators = forceArray(validators);
  function validate(validator){
    let currentValidator = functionNameFromFunction(validator);
    logStartValidator(currentValidator);
    try {
      validator(dState, valTime);
    } catch (e) {
      throw('Exception thrown in validator: ' + currentValidator + newLine() + show(e));
    }
    logEndValidator(currentValidator);
  }
  validators.forEach(validate);
}

type Action = () => void;

function exStage(stage: Action, stageName: string, preLog: Action, postLog: Action, continu: boolean) : boolean {
  if (continu){
    preLog();
    try {
      stage();
    }
    catch (e) {
      logException(`Exception Thrown ${stageName}`, translateErrorObj(e));
      continu = false;
    } finally {
      postLog();
    }
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



function canUseMock<R: BaseRunConfig, T: BaseTestConfig, I: BaseItem, S, V>(baseCase: NamedCase<R, T, I, S, V>, runConfig: R, item: I, mockFileNameFunc: MockFileNameFunction<R>) : boolean {
  function mockExists(){
    let mockFileName = mockFileNameFunc(item.id, baseCase.name, runConfig),
        mockPath = mockFile(mockFileName);
    return pathExists(mockPath);
  }
  return runConfig.mocked && mockExists();
}

export function runTestItem<R: BaseRunConfig, T: BaseTestConfig, I: BaseItem, S, V>(baseCase: NamedCase<R, T, I, S, V>, runConfig: R, item: I, mockFileNameFunc: MockFileNameFunction<R>) {

 let testName = baseCase.name;
 logStartIteration(item.id, testName, item.when, item.then, validatorsToString(item));
 try {
    let apState: S,
        dState: V,
        continu = true,
        useMock = canUseMock(baseCase, runConfig, item, mockFileNameFunc),
        valTime,
        isWebUi = hasText(testName, WEB_FILE_FRAGMENT);

    function interactOrMock() {
      if (useMock) {
        let mockObj = fromMock(mockFileNameFunc(item.id, baseCase.name, runConfig));
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

    continu = exStage(() => {dState = baseCase.prepState(apState, item, runConfig)},
                              'Preparing Validation Info',
                              logPrepValidationInfoStart,
                              () => logPrepValidationInfoEnd(dState),
                              continu);

    continu = exStage(() => runValidators(item.validators, dState, valTime),
                              'Running Validators',
                              () => logValidationStart(valTime, dState),
                              logValidationEnd,
                              continu);

    let summary = '';
    continu = exStage(() => {
                              summary = def(baseCase.summarise(runConfig, item, apState, dState), 'NULL')
                            },
                            'Generating Summary',
                            logStartIterationSummary,
                            () => logIterationSummary(summary),
                            continu
                          );
}
  catch (e) {
    logException('Exception thrown in iteration');
  } finally {
    logEndIteration(item.id)
  }
}

export type FilterResult<C> = {
  items: C[],
  log: {[string]: string}
}

export function filterTests<T, TC, R>(testCases: NamedPathedObj<T>[], configExtractor: T => TC, predicates: ((string, TC, R) => boolean)[], runConfig: R): FilterResult<T> {

  let predicateNames = predicates.map(functionNameFromFunction);

  function pushLog(accum, testCase: NamedPathedObj<T>) {
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
