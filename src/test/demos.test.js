import {test, describe} from 'mocha'
import {chk, chkEq, chkEqJson, chkFalse} from '../lib/AssertionUtils';
import * as _ from 'lodash';
import { debug } from '../lib/SysUtils';
import { log } from '../lib/Logging';
import { toTempString } from '../lib/FileUtils';
import child_process from 'child_process'



describe.skip('process', () => {

  it('platform', () => {
    console.log(`${process.platform}`, 'This platform is');
  });

  it('file name', () => {
    console.log(module.filename, 'module name');
  });

});

describe.skip('defaultsDeep', () => {

  it('complex array', () => {
    let actual = _.defaultsDeep({}, { 'a': [5, 6, 7, 8, 9, {hi: 'hi'}] });
    chkEq({ 'a': [5, 6, 7, 8, 9, {hi: 'hi'}] }, actual);
  });

});
describe.skip('cloneDeep', () => {

  const TARGET = {
                john: {

                        pets: {
                                stompa: 'rabbit',
                                spot: 'dog'
                              }
                       },
                 betty: {
                          pets: {
                                  sooty: [1, 2, 3, 4]
                                }
                       }
               };

  it('pojso', () => {
    let actual = _.cloneDeep(TARGET);
    chkEq(TARGET, actual);
  });

  it('pmutation doesn\'t change clone', () => {
    let actual = _.cloneDeep(TARGET);
    let oldName = TARGET.john.pets.stompa;
    actual.john.pets.stompa = 'bear';
    chkEq(oldName, TARGET.john.pets.stompa);
  });

  it('empty array', () => {
    let actual = _.cloneDeep([]);
    chkEq([], actual);
  });

  it(' array', () => {
    let expected = [1, 'hi', 5],
        actual = _.cloneDeep(expected);
    chkEq([1, 'hi', 5], actual);
  });

  it(' array complex', () => {
    let expected = [1, 'hi', {hi: 1, arr: [1, 2, 3, 4]}],
        actual = _.cloneDeep(expected);
    expected[2].hi = 444;
    chkEq([1, 'hi', {hi: 1, arr: [1, 2, 3, 4]}], actual);
  });

  it('number', () => {
    chkEq(4, _.cloneDeep(4));
  });

  it('number', () => {
    chkEq(null, _.cloneDeep(null));
  });
});
