import {chk, chkFalse} from '../lib/AssertionUtils';
const _ = require('lodash');
import { check, checkText, checkEqual, checkTextContains, checkTextContainsFragments } from '../lib/CheckUtils';
import { describe, it } from 'mocha'

describe('check', () => {

  it('check - pass', () => {
    chk(check(true, 'should pass', 'more info about the pass'));
  });

  it('check - fail', () => {
    chkFalse(check(false, 'should fail', 'more info about the fail'));
  });

});

describe('checkText', () => {

  it('all fields', () => {
    chk(checkText('sample text', 'sample text', 'test the same', 'same info'));
  });

  it('no additional info', () => {
    chk(checkText('sample text', 'sample text', 'test the same'));
  });

});

describe('checkEqual', () => {

  it('numeric', () => {
    chk(checkEqual(1, 1, 'test the same', 'same info'));
  });

  it('numeric - fail', () => {
    chkFalse(checkEqual(1, 2, 'failing check'));
  });

  const OBJ = {
    id: 1,
    name: 'bill',
    address: 'unit 1, 14 parring rd',
    pets: {
      pp1: 'spot',
      p2: 'poly',
      p3: 'bun bun'
    }
  }

  it('object', () => {
    chk(checkEqual(OBJ, OBJ, 'test the same', 'same info'));
  });

  it('object - cloned', () => {
    let o2 = _.cloneDeep(OBJ);
    chk(checkEqual(OBJ, o2, 'failing check'));
  });

  it('object - cloned - changed -should fail', () => {
    let o2 = _.cloneDeep(OBJ);
    o2.pets.pp1 = 'spoty';
    chkFalse(checkEqual(OBJ, o2, 'failing check'));
  });

});

describe('checkTextContains', () => {

  it('pass minor message', () => {
    chk(checkTextContains('the quick brown fox jusmps over the lazy dog', 'quick b', 'should pass'));
  });

  it('no message pass', () => {
    chk(checkTextContains('the quick brown fox jusmps over the lazy dog', 'quick b'));
  });

  it('no message failMessage', () => {
    chkFalse(checkTextContains('the quick brown fox jusmps over the lazy dog', 'quic b'));
  });

  it('pass message case insensitive', () => {
    chk(checkTextContains('the quick brown fox jusmps over the lazy dog', 'qUick B', 'should pass !!', false));
  });

});

describe('checkTextContainsFragments', () => {

  it('pass single fragment', () => {
    chk(checkTextContainsFragments('the quick brown fox jusmps over the lazy dog', 'quick b'));
  });

  it('multi fragment pass', () => {
    chk(checkTextContainsFragments('the quick brown fox jumps over the lazy dog', 'quick b*ov*y d'));
  });

  it('multi fragment fail', () => {
    chkFalse(checkTextContainsFragments('the quick brown fox jumps over the lazy dog', 'quick b*oov*y d'));
  });

  it('multi fragment pass - case insensitive', () => {
    chk(checkTextContainsFragments('the quick brown fox jumps over the lazy dog', 'quick b*ov*Y d', false));
  });

  it('multi fragment fal - case sensitive', () => {
    chkFalse(checkTextContainsFragments('the quick brown fox jumps over the lazy dog', 'quick b*ov*Y d'));
  });

});
