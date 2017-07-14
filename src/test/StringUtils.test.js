// @flow

import {test, describe} from 'mocha'
import {toString, endsWith, startsWith, hasText, wildCardMatch, replace} from '../lib/StringUtils';
import {chk, chkEq, chkEqJson, chkFalse} from '../lib/AssertionUtils';

describe('replace()', () => {

  it('null base', () => {
    chkEq(null, replace(null, 'a', 'A'));
  });

  it('case insensitive', () => {
    chkEq(   'the quick red fox jumps over the lazy red dog',
     replace('the quick brown fox jumps over the lazy Brown dog', 'brown', 'red'));
  });

  it('case sensitive', () => {
    chkEq('the quick red fox jumps over the lazy Brown dog', replace('the quick brown fox jumps over the lazy Brown dog', 'brown', 'red', true));
  });

});

describe('toString', () => {

  it('object', () => {
    chkEq('{"hi":1}', toString({hi: 1}));
  });

  it('number', () => {
    chkEq('123', toString(123));
  });

  it('string', () => {
    chkEq('hi', toString('hi'));
  });

  it('array', () => {
    chkEq('[1,2,3]', toString([1, 2, 3]));
  });

  it('function', () => {

    let expected = `function blahh() {
      return 'Hi';
    }`

    function blahh() {
      return 'Hi';
    }
    chkEq(expected, toString(blahh));
  });

  it('null', () => {
    chkEq('null', toString(null));
  });

  it('undefined', () => {
    chkEq('undefined', toString(undefined));
  });

});


describe('wildcardMatch', () => {

  it('null', () => {
    chkFalse(wildCardMatch(null, 'hi'));
  });

  it('wildcard surround', () => {
    chk(wildCardMatch("demo_Array_Data_Driven_Test", "*Array*"));
  });

  it('complex nested - case insensitive', () => {
    chk(wildCardMatch("The quick brown fox jumps over the lazy dog", "Th*icK*b*ox*over the*dog"));
  });

  it('complex nested - case sensitive', () => {
    chkFalse(wildCardMatch("The quick brown fox jumps over the lazy dog", "Th*icK*b*ox*over the*dog", true));
  });

  it('complex nested - case sensitive ii', () => {
    chk(wildCardMatch("The quick brown fox jumps over the lazy dog", "*fox*dog", true));
  });

  it('complex nested - negative case', () => {
    chkFalse(wildCardMatch("The quick brown fox jumps over the lazy dog", "*fox*brown"));
  });

  it('complex nested - trailing negative', () => {
    chkFalse(wildCardMatch("The quick brown fox jumps over the lazy dog", "*fox*lazy", true));
  });

  it('same string', () => {
    chk(wildCardMatch("The quick brown fox jumps over the lazy dog",
                           "The quick brown fox jumps over the lazy dog",
                            true));
                          });

});

describe('hasText', () => {

  it('null hayStack', () => {
      chkFalse(hasText(null, 'blahh'))
  });

  it('undefined hayStack', () => {
      chkFalse(hasText(undefined, 'blahh'));
  });

  it('case sensitivity override - not found', () => {
      chkFalse(hasText('i am johnie', 'John', true));
  });

  it('case sensitivity override - found', () => {
      chk(hasText('i am Johnie', 'John', true));
  });

  it('case sensitivity default false - found', () => {
      chk(hasText('i am johnie', 'John'));
  });

  it('empty string - found', () => {
    chk(hasText('i am johnie', ''));
  });

  it('empty string - in null', () => {
    chkFalse(hasText(null, ''));
  });

});

describe ('startsWith', () => {

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

describe('endsWith', () => {

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
