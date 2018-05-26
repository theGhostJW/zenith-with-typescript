// @flow

import {chk, chkEq, chkEqJson, chkFalse, chkExceptionText, chkWithMessage} from '../lib/AssertionUtils';
import { debug, waitRetry, cast  } from '../lib/SysUtils';
import { toTemp, toTempString } from '../lib/FileUtils';
import { show } from '../lib/StringUtils';
import * as _ from 'lodash';
import { unitTestingTargets } from '../lib/WebUtils';


describe('sliceSearchModifier', () => {

  const sliceSearchModifier = unitTestingTargets.sliceSearchModifier;

  it('*', () => {
    chkEq(['*', 'str'], sliceSearchModifier('str'))
  });

  it('*/empty', () => {
    chkEq(['*', ''], sliceSearchModifier(''))
  });

  it('wrong index *', () => {
    chkEq(['*', 'at~r'], sliceSearchModifier('at~r'))
  });

  it('not a modifier', () => {
    chkEq(['*', 'at~z'], sliceSearchModifier('at~z'))
  });

  it('above', () => {
    chkEq(['A', 'dddd'], sliceSearchModifier('a~dddd'))
  });

  it('above caps', () => {
    chkEq(['A', 'dddd'], sliceSearchModifier('A~dddd'))
  });

  it('below', () => {
    chkEq(['B', 'fdfdud'], sliceSearchModifier('b~fdfdud'))
  });

  it('below caps', () => {
    chkEq(['B', 'uyser'], sliceSearchModifier('B~uyser'))
  });

  it('left', () => {
    chkEq(['L', 'Leerr'], sliceSearchModifier('l~Leerr'))
  });

  it('left caps', () => {
    chkEq(['L', 'tfusr'], sliceSearchModifier('L~tfusr'))
  });

  it('right', () => {
    chkEq(['R', 'you'], sliceSearchModifier('r~you'))
  });

  it('right caps', () => {
    chkEq(['R', 'truiv'], sliceSearchModifier('R~truiv'))
  });


});
