import {chk, chkEq, chkEqJson, chkFalse} from '../lib/AssertionUtils';
import * as _ from 'lodash';
import * as fs from 'fs';
import jp from 'jsonpath';
import { debug } from '../lib/SysUtils';
import { combine, seekFolder, pathExists, projectDir } from '../lib/FileUtils';

const PROJECT_PATH = 'C:\\ZWTF',
      SOURCE_DIR = 'C:\\ZWTF\\src',
      BASE_FILE = SOURCE_DIR + '\\lib\\FileUtils.js';

describe.only('projectrDir', () => {

  it('simple check', () => {
    chkEq(PROJECT_PATH, projectDir());
  });

});

describe('Integration - seekFolder', () => {

  it('project folder - exists', () => {

    function isProjectDir(dir) {
      let fullPath = combine(dir, 'package.json');
      return pathExists(fullPath);
    }

    let projFolder = seekFolder(BASE_FILE, isProjectDir);
    chkEq(PROJECT_PATH, projFolder);
  });

  it('project does not exist', () => {

    function isProjectDir(dir) {
      let fullPath = combine(dir, 'package.notExists');
      return pathExists(fullPath);
    }

    let projFolder = seekFolder(BASE_FILE, isProjectDir);
    chkEq(null, projFolder);
  });

});

describe('Integration - pathExists', () => {

  it('known file', () => {
    const BASE_DIR = SOURCE_DIR + '\\lib\\FileUtils.js';
    chk(pathExists(BASE_DIR));
  });

  it('known directory', () => {
    const BASE_DIR = SOURCE_DIR + '\\lib';
    chk(pathExists(BASE_DIR));
  });

  it('known directory trailing backslash', () => {
    const BASE_DIR = SOURCE_DIR + '\\lib\\';
    chk(pathExists(BASE_DIR));
  });

  it('missing file', () => {
    const BASE_DIR = SOURCE_DIR + '\\Blahhhhh.hs';
    chkFalse(pathExists(BASE_DIR));
  });

});
