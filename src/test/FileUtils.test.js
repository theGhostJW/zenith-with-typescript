import {chk, chkEq, chkEqJson, chkFalse} from '../lib/AssertionUtils';
import * as _ from 'lodash';
import { debug } from '../lib/SysUtils';
import { combine, fileExtension, changeExtension, defaultExtension, fileOrFolderName, fileOrFolderNameNoExt,  parentDir } from '../lib/FileUtils';


describe('parentDir', () => {

  it('full dir', () => {
    chkEq('C:\\ZWTF', parentDir('C:\\ZWTF\\fullFunctionList.txt'));
  });

  it('folder', () => {
    chkEq('C:\\ZWTF', parentDir('C:\\ZWTF\\subfldr\\'));
  });

});

describe('fileOrFolderName', () => {

  it('full file', () => {
    chkEq('tableRecords.json', fileOrFolderName('C:\\Automation\\TestComplete\\Basis\\Seed\\Temp\\tableRecords.json'))
  });

  it('directory', () => {
    chkEq('Temp', fileOrFolderName('C:\\Automation\\TestComplete\\Basis\\Seed\\Temp\\'))
  });

  it('directory no slash', () => {
    chkEq('Temp', fileOrFolderName('C:\\Automation\\TestComplete\\Basis\\Seed\\Temp\\'))
  });

});

describe('fileOrFolderNameNoExt', () => {

  it('full path', () => {
    chkEq('tableRecords', fileOrFolderNameNoExt('C:\\Automation\\TestComplete\\Basis\\Seed\\Temp\\tableRecords.json'))
  });

  it('already no ext', () => {
    chkEq('tableRecords', fileOrFolderNameNoExt('C:\\Automation\\TestComplete\\Basis\\Seed\\Temp\\tableRecords'))
  });

});


describe('folderName', () => {

  it('', () => {

  });

});

describe('defaultExtension', () => {

  it('full path', () => {
      chkEq('C:\\Program Files\\Blahh.txt', defaultExtension('C:\\Program Files\\Blahh', '.txt'));
  });

  it('file only', () => {
      chkEq('my.exe', defaultExtension('my', '.exe'));
  });

  it('has extension', () => {
      chkEq('my.exe', defaultExtension('my.exe', '.txt'));
  });

  it('ends in dot', () => {
      chkEq('my.', defaultExtension('my.', '.exe'));
  });

});

describe('combine', () => {

  it('combine just a path', () => {
      chkEq('C:\\Program Files\\Blahh', combine('C:', 'Program Files', 'Blahh'));
  });

  it('path and file', () => {
      chkEq('C:\\Program Files\\Blahh\\my.exe', combine('C:', 'Program Files', 'Blahh', 'my.exe'));
  });

});

describe('fileExtension', () => {

  it('fullPath', () => {
    chkEq('.txt', fileExtension('C:\\myDir\\text.copy.txt'));
  });

  it('file name only', () => {
    chkEq('.txt', fileExtension('text.copy.txt'));
  });

  it('no extension', () => {
    chkEq('', fileExtension('text'));
  });

  it('directory', () => {
    chkEq('', fileExtension('C:\\myDir\\C:\\myDir\\'));
  });

  it('ends in dot', () => {
    chkEq('.', fileExtension('file.'));
  });

});

describe('changeExtension', () => {

  it('fullPath', () => {
    chkEq('C:\\myDir\\text.copy.yaml', changeExtension('C:\\myDir\\text.copy.txt', '.yaml'));
  });

  it('file name only', () => {
    chkEq('text.copy.json', changeExtension('text.copy.txt', '.json'));
  });

  it('no extension', () => {
    chkEq('textcopy.json', changeExtension('textcopy', '.json'));
  });

  it('null extension', () => {
    chkEq('C:\\myDir\\C:\\myDir\\myFile', changeExtension('C:\\myDir\\C:\\myDir\\myFile.uaml', ''));
  });

  it('ends in dot', () => {
    chkEq('file.jsp', changeExtension('file.', '.jsp'));
  });

});
