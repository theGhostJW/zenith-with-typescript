// @flow

import {it, describe} from 'mocha'
import { debug } from '../lib/SysUtils';
import { log, logWarning, logError, logLink, pushLogFolder, popLogFolder, notImplementedWarning,
          expectDefect, endDefect} from '../lib/Logging';

describe('winston log', () => {

  describe('expect / endDefect', () => {

    it('expectDefect / endDefect', () => {
      expectDefect('failing');
      logError('Bad');
      endDefect();
    });

  });

  it('error', () => {
    logError('Something bad happenned', 'Heres some info - error');
  });

  it('message', () => {
    log('Something happenned', 'Heres some info - info');
  });


  it('warning', () => {
    logWarning('Something not so bad happenned', 'Heres some info - Warning');
  });

  it('logLink', () => {
    logLink('msg', 'https://google.com');
  });

  it('push pop folder', () => {
    pushLogFolder('A Folder');
    log('IN Folder');
    popLogFolder();
  });

  it('not implemented', () => {
    notImplementedWarning();
  });

  it('not implemented with message', () => {
    notImplementedWarning('a meesage');
  });


});
