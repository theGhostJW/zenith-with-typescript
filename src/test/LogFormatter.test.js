// @flow

import { testPrivate} from '../lib/LogFormatter';
import { toTempString } from '../lib/FileUtils';
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
