import { eachFile, testCaseFile, fileOrFolderName, logFile, pathExists, mockFile, fromMock } from './FileUtils';
import {
          forceArray, functionNameFromFunction, objToYaml, reorderProps, debug, areEqual, fail,
          translateErrorObj, def
        } from './SysUtils';
import { show, newLine, hasText} from './StringUtils';
import { logStartRun, logEndRun, logStartTest, logEndTest, logStartIteration,
          logEndIteration, logError, pushLogFolder, popLogFolder, log,
          logFilterLog, logException, logValidationStart,
          logStartInteraction, logStartValidator, logEndValidator, logValidationEnd,
          logEndInteraction, logPrepValidationInfoStart,
          logPrepValidationInfoEnd, latestRawPath } from './Logging';
import moment from 'moment';
import { now, strToMoment } from './DateTimeUtils';
const _ = require('lodash');
import { defaultLogParser, destPath } from './LogParser'
import * as webLauncher from './WebLauncher';

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

export type MockFileNameFunction<R> = (itemId: number, testName: string, rc: R) => string

const WEB_FILE_FRAGMENT = '.web.';
export function defaultTestRunner(itemFilter?: ItemFilter<any>){
  return function runTest<R extends BaseRunConfig, T extends BaseTestConfig, I extends BaseItem, S, V>(testCase: NamedCase<R, T, I, S, V>, rc: R, itemRunner: ItemRunner<R, T>, mockFileNameFunc: MockFileNameFunction<R>) : void {
    log('Loading Test Items');
    let itemList = testCase.testItems(rc);
    if (itemFilter != null){
      itemList = (<I[]>filterTestItems(itemList, itemFilter));
    }

    let webUI = hasText(testCase.name, WEB_FILE_FRAGMENT),
        useMockForItem = (item: I) => canUseMock(testCase, rc, item, mockFileNameFunc),
        canMockAllWebUi = webUI && itemList.every(useMockForItem);

    if (webUI && !canMockAllWebUi) {
      webLauncher.launchWebInteractor(testCase.path, null, 'interactor', false);

      try {
        itemList.forEach((item) => itemRunner(testCase, rc, item, mockFileNameFunc));
      } catch (e) {
        fail('item runner failed', e);
      } finally {
        webLauncher.stopSession()
      }

    } else {
      itemList.forEach((item) => itemRunner(testCase, rc, item, mockFileNameFunc));
    }

  }
}

export type EndPointInfo<R extends BaseRunConfig, T extends BaseTestConfig, I extends BaseItem, S, V> = {
  testCase: BaseCase<R, T, I, S, V>,
  selector?: Number | I | ((i: I, iList: I[]) => boolean)
}

export function filterTestItems(testItems: BaseItem[], fltr: (testItem: BaseItem, fullList: BaseItem[]) => boolean ): BaseItem[] {
  let predicate = (testItem: BaseItem): boolean => fltr(testItem, testItems);
  return testItems.filter(predicate);
}

export function itemFilter<I extends BaseItem>(selector?: Number |  Partial<I> | ((testItem: I, fullList: I[]) => boolean)): (testItem: I, fullList: I[]) => boolean {
  if (selector == null){
    return lastItem;
  }
  else if (_.isFunction(selector)) {
    return <any>selector;
  }
  else if (_.isNumber(selector)){
    return idFilter(<any>selector);
  }
  else  if (_.isObject(selector) && !_.isArray(selector)){
    return matchesProps(<any>selector)
  }

  fail('Invalid item selector property: ' + newLine() + show(selector));
  // will never get here this is just to keep flow happy
  return allItems;
}

// endpoint item filters
export function lastItem(testItem: BaseItem, fullList: BaseItem[]): boolean {
  return areEqual(_.last(fullList), testItem);
}

export function matchesProps<I extends BaseItem>(target: Partial<I>): (testItem: I, fullList: BaseItem[]) => boolean {
  return function propsMatch(testItem: BaseItem, fullList: BaseItem[]): boolean {
    return _.chain(target)
            .keys()
            .every((k:string|number) => areEqual((<any>target)[k], (<any>testItem)[k]))
            .value();
  }
}

