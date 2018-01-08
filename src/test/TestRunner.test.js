import {test, describe} from 'mocha';
import {chk, chkEq, chkEqJson, chkExceptionText, chkFalse, chkWithMessage} from '../lib/AssertionUtils';
import { allItems, filterTestItems, filterTests, idFilter, lastItem, matchesProps } from '../lib/TestRunner';


describe('end-point filters', () => {

  const TEST_ITEMS = [
      {id: 1,  prp1: 'hello', prp2: 'hello1'},
      {id: 2,  prp1: 'hello', prp2: 'hello2'},
      {id: 3, prp1: 'hello', prp2: 'hello3'},
      {id: 4, prp1: 'hello', prp2: 'hello4'}
  ];

  function chkFilter(fltr, expected) {
    var actual = filterTestItems(TEST_ITEMS, fltr);
    chkEq(expected, actual)
  }

  it('lastItem', () => {
    chkFilter(lastItem, [{id: 4, prp1: 'hello', prp2: 'hello4'}]);
  });

  it('matchesProps', () => {
    chkFilter(matchesProps({prp1: 'hello', prp2: 'hello3'}), [{id: 3, prp1: 'hello', prp2: 'hello3'}]);
  });


  it('id', () => {
    chkFilter(idFilter(2), [{id: 2,  prp1: 'hello', prp2: 'hello2'}]);
  });

  it('allItems', () => {
    chkFilter(allItems, TEST_ITEMS);
  });

});

describe('filterTestItems', () => {

  const testCases = [
      {name: 'test1', cfg: {env: 'TST', enabled: true, size: 5}},
      {name: 'test2', cfg: {env: 'PVT', enabled: true, size: 10}},
      {name: 'test20', cfg: {env: 'TST', enabled: true, size: 10}},
      {name: 'test100', cfg: {env: 'TST', enabled: false, size: 1}}
  ];

  const extractor = tst => tst.cfg;

  const predicates = [

    function isInNames(name, testConfig, runConfig) {
      return runConfig.testCases == null ||  runConfig.testCases.includes(name);
    },

    function sameEnv(name, testConfig, runConfig) {
      return runConfig.env === testConfig.env;
    },

    function sizeTest(name, testConfig, runConfig) {
      return runConfig.size >= testConfig.size;
    },

    function isEnabled(name, testConfig, runConfig) {
      return testConfig.enabled;
    }
  ];


  it('simple', () => {
    let expected = {
      items: [
        {name: 'test1', cfg: {env: 'TST', enabled: true, size: 5}}
      ],
      log: {
       test1: 'Accepted',
       test100: 'isEnabled',
       test2: 'sameEnv',
       test20: 'sizeTest'
      }
    },
    actual = filterTests(testCases, extractor, predicates, {env: 'TST', size: 7});
    chk(expected, actual);
  });

  it('in names', () => {
    let expected = {
        items: [
          {name: 'test1', cfg: {env: 'TST', enabled: true, size: 5}},
          {name: 'test20', cfg: {env: 'TST', enabled: true, size: 10}}
        ],
        log: {
         test1: 'Accepted',
         test100: 'isEnabled',
         test2: 'sameEnv',
         test20: 'Accepted'
        }
      },
      actual = filterTestItems(testCases, extractor, predicates, {env: 'TST', testCases: ['test1', 'test2', 'test20'], size: 10});
    chk(expected, actual);
  });

  it('empty', () => {
    let expected = {
        items: [],
        log: {
         test1: 'sameEnv',
         test100: 'isEnabled',
         test2: 'isInNames',
         test20: 'sameEnv'
        }
      },
      actual = filterTestItems(testCases, extractor, predicates, {env: 'PVT', testCases: ['test1', 'test20'], size: 10});
    chk(expected, actual);
  });
});
