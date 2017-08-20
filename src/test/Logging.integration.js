// @flow

import {it, describe} from 'mocha'
import { debug } from '../lib/SysUtils';
import { log, logWarning, logError } from '../lib/Logging';

describe.only('winston log', () => {

  it('error', () => {
    logError('Something bad happenned', 'Heres some info - error');
  });

  it('message', () => {
    log('Something happenned', 'Heres some info - info');
  });

  it('warning', () => {
    logWarning('Something not so bad happenned', 'Heres some info - Warning');
  });


});
