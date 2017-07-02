// @flow

import {test, describe} from 'mocha'
import {toString, endsWith, startsWith} from '../lib/StringUtils';
import {chk, chkEq, chkEqJson, chkFalse} from '../lib/AssertionUtils';


describe.only('startsWith', () => {

  it('happy path true', () => {
    chk(startsWith('abcde', 'ab'));
  });

  it('happy path false', () => {
    chkFalse(startsWith('abcde', 'ac'));
  });

  it('null', () => {
    chkFalse(startsWith(null, 'dd'));
  });

  it('undefined', () => {
    chkFalse(startsWith(undefined, 'dd'));
  });

  it('case sensitive', () => {
    chkFalse(startsWith('abcde',  'aB'));
  });

  it('undefined', () => {
    chkFalse(startsWith(undefined,  'dE'));
  });

  it('exact', () => {
    chk(startsWith('dE',  'dE'));
  });

});

describe.only('endsWith', () => {

  it('happy path true', () => {
    chk(endsWith('abcde', 'de'));
  });

  it('happy path false', () => {
    chkFalse(endsWith('abcde', 'dd'));
  });

  it('null', () => {
    chkFalse(endsWith(null, 'dd'));
  });

  it('undefined', () => {
    chkFalse(endsWith(undefined, 'dd'));
  });

  it('case sensitive', () => {
    chkFalse(endsWith('abcde',  'dE'));
  });

  it('undefined', () => {
    chkFalse(endsWith(undefined,  'dE'));
  });

  it('exact', () => {
    chk(endsWith('dE',  'dE'));
  });

});