export function idFilter(id: number): (testItem: BaseItem, fullList: BaseItem[]) => boolean {
  return matchesProps({id: id});
}

export function allItems(testItem: BaseItem, fullList: BaseItem[]) {
  return true;
}

export type ItemFilter<I extends BaseItem> = (i: I, il: I[]) => boolean

export function testRun<R extends BaseRunConfig, FR extends BaseRunConfig, T extends BaseTestConfig, FT extends BaseTestConfig> (params: RunParams<R, FR, T, FT>): void {

  let {
        itemRunner,
        testRunner,
        testList,
        rc: rcPartial,
        runConfigDefaulter,
        testConfigDefaulter,
        testFilters,
        mockFileNameGenerator
      } = params,
  rc = runConfigDefaulter(rcPartial);

  let runName = rc.name;

  let filterResult = filterTests(testList, t => testConfigDefaulter(t.testConfig), testFilters, rc);
  logFilterLog(filterResult.log);
  testList = <NamedCase<R, T, any, any, any>[]>filterResult.items;

  logStartRun(runName, rc);
  try {

    function runTestInstance(testCase: NamedCase<R, T, any, any, any>) {
      let {
            testConfig: tcPartial,
            name
           } = testCase;

      // ensure the testConfig is fully populated
      let testConfig = testConfigDefaulter(tcPartial);
      testCase.testConfig = <any>testConfig;

      logStartTest(name, testConfig.when, testConfig.then, testConfig);
      // dodgy cast for itemRunner I think the type issue is because the
      // TestItem type changes on every test
      testRunner(<any>testCase, rc, itemRunner, <any>mockFileNameGenerator);
      logEndTest(name);
    }

    testList.forEach(runTestInstance);

  } catch (e) {
    logException(`Exception thrown in test run`, translateErrorObj(e, `Exception thrown in test run`));
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

export type TestFilter<FR, FT> = (s:string, tc:FT, rc:FR) => boolean;

export interface RunParams<R extends BaseRunConfig, FR extends BaseRunConfig, T extends BaseTestConfig, FT extends BaseTestConfig> {
  testList: NamedCase<R, T, any, any, any>[],
  rc: R,
  testConfigDefaulter: (tc:T) => FT,
  runConfigDefaulter: (rc:R) => FR,
  testRunner: TestRunner<FR, FT>,
  itemRunner: ItemRunner<FR, any>,
  testFilters: TestFilter<FR, FT>[],
  mockFileNameGenerator: (itemId: number, testName: string, rc: R) => string
}

let lastLoadedFileName = '??',
    lastLoadedFilePath = '??';

// needs tor register restarts as well
// is home go home logic to be moved to web side when web interaction
// rollover logic stays non web side
export function register<R extends BaseRunConfig, T extends BaseTestConfig, I extends BaseItem, S, V>(testCase: BaseCase<R, T, I, S, V>): void {
  let namedCase: NamedCase<R, T, I, S, V> = <any>testCase;
  namedCase.name = lastLoadedFileName;
  namedCase.path = lastLoadedFilePath;
  allCases.push(namedCase);
}

export type GenericValidator<DS> = (dState: DS, valTime: moment$Moment) => void

export type BaseCase<R extends BaseRunConfig, T extends BaseTestConfig, I extends BaseItem, S, V> = {
  testConfig: T,
  interactor: (item: I, rc: R) => S,
  prepState: (s: S, item: I, runState: R) => V,
  mockFileName?: (item: I, rc: R) => string,
  testItems: (rc: R) => I[]
}

export interface BaseItem  {
                    id: number,
                    when: string,
                    then: string,
                    validators: GenericValidator<any> | GenericValidator<any>[]
                  };

export type BaseTestConfig = {
                    when: string,
                    then: string,
                    enabled: boolean
                  };

// test case with a name and a path property
export type NamedCase<R extends BaseRunConfig, T extends BaseTestConfig, I extends BaseItem, S, V> = NamedPathedObj<BaseCase<R, T, I, S, V>>

type NamedPathedObj<T> = T & {
  name: string,
  path: string
}

export function loadAll<R extends BaseRunConfig, T extends BaseTestConfig>(): NamedCase<R, T, any, any, any>[] {

  function loadFile(name: string, pth: string) {
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
  return <NamedCase<R, T, any, any, any>[]>allCases;
}

function runValidators<V>(validators: GenericValidator<V> | GenericValidator<V>[], dState: V, valTime: moment$Moment) {
  validators = forceArray(validators);
  function validate(validator: GenericValidator<V>){
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
      logException(`Exception Thrown ${stageName}`, translateErrorObj(e, `Exception Thrown ${stageName}`));
      continu = false;
    } finally {
      postLog();
    }
  }
  return continu;
}

function validatorsToString(item: {}): {} {
  let result = _.cloneDeep(item);
  result.validators = forceArray(result.validators).map(functionNameFromFunction);
  if (result.validators.length == 1) {
    result.validators = result.validators[0];
  }
  return result;
}



function canUseMock<R extends BaseRunConfig, T extends BaseTestConfig, I extends BaseItem, S, V>(baseCase: NamedCase<R, T, I, S, V>, rc: R, item: I, mockFileNameFunc: MockFileNameFunction<R>) : boolean {
  function mockExists(){
    let mockFileName = mockFileNameFunc(item.id, baseCase.name, rc),
        mockPath = mockFile(mockFileName);
    return pathExists(mockPath);
  }
  return rc.mocked && mockExists();
}

export function runTestItem<R extends BaseRunConfig, T extends BaseTestConfig, I extends BaseItem, S, V>(baseCase: NamedCase<R, T, I, S, V>, rc: R, item: I, mockFileNameFunc: MockFileNameFunction<R>) {

 let testName = baseCase.name;
 logStartIteration(item.id, testName, item.when, item.then, validatorsToString(item));
 try {
    let apState: S,
        dState: V,
        continu = true,
        useMock = canUseMock(baseCase, rc, item, mockFileNameFunc),
        valTime: any,
        isWebUi = hasText(testName, WEB_FILE_FRAGMENT);

    function interactOrMock() {
      if (useMock) {
        let mockObj = fromMock(mockFileNameFunc(item.id, baseCase.name, rc));
        valTime = strToMoment((<any>mockObj).valTime);
        apState = (<any>mockObj).apState;
      }
      else {
        valTime = now();
        apState = isWebUi ? (<any>webLauncher).interact(item, rc) : baseCase.interactor(item, rc);
      }
    }

    continu = exStage(  interactOrMock,
                        (useMock ? 'Mocking' : 'Executing') + ' Interactor',
                        logStartInteraction,
                        () => logEndInteraction(apState, useMock),
                        continu);

    continu = exStage(() => {dState = baseCase.prepState(apState, item, rc)},
                              'Preparing Validation Info',
                              logPrepValidationInfoStart,
                              () => logPrepValidationInfoEnd(dState),
                              continu);

    continu = exStage(() => runValidators(item.validators, dState, valTime),
                              'Running Validators',
                              () => logValidationStart(valTime, dState),
                              logValidationEnd,
                              continu);
}
  catch (e) {
    logException('Exception thrown in iteration');
  } finally {
    logEndIteration(item.id)
  }
}

export type FilterResult<C> = {
  items: C[],
  log: {[s:string]: string}
}

export function filterTests<T, TC, R>(testCases: NamedPathedObj<T>[], configExtractor: (tst:T) => TC, predicates: ((n: string, tc: TC, rc: R) => boolean)[], rc: R): FilterResult<T> {

  let predicateNames = predicates.map(functionNameFromFunction);

  function pushLog(accum: any, testCase: NamedPathedObj<T>) {
    let caseName = testCase.name,
        failIdx = predicates.findIndex(p => !p(caseName, configExtractor(testCase), rc)),
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

export type TestRunner<R extends BaseRunConfig, T extends BaseTestConfig> =
      <I extends BaseItem, S, V>(nc: NamedCase<R, T, I, S, V>, rc: R, itemRunner: ItemRunner<R, T>, mfn: MockFileNameFunction<R>) => void

export type ItemRunner<R extends BaseRunConfig, T extends BaseTestConfig> =
      <R extends BaseRunConfig, T extends BaseTestConfig, I extends BaseItem, S, V>(baseCase: NamedCase<R, T, I, S, V>, rc: R, item: I, mockFileNameFunc: MockFileNameFunction<R>) => void
