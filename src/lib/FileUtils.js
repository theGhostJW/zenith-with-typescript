// @flow

import {def, debug, hasValue, areEqual, ensureHasVal, ensureHasValAnd, objToYaml, yamlToObj} from '../lib/SysUtils';
import { newLine } from '../lib/StringUtils';
import { logWarning, log } from '../lib/Logging';
import { parse, join } from 'path';
import * as path from 'path';
import * as fs from 'fs';
import * as mkdirp from 'mkdirp';
import * as del from  'del';

export type FileEncoding = 'utf8' | 'ucs2' | 'ascii' | 'utf16le' |
                            'latin1' | 'binary' | 'base64' | 'hex';

const TEMP_STR_FILES : { [string]: boolean } = {};

const tmpStrPath = (fileName: ?string = 'tempString', defaultExt: string) => {return defaultExtension(tempFile(def(fileName, 'tempString')), defaultExt);}

export function toTempString(str: string, fileName: ?string, wantWarning: boolean = true, wantDuplicateOverwriteWarning: boolean = true) : string {
  return toTempStringPriv(str, fileName, wantWarning, wantDuplicateOverwriteWarning, '.txt');
}

function toTempStringPriv(str: string, fileName: ?string, wantWarning: boolean, wantDuplicateOverwriteWarning: boolean, fileExt: string) : string {
 let path = tmpStrPath(fileName, fileExt);

 if (wantDuplicateOverwriteWarning && TEMP_STR_FILES[path]){
   str = `# !!!!!!!!!!!!!!!!!!  WARNING THIS FILE HAS BEEN OVERWRITTEN AT LEAST ONCE DURING THIS TEST RUN !!!!!!!!!!!!!!!!!\n` +
   `# !!!!!!!!!!!!!!!!!! IF YOU ARE USING THIS FOR DEBUGGING YOU MAY NOT BE LOOKING AT WHAT YOU THINK YOU ARE !!!!!!!!!!!!!!!!!!` + newLine(2) +
   str;
 }
 else if (wantDuplicateOverwriteWarning) {
   TEMP_STR_FILES[path] = true;
 }

 if (wantWarning) {
   logWarning(`Temp file written to ${path}`);
 }
 stringToFile(str, path);
 return path;
}

export function fromTempString(fileName: ?string, wantWarning: boolean = true) : string  {
  return fromTempStringPriv(fileName, wantWarning, '.txt');
}

function fromTempStringPriv(fileName: ?string, wantWarning: boolean, fileExt: string) : string  {
  let path = tmpStrPath(fileName, fileExt);
  if (wantWarning) {
    logWarning(`Reading temp file from ${path}`);
  }
  return fileToString(path);
}

const tdsPath = (fileName: string): string => {return testDataFile(defaultExtension(fileName, '.txt'));}

export function toTestDataString(str: string, fileName: string) : string  {
  let path = tdsPath(fileName);
  stringToFile(str, path);
  return path;
}

export function fileToObj<T>(fullPath: string) : T  {
  return yamlToObj(fileToString(fullPath));
}

export function fromTestDataString(fileName: string) : string  {
  return fileToString(tdsPath(fileName));
}

export function deleteFile(path: string) : boolean {
  if (pathExists(path)){
    log(`Deleting file: ${path}`);
    fs.unlinkSync(path);
  }
  return !pathExists(path);
}

export function fromTestData<T>(fileName: string) : T  {
  return fromSpecialDir(fileName, testDataFile);
}

export function fromLogDir<T>(fileName: string) : T  {
  return fromSpecialDir(fileName, logFile);
}

export function fromMock<T>(fileName: string) : T  {
  return fromSpecialDir(fileName, mockFile);
}

function fromSpecialDir<T>(fileName: string, pathMaker : (string) => string, defaultExt: string = '.yaml'): T {
  let path = pathMaker(defaultExtension(fileName, defaultExt)),
      str = fileToString(path),
      rslt: T = ((yamlToObj(str): any): T);
  return rslt;
}

export function toTestData<T>(val: T, fileName: string) : string  {
  return toSpecialDir(val, fileName, testDataFile);
}

export function toMock<T>(val: T, fileName: string) : string  {
  return toSpecialDir(val, fileName, mockFile);
}

function toSpecialDir<T>(val: T, fileName: string, pathMaker : (string) => string, defaultExt: string = '.yaml') : string  {
  let path = pathMaker(defaultExtension(fileName, defaultExt));
  return objToFile(val, path);
}

export function objToFile<T>(val: T, filePath: string) : string  {
  let yml = objToYaml(val);
  stringToFile(yml, filePath);
  return filePath;
}

export function toLogDir<T>(val: T, fileName: string) : string  {
  return toSpecialDir(val, fileName, logFile);
}

export function toTemp<T>(val: T, fileName: string, wantWarning: boolean = true, wantDuplicateOverwriteWarning: boolean  = true) : string  {
  let str = objToYaml(val);
  return toTempStringPriv(str, fileName, wantWarning, wantDuplicateOverwriteWarning, '.yaml');
}

export function fromTemp<T>(fileName: string, wantWarning: boolean = true) : T  {
  let str = fromTempStringPriv(fileName, wantWarning, '.yaml');;
  return yamlToObj(str);
}

export function deleteDirectory(dir: string, dryRun: boolean = false): Array<string> {
  return del.sync([combine(dir, '**')], {dryRun: dryRun});
}

export function clearDirectory(dir: string, dryRun: boolean = false): Array<string> {
  return del.sync([combine(dir, '**'), '!' + dir], {dryRun: dryRun});
}


export function forceDirectory(path: string): string {
  mkdirp.sync(path);
  return path;
}

export function defaultExtension(path: string, defExt: string) : string {
  let parts = parse(path);
  return hasValue(fileExtension(path)) ? path : changeExtension(path, defExt);
}

export function changeExtension(path: string, newExt: string) : string {
  let parts = parse(path);
  return join(parts.dir,  parts.name + newExt);
}

export function fileExtension(path: string): string {
  return parse(path).ext;
}

export function fileToString(path: string, encoding: FileEncoding = 'utf8'): string {
  return fs.readFileSync(path, encoding);
}

export function stringToFile(str: string, path: string, encoding: FileEncoding = 'utf8') {
  fs.writeFileSync(path, str, encoding);
}

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
