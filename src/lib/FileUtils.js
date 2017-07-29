// @flow

import {def, debug, hasValue, areEqual, ensureHasVal, ensureHasValAnd} from '../lib/SysUtils';
import * as path from 'path';
import * as fs from 'fs';

export function tempFile(fileName: ?string): string {
  return subFile('temp', fileName);
}

export function mockFile(fileName: ?string): string {
  return subFile('mocks', fileName);
}

export function testDataFile(fileName: ?string): string {
  return subFile('testData', fileName);
}

export function runTimeFile(fileName: ?string): string {
  return subFile('runTimeFiles', fileName);
}

export function logFile(fileName: ?string): string {
  return subFile('logs', fileName);
}

function subFile(subDir: string, fileName: ?string) : string {
  return fileName == null ? projectSubDir(subDir) : combine(projectSubDir(subDir), fileName);
}

export function combine(root : string, ...childPaths : Array < string >) {
  return path.join(root, ...childPaths);
}

export function seekFolder(startFileOrFolder : string, pathPredicate : (path : string) => boolean) :  ? string {
  return hasValue(startFileOrFolder)
    ? pathPredicate(startFileOrFolder)
      ? startFileOrFolder
      : areEqual(path.dirname(startFileOrFolder), startFileOrFolder)
        ? null
        : seekFolder(path.dirname(startFileOrFolder), pathPredicate): null;
  }

export function pathExists(path : string) : boolean {return fs.existsSync(path);}

export function projectDir(): string {

  let tried = [];
  function isProjectDir(dir: string): boolean {
    let fullPath = combine(dir, 'package.json');
    tried.push(fullPath);
    return pathExists(fullPath);
  }

  let seedName = module.filename,
      projFolder = seekFolder(seedName, isProjectDir);

  return ensureHasVal(projFolder, `Cannot find project file path when searching up from: ${seedName} - tried: ${tried.join(', ')}`);
}

function projectSubDir(subDir: string): string {
  let result = combine(projectDir(), subDir);
  return ensureHasValAnd(result, pathExists, `Cannot find project file path when searching up from: ${result}`);
}
