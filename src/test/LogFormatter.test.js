// @flow

import { testPrivate} from '../lib/LogFormatter';
import { toTempString } from '../lib/FileUtils';
import { newLine } from '../lib/StringUtils';
import {
          chkEq,
          chkExceptionText
        } from '../lib/AssertionUtils';

describe('headerLine', () => {

  let headerLine = testPrivate.headerLine;

  it('emptyLine ~ len 5', () => {
    chkEq('#####', headerLine('', '#', false, 5))
  });

  it('wrong pad length throws', () => {
    chkExceptionText(() => headerLine('', '##', false, 5), 'pad');
  });

  it('basic padding ~ odd padding', () => {
    chkEq('## Hello ###', headerLine('Hello', '#', false, 12))
  });


  it('basic padding even padding', () => {
    chkEq('### Hell ###', headerLine('Hell', '#', false, 12))
  });

  it('padding with % padding', () => {
    chkEq('#% Hello ###', headerLine('Hello', '#', true, 12))
  });

});

describe('padProps', () => {
  let padProps = testPrivate.padProps;

  it('right justify differing length numbers', () => {
    let expected =  'iterations:                 700' + newLine() +
                    'passedIterations:             3' + newLine() +
                    'iterationsWithErrors:         4' + newLine() +
                    'iterationsWithWarnings:       1' + newLine() +
                    'iterationsWithType2Errors:    1' + newLine() +
                    'iterationsWithKnownDefects:   2',

         source = {
                  iterations:                 700,
                  passedIterations:             3,
                  iterationsWithErrors:         4,
                  iterationsWithWarnings:       1,
                  iterationsWithType2Errors:    1,
                  iterationsWithKnownDefects:   2
                 };


     expected = chkEq(expected, padProps(source, false));
  });

  it('right justify differing length numbers long key and val', () => {
    let expected =  'iterations:                   7' + newLine() +
                    'passedIterations:             3' + newLine() +
                    'iterationsWithErrors:         4' + newLine() +
                    'iterationsWithWarnings:       1' + newLine() +
                    'iterationsWithType2Errors:    1' + newLine() +
                    'iterationsWithKnownDefects: 700',

         source = {
                  iterations:                   7,
                  passedIterations:             3,
                  iterationsWithErrors:         4,
                  iterationsWithWarnings:       1,
                  iterationsWithType2Errors:    1,
                  iterationsWithKnownDefects:   700
                 };


     expected = chkEq(expected, padProps(source, false));
  });

  it('right justify differing length numbers long key and val with prefix', () => {
    let expected =  '  iterations:                   7' + newLine() +
                    '  passedIterations:             3' + newLine() +
                    '  iterationsWithErrors:         4' + newLine() +
                    '  iterationsWithWarnings:       1' + newLine() +
                    '  iterationsWithType2Errors:    1' + newLine() +
                    '  iterationsWithKnownDefects: 700',

         source = {
                  iterations:                   7,
                  passedIterations:             3,
                  iterationsWithErrors:         4,
                  iterationsWithWarnings:       1,
                  iterationsWithType2Errors:    1,
                  iterationsWithKnownDefects:   700
                 };


     expected = chkEq(expected, padProps(source, false, '  '));
  });

  it('left justify differing length numbers long key and val', () => {
    let expected =  'iterations:                 7' + newLine() +
                    'passedIterations:           3' + newLine() +
                    'iterationsWithErrors:       4' + newLine() +
                    'iterationsWithWarnings:     1' + newLine() +
                    'iterationsWithType2Errors:  1' + newLine() +
                    'iterationsWithKnownDefects: 700',

         source = {
                  iterations:                   7,
                  passedIterations:             3,
                  iterationsWithErrors:         4,
                  iterationsWithWarnings:       1,
                  iterationsWithType2Errors:    1,
                  iterationsWithKnownDefects:   700
                 };


     expected = chkEq(expected, padProps(source));
  });

  it('right justify differing length numbers long key and val with prefix', () => {
    let expected =  '  iterations:                 7' + newLine() +
                    '  passedIterations:           3' + newLine() +
                    '  iterationsWithErrors:       4' + newLine() +
                    '  iterationsWithWarnings:     1' + newLine() +
                    '  iterationsWithType2Errors:  1' + newLine() +
                    '  iterationsWithKnownDefects: 700',

         source = {
                  iterations:                   7,
                  passedIterations:             3,
                  iterationsWithErrors:         4,
                  iterationsWithWarnings:       1,
                  iterationsWithType2Errors:    1,
                  iterationsWithKnownDefects:   700
                 };


     expected = chkEq(expected, padProps(source, true, '  '));
  });

  it('right justify differing length numbers long key and val with prefix + array', () => {
    let expected =  '  iterations:                 7' + newLine() +
                    '  passedIterations:           3' + newLine() +
                    '  iterationsWithErrors:       4' + newLine() +
                    '  iterationsWithWarnings:     []' + newLine() +
                    '  iterationsWithType2Errors:  1' + newLine() +
                    '  iterationsWithKnownDefects: 700',


         source = {
                  iterations:                   7,
                  passedIterations:             3,
                  iterationsWithErrors:         4,
                  iterationsWithWarnings:       [],
                  iterationsWithType2Errors:    1,
                  iterationsWithKnownDefects:   700
                 };


     expected = chkEq(expected, padProps(source, true, '  '));
  });

});
