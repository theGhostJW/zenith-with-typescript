import * as A from '../lib/AssertionUtils';
const _ = require('lodash');
import { chk, chkText, chkEq, chkTextContains, chkTextContainsFragments, chkProp } from '../lib/CheckUtils';
import { describe, it } from 'mocha'

describe('check', () => {

  it('check - pass', () => {
    A.chk(chk(true, 'should pass', 'more info about the pass'));
  });

  it('check - fail', () => {
    A.chkFalse(chk(false, 'should fail', 'more info about the fail'));
  });

});

describe('chkText', () => {

  it('all fields', () => {
    A.chk(chkText('sample text', 'sample text', 'test the same', 'same info'));
  });

  it('no additional info', () => {
    A.chk(chkText('sample text', 'sample text', 'test the same'));
  });

});

describe('chkProp', () => {
  interface targ {a: number, b: number, c: number | null}
  const target = {a: 1, b: 2, c: null};

  it('existing prop same', () => {
    A.chk(chkProp("a")(1)(target));
  });

  it('existing prop same null', () => {
    A.chk(chkProp<targ>("c") (null) (target));
  });

  it('existing prop different', () => {
    A.chkFalse(chkProp<targ>("b")(1)(target));
  });

  it('existing prop different null', () => {
    A.chkFalse(chkProp<targ>("c") ("Hi") (target));
  });


});

describe('chkEq', () => {

  it('numeric', () => {
    A.chk(chkEq(1, 1, 'test the same', 'same info'));
  });

  it('numeric - fail', () => {
    A.chkFalse(chkEq(1, 2, 'failing check'));
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
    A.chk(chkEq(OBJ, OBJ, 'test the same', 'same info'));
  });

  it('object - cloned', () => {
    let o2 = _.cloneDeep(OBJ);
    A.chk(chkEq(OBJ, o2, 'failing check'));
  });

  it('object - cloned - changed -should fail', () => {
    let o2 = _.cloneDeep(OBJ);
    o2.pets.pp1 = 'spoty';
    A.chkFalse(chkEq(OBJ, o2, 'failing check'));
  });

});

describe('chkTextContains', () => {

  it('pass minor message', () => {
    A.chk(chkTextContains('the quick brown fox jusmps over the lazy dog', 'quick b', 'should pass'));
  });

  it('no message pass', () => {
    A.chk(chkTextContains('the quick brown fox jusmps over the lazy dog', 'quick b'));
  });

  it('no message failMessage', () => {
    A.chkFalse(chkTextContains('the quick brown fox jusmps over the lazy dog', 'quic b'));
  });

  it('pass message case insensitive', () => {
    A.chk(chkTextContains('the quick brown fox jusmps over the lazy dog', 'qUick B', 'should pass !!', false));
  });

});

describe('chkTextContainsFragments', () => {

  it('pass single fragment', () => {
    A.chk(chkTextContainsFragments('the quick brown fox jusmps over the lazy dog', 'quick b'));
  });

  it('multi fragment pass', () => {
    A.chk(chkTextContainsFragments('the quick brown fox jumps over the lazy dog', 'quick b*ov*y d'));
  });

  it('multi fragment fail', () => {
    A.chkFalse(chkTextContainsFragments('the quick brown fox jumps over the lazy dog', 'quick b*oov*y d'));
  });

  it('multi fragment pass - case insensitive', () => {
    A.chk(chkTextContainsFragments('the quick brown fox jumps over the lazy dog', 'quick b*ov*Y d', false));
  });

  it('multi fragment fal - case sensitive', () => {
    A.chkFalse(chkTextContainsFragments('the quick brown fox jumps over the lazy dog', 'quick b*ov*Y d'));
  });

});
