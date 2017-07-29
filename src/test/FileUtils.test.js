import {chk, chkEq, chkEqJson, chkFalse} from '../lib/AssertionUtils';
import * as _ from 'lodash';
import { debug } from '../lib/SysUtils';
import { combine } from '../lib/FileUtils';

describe('combine', () => {

  it('combine just a path', () => {
      chkEq('C:\\Program Files\\Blahh', combine('C:', 'Program Files', 'Blahh'));
  });

  it('path and file', () => {
      chkEq('C:\\Program Files\\Blahh\\my.exe', combine('C:', 'Program Files', 'Blahh', 'my.exe'));
  });

});
