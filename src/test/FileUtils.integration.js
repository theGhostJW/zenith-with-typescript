import {chk, chkEq, chkEqJson, chkFalse} from '../lib/AssertionUtils';
import * as _ from 'lodash';
import * as fs from 'fs';
import { debug } from '../lib/SysUtils';
import { combine, seekFolder, pathExists, projectDir, runTimeFilesFile, tempFile, mockFile, testDataFile, runTimeFile, logFile } from '../lib/FileUtils';

const PROJECT_PATH : string = 'C:\\ZWTF',
      SOURCE_DIR: string = 'C:\\ZWTF\\src',
      BASE_FILE = SOURCE_DIR + '\\lib\\FileUtils.js';


describe('projectSubPathFuncs', () => {

  it('tempFile', () => {
    chkEq(combine(PROJECT_PATH, 'temp', 'myFile.txt'), tempFile('myFile.txt'));
  });

  it('tempFile - empty', () => {
    chkEq(combine(PROJECT_PATH, 'temp'), tempFile());
  });

  it('mockFile', () => {
    chkEq(combine(PROJECT_PATH, 'mocks', 'myFile.txt'), mockFile('myFile.txt'));
  });

  it('mockFile - empty', () => {
    chkEq(combine(PROJECT_PATH, 'mocks'), mockFile());
  });

  it('testDataFile', () => {
    chkEq(combine(PROJECT_PATH, 'testData', 'myFile.txt'), testDataFile('myFile.txt'));
  });

  it('testDataFile - empty', () => {
    chkEq(combine(PROJECT_PATH, 'testData'), testDataFile());
  });

  it('runTimeFiles', () => {
    chkEq(combine(PROJECT_PATH, 'runTimeFiles', 'myFile.txt'), runTimeFile('myFile.txt'));
  });

  it('runTimeFiles - empty', () => {
    chkEq(combine(PROJECT_PATH, 'runTimeFiles'), runTimeFile());
  });

  it('logFile', () => {
    chkEq(combine(PROJECT_PATH, 'logs', 'myFile.txt'), logFile('myFile.txt'));
  });

  it('logFile - empty', () => {
    chkEq(combine(PROJECT_PATH, 'logs'), logFile());
  });


});

describe('projectrDir', () => {

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
