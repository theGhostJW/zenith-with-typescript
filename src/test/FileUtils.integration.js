// @flow

import {
        chk, chkEq, chkEqJson, chkFalse, chkHasText,
        chkWithMessage
      } from '../lib/AssertionUtils';
import * as _ from 'lodash';
import * as fs from 'fs';
import { debug, areEqual } from '../lib/SysUtils';
import type {LogAttributes} from '../lib/Logging';
import { setLoggingFunctions, DEFAULT_LOGGING_FUNCTIONS } from '../lib/Logging';
import { combine, seekFolder, pathExists, projectDir, tempFile, mockFile, testDataFile,
         runTimeFile, logFile, stringToFile, fileToString, toTempString, fromTempString,
         deleteFile, toTestDataString, fromTestDataString } from '../lib/FileUtils';

const PROJECT_PATH : string = 'C:\\ZWTF',
      SOURCE_DIR: string = 'C:\\ZWTF\\src',
      BASE_FILE: string  = SOURCE_DIR + '\\lib\\FileUtils.js';


describe('special dirs / round trip', () => {

  it('', () => {

  });

});

describe.only('delete file', () => {

  let tempPath = tempFile('blah.txt');
  it('simple delete', () => {
    stringToFile('blah', tempPath);
    chkWithMessage(pathExists(tempPath), 'precheck');
    chkWithMessage(deleteFile(tempPath), 'returns true');
    chkWithMessage(!pathExists(tempPath), 'file gone');
  });

  it('simple delete - no file exists', () => {
    chkWithMessage(deleteFile(tempFile('nonExistantFile')), 'returns true when no file exists');
  });

});

describe.only('<to / from>TestDataString round trip', () => {

  it('simple round trip', () => {
    toTestDataString('blah', 'blah');
    let actual = fromTestDataString('blah');
    chkEq('blah', actual);
    deleteFile(testDataFile('blah.txt'));
  });


  it('simple round trip different extnesion', () => {
    toTestDataString('blah', 'blah.yaml');
    let actual = fromTestDataString('blah.yaml');
    chkEq('blah', actual);
    deleteFile(testDataFile('blah.yaml'));
  });

});

describe('from / to tempString', () => {

  it('simple round trip full defaults', () => {
    toTempString('Hi');
    chkEq('Hi', fromTempString());
  });


  let msg = '';
  function logWarning(message: string, additionalInfo: ?string, link: ?string, attr: ?LogAttributes): void {
    msg = message;
  }

  let mockLogging = {
                        logWarning: logWarning,
                        logError: DEFAULT_LOGGING_FUNCTIONS.logError,
                        log: DEFAULT_LOGGING_FUNCTIONS.log
                      };

  it('check for warnings toTempString', () => {
    setLoggingFunctions(mockLogging);
    try {
      msg = '';
      toTempString('Hi');
      chkHasText(msg, 'Temp file written to');
    } finally {
      setLoggingFunctions(DEFAULT_LOGGING_FUNCTIONS);
    }
  });

  it('check for warnings fromTempString', () => {
    setLoggingFunctions(mockLogging);
    try {
      toTempString('Hi');
      msg = '';
      fromTempString();
      chkHasText(msg, 'Reading temp file');
    } finally {
      setLoggingFunctions(DEFAULT_LOGGING_FUNCTIONS);
    }
  });

  it('check for warnings off', () => {
    setLoggingFunctions(mockLogging);
    try {
      msg = '';
      toTempString('Hi', null, false);
      chkEq(msg, '');
    } finally {
      setLoggingFunctions(DEFAULT_LOGGING_FUNCTIONS);
    }
  });

  it('check for warnings off fromTempString', () => {
    setLoggingFunctions(mockLogging);
    try {
      toTempString('Hi');
      msg = '';
      fromTempString(null, false);
      chkEq(msg, '');
    } finally {
      setLoggingFunctions(DEFAULT_LOGGING_FUNCTIONS);
    }
  });

  it('check rewrite warning', () => {
      toTempString('Hi');
      toTempString('Hi');
      let content = fromTempString();
      chkHasText(content, '!!!!! IF YOU ARE USING THIS FOR DEBUGGING');
  });

});

describe('stringToFile / fileToString round trips', () => {

  let DEST_FILE : string = tempFile('hello.txt');
  it('happy simple - round trip', () => {
    stringToFile('Hello', DEST_FILE);
    let actual: string = fileToString(DEST_FILE);
    chkEq('Hello', actual)
  });

  it('happy simple - round trip default ext', () => {
    stringToFile('Hello', tempFile('hello1'));
    let actual: string  = fileToString(tempFile('hello1'));
    chkEq('Hello', actual)
  });

  const UTF8_STR: string = 'ĂĂĂĂĂĂĂĂĂĂĂĂĂĂĂĂĂĂĂĂĂ';
  it('utf8 - default', () => {
    stringToFile(UTF8_STR, tempFile('utf8.txt'));
    let actual: string  = fileToString(tempFile('utf8.txt'));
    chkEq(UTF8_STR, actual);
  });

  it('ascii simple round trip', () => {
    stringToFile('Hello there', tempFile('ascii.txt'), 'ascii');
    let actual: string  = fileToString(tempFile('ascii.txt'), 'ascii');
    chkEq('Hello there', actual);
  });

  it('ascii from utf8 - expect file to be corrupt', () => {
    stringToFile(UTF8_STR, tempFile('utf8.txt'));
    let actual: string  = fileToString(tempFile('utf8.txt'), 'ascii');
    chkFalse(areEqual(UTF8_STR, actual));
  });
});

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

    function isProjectDir(dir: string) {
      let fullPath: string = combine(dir, 'package.json');
      return pathExists(fullPath);
    }

    let projFolder: ?string = seekFolder(BASE_FILE, isProjectDir);
    chkEq(PROJECT_PATH, projFolder);
  });

  it('project does not exist', () => {

    function isProjectDir(dir: string) {
      let fullPath: string = combine(dir, 'package.notExists');
      return pathExists(fullPath);
    }

    let projFolder: ?string  = seekFolder(BASE_FILE, isProjectDir);
    chkEq(null, projFolder);
  });

});

describe('Integration - pathExists', () => {

  it('known file', () => {
    const BASE_DIR: string  = SOURCE_DIR + '\\lib\\FileUtils.js';
    chk(pathExists(BASE_DIR));
  });

  it('known directory', () => {
    const BASE_DIR: string  = SOURCE_DIR + '\\lib';
    chk(pathExists(BASE_DIR));
  });

  it('known directory trailing backslash', () => {
    const BASE_DIR: string  = SOURCE_DIR + '\\lib\\';
    chk(pathExists(BASE_DIR));
  });

  it('missing file', () => {
    const BASE_DIR: string  = SOURCE_DIR + '\\Blahhhhh.hs';
    chkFalse(pathExists(BASE_DIR));
  });

});
