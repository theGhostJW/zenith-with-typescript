// @flow

import {
  def,
  debug,
  hasValue,
  areEqual,
  ensureHasVal,
  ensureHasValAnd,
  ensure,
  objToYaml,
  yamlToObj,
  forceArray
} from '../lib/SysUtils';
import {newLine, toString, replaceAll} from '../lib/StringUtils';
import type { CharacterEncoding } from '../lib/StringUtils';
import {logWarning, log, logError, timeStampedLogDir} from '../lib/Logging';
import {parse, join, relative } from 'path';
import * as path from 'path';
import * as fs from 'fs';
import * as mkdirp from 'mkdirp';
import * as del from 'del';
import * as fsEx from 'file-system';
import * as _ from 'lodash';
import nodeZip from 'node-zip';
import { toMoment } from '../lib/DateTimeUtils'
import lineByLine from 'n-readlines';


const TEMP_STR_FILES : {
  [string] : boolean
} = {};

export function eachLine(fullPath: string, func: (string) => void, singleByteNLChar: string = '\n', readChunk: number = 1024){
  let ops = {
              readChunk: readChunk,
              newLineCharacter: singleByteNLChar
            },
      liner = new lineByLine(fullPath, ops),
      line = '';

  while (line = liner.next()) {
    func(line.toString('utf8'));
  }
}

export function fileLastModified(fullFilePath: string ): moment$Moment  {
  ensure(pathExists(fullFilePath), 'Source file does not exist ${fullFilePath}');
  let stats = fs.statSync(fullFilePath);
  return toMoment(stats.mtime);
}


export const copyFile = (sourcePath: string, desPath: string): string => {
  ensure(pathExists(sourcePath), 'Source file does not exist ${sourcePath}');
  fs.writeFileSync(desPath, fs.readFileSync(sourcePath));
  log(`${sourcePath} copied to ${desPath}`);
  return desPath;
}

/*\
|*| Based on MDN function
|*|  :: translate relative paths to absolute paths ::
|*|
|*|  https://developer.mozilla.org/en-US/docs/Web/API/document.cookie
|*|
|*|  The following code is released under the GNU Public License, version 3 or later.
|*|  http://www.gnu.org/licenses/gpl-3.0-standalone.html
|*|
\*/
export function relativeToAbsolute (relativePath: string, basePath: string): string {
  let nUpLn, sDir = "",
      sPath = basePath;

  sPath = replaceAll(sPath, path.sep, '/');
  relativePath = replaceAll(relativePath, path.sep, '/');

  sPath = sPath.replace(/[^\/]*$/, relativePath.replace(/(\/|^)(?:\.?\/+)+/g, "$1"));

  for (var nEnd, nStart = 0; nEnd = sPath.indexOf("/../", nStart), nEnd > -1; nStart = nEnd + nUpLn) {
    nUpLn = /^\/(?:\.\.\/)*/.exec(sPath.slice(nEnd))[0].length;
    sDir = (sDir + sPath.substring(nStart, nEnd)).replace(new RegExp("(?:\\\/+[^\\\/]*){0," + ((nUpLn - 1) / 3) + "}$"), "/");
  }
  return replaceAll(sDir + sPath.substr(nStart), '/', path.sep) ;
}

export const relativePath = relative;

export function zipAll(sourceDir: string, destPath: string, fileFilter: (fileName: string, filePath: string) => boolean = (p, s) => true ): string {

 log(`zipping ${sourceDir} to ${destPath}`);

 let zip = nodeZip();

 function archiveFile(name, path) {
   let relPath = relative(sourceDir, path);
   zip.file(relPath, fs.readFileSync(path));
 }

 eachFile(sourceDir, archiveFile, fileFilter);

 let data = zip.generate({base64:false, compression:'DEFLATE'});
 fs.writeFileSync(destPath, data, 'binary');
 return destPath;
}


export function unzipAll(zipFilePath: string, destDirectory: string){
  var zip = nodeZip(fs.readFileSync(zipFilePath, 'binary'), {base64: false, checkCRC32: true});

  const unZip = (fileInfo) => {
    let fileName = fileInfo.name,
        destPath = combine(destDirectory, fileName);
    forceDirectory(parentDir(destPath));
    fs.writeFileSync(destPath, fileInfo._data, 'binary');
    log(`${fileName} unzipped to ${destPath}`);
  }
  _.each(zip.files, (val, idx, arr) => unZip(val));

  return destDirectory;
}

const tmpStrPath = (fileName :?string = 'tempString', defaultExt : string) => {
  return defaultExtension(tempFile(def(fileName, 'tempString')), defaultExt);
}

export function toTempString(str : string, fileName : ?string, wantWarning : boolean = true, wantDuplicateOverwriteWarning : boolean = true) : string {
  return toTempStringPriv(str, fileName, wantWarning, wantDuplicateOverwriteWarning, '.txt');
}

// base name of a full path
export function fileOrFolderName(fullPath: string): string {
  let parts = path.parse(fullPath);
  return parts.base;
}

export const fileOrFolderNameNoExt = (fullPath: string) => changeExtension(fileOrFolderName(fullPath), '');

function toTempStringPriv(str : string, fileName : ?string, wantWarning : boolean, wantDuplicateOverwriteWarning : boolean, fileExt : string) : string {
  let path = tmpStrPath(fileName, fileExt);

  if (wantDuplicateOverwriteWarning && TEMP_STR_FILES[path]) {
    str = `# !!!!!!!!!!!!!!!!!!  WARNING THIS FILE HAS BEEN OVERWRITTEN AT LEAST ONCE DURING THIS TEST RUN !!!!!!!!!!!!!!!!!\n` + `# !!!!!!!!!!!!!!!!!! IF YOU ARE USING THIS FOR DEBUGGING YOU MAY NOT BE LOOKING AT WHAT YOU THINK YOU ARE !!!!!!!!!!!!!!!!!!` + newLine(2) + str;
  } else if (wantDuplicateOverwriteWarning) {
    TEMP_STR_FILES[path] = true;
  }

  if (wantWarning) {
    logWarning(`Temp file written to ${path}`);
  }
  stringToFile(str, path);
  return path;
}

export function fromTempString(fileName : ?string, wantWarning : boolean = true) : string {
  return fromTempStringPriv(fileName, wantWarning, '.txt');
}

function fromTempStringPriv(fileName :
  ? string, wantWarning : boolean, fileExt : string) : string {
  let path = tmpStrPath(fileName, fileExt);
  if (wantWarning) {
    logWarning(`Reading temp file from ${path}`);
  }
  return fileToString(path);
}

const tdsPath = (fileName : string) : string => testDataFile(defaultExtension(fileName, '.txt'));

export function toTestDataString(str : string, fileName : string) : string {
  let path = tdsPath(fileName);
  stringToFile(str, path);
  return path;
}

export type FileFilterFunc = (filePath : string, filename : string) => boolean;
export type FileFilterGlobs = string | Array < string >;

export function eachPathNonRecursive(baseDir: string, pathFunc: (pathName: string) => void ): void {
  fs.readdirSync(baseDir).forEach(pathName => {
    pathFunc(pathName);
  });
}

// recursively list folders
export const listFolders = (baseDir: string) => listPaths(baseDir, false);
export const listFiles = (baseDir: string) => listPaths(baseDir, true);


function listPaths(baseDir: string, wantFiles: boolean) : Array<string> {
  let result : Array<string> = [],
      pushIt = (name : string, path: string) => {result.push(path);};

  if (wantFiles) {
    eachFile(baseDir, pushIt);
  } else {
    eachFolder(baseDir, pushIt);
  }
  return result;
}

export function eachFolder(baseDir : string, directoryFunc : (folderName : string, folderPath : string) => void, filterFunc : ?(folderName : string, folderPath : string) => boolean) : void {
  const trueDirFunc = (folderName : string, folderPath : string) => directoryFunc(folderName, folderPath);
  const trueFilterFunc = filterFunc == null
    ? filterFunc: (folderName : string, folderPath : string) => filterFunc == null
                                                                      ? true
                                                                      : filterFunc(folderName, folderPath);
  eachPath(false, baseDir, trueDirFunc, trueFilterFunc);
}

export function parentDir(baseDir: string): string {
  return path.parse(baseDir).dir;
}

// https://github.com/douzi8/file-match#filter-description
// filter description
//
//     *.js only match js files in current dir.
//     **/*.js match all js files.
//     path/*.js match js files in path.
//     !*.js exclude js files in current dir.
//     .{jpg,png,gif} means jpg, png or gif
//
// '**/*'                 // Match all files
// '!**/*.js'             // Exclude all js files
// '**/*.{jpg,png,gif}'   // Match jpg, png, or gif files
export function eachFile(dirPath : string, fileFunc : (fileName : string, filePath : string) => void, filterFuncOrGlob :
  ? FileFilterFunc | FileFilterGlobs, filterGlob :
  ? FileFilterGlobs) : void {
  eachPath(true, dirPath, fileFunc, filterFuncOrGlob, filterGlob);
}

function eachPath(wantFiles : boolean, dirPath : string, fileFunc : (string, string) => void, filterFuncOrGlob :
  ? FileFilterFunc | FileFilterGlobs, filterGlob :
  ? FileFilterGlobs) : void {

  let filterIsFunc = _.isObject(filterFuncOrGlob) && !_.isArray(filterFuncOrGlob);

  ensure(filterGlob == null || filterFuncOrGlob == null || filterIsFunc, 'filterFuncOrGlob must be a function if filterGlob param is used');

  let trueCallBack = (filePath, relative, fileName) => {
    let filterFunc = filterIsFunc
      ? ((filterFuncOrGlob : any): FileFilterFunc)
      : (filename : string, filePath : string) => true;

    let param1 = wantFiles ?  fileName : fileOrFolderName(filePath),
        param2 = filePath;

    if (hasValue(fileName) === wantFiles && filterFunc(param1, param2)) {
      fileFunc(param1, param2);
    }
  }

  let trueFilterGlob = filterIsFunc
    ? filterGlob
    : filterFuncOrGlob;

  if (trueFilterGlob == null) {
    fsEx.recurseSync(dirPath, trueCallBack);
  } else {
    fsEx.recurseSync(dirPath, trueFilterGlob, trueCallBack);
  }
}

export function fileToObj < T > (fullPath : string) : T {
  return yamlToObj(fileToString(fullPath));
}

export function fromTestDataString(fileName : string) : string {
  return fileToString(tdsPath(fileName));
}

export function deleteFile(path : string) : boolean {
  if(pathExists(path)) {
    log(`Deleting file: ${path}`);
    fs.unlinkSync(path);
  }
  return !pathExists(path);
}

export function fromTestData < T > (fileName : string) : T {
  return fromSpecialDir(fileName, testDataFile);
}

export function fromLogDir < T > (fileName : string) : T {
  return fromSpecialDir(fileName, logFile);
}

export function fromMock < T > (fileName : string) : T {
  return fromSpecialDir(fileName, mockFile);
}

function fromSpecialDir < T > (fileName : string, pathMaker : (string) => string, defaultExt : string = '.yaml') : T {
    let path = pathMaker(defaultExtension(fileName, defaultExt)),
    str = fileToString(path),
    rslt: T = ((yamlToObj(str) : any) : T);
  return rslt;
}

export function toTestData < T > (val : T, fileName : string) : string {
  return toSpecialDir(val, fileName, testDataFile);
}

export function toMock < T > (val : T, fileName : string) : string {
  return toSpecialDir(val, fileName, mockFile);
}

function toSpecialDir < T > (val : T, fileName : string, pathMaker : (string) => string, defaultExt : string = '.yaml') : string {
  let path = pathMaker(defaultExtension(fileName, defaultExt));
  return objToFile(val, path);
}

export function objToFile < T > (val : T, filePath : string) : string {
  let yml = objToYaml(val);
  stringToFile(yml, filePath);
  return filePath;
}

export function toLogDir < T > (val : T, fileName : string) : string {
  return toSpecialDir(val, fileName, logFile);
}

export function stringToLogFile(str : string, fileNameNoPath : string, encoding : CharacterEncoding = 'utf8') : string {
  return stringToFile(str, logFile(fileNameNoPath), encoding);
}

export function toTemp <T> (val : T, fileName : string = 'toTemp', wantWarning : boolean = true, wantDuplicateOverwriteWarning : boolean = true) : string {
  let str = objToYaml(val);
  return toTempStringPriv(str, fileName, wantWarning, wantDuplicateOverwriteWarning, '.yaml');
}

export function fromTemp < T > (fileName : string, wantWarning : boolean = true) : T {
  let str = fromTempStringPriv(fileName, wantWarning, '.yaml');;
  return yamlToObj(str);
}

export function deleteDirectory(dir : string, dryRun : boolean = false) : Array < string > {
  if (!dryRun){
    log(`Deleting directory: ${dir}`);
  }
  return del.sync([combine(dir, '**')], {dryRun: dryRun});
}

export function clearDirectory(dir : string, dryRun : boolean = false) : Array < string > {
  return del.sync([
    combine(dir, '**'),
    '!' + dir
  ], {dryRun: dryRun});
}

export function forceDirectory(path : string) : string {
  mkdirp.sync(path);
  return path;
}

export function defaultExtension(path : string, defExt : string) : string {
  let parts = parse(path);
  return hasValue(fileExtension(path))
    ? path
    : changeExtension(path, defExt);
}

export function changeExtension(path : string, newExt : string) : string {
  let parts = parse(path);
  return join(parts.dir, parts.name + newExt);
}

export function fileExtension(path : string) : string {return parse(path).ext;}

export function fileToString(path : string, encoding : CharacterEncoding = 'utf8') : string {
  return fs.readFileSync(path, encoding);
}

export function stringToFile(str : string, path : string, encoding : CharacterEncoding = 'utf8'): string {
  fs.writeFileSync(path, str, encoding);
  return path;
}

export function fileToLines(path : string, encoding : CharacterEncoding = 'utf8') : Array<string> {
  return fs.readFileSync(path, encoding).split(newLine());
}

export function linesToFile(lines : Array<string>, path : string, encoding : CharacterEncoding = 'utf8') {
  fs.writeFileSync(path, lines.join(newLine()), encoding);
}

export function tempFile(fileName :? string) : string {
  return subFile('temp', fileName);
}

export function testCaseFile(fileName :? string) : string {
  return subFile('testCases', fileName);
}

export function mockFile(fileName :? string) : string {
  return subFile('mocks', fileName);
}

export function testDataFile(fileName :? string) : string {
  return subFile('testData', fileName);
}

export function runTimeFile(fileName :
  ? string) : string {
  return subFile('runTimeFiles', fileName);
}

export function logFile(fileName :? string) : string {
  let parDir = timeStampedLogDir();
  return parDir == '' || parDir == null ? logFileBase(fileName) : combine(parDir, def(fileName, '')) ;
}

export function logFileBase(fileName :? string) : string {
  return subFile('logs', fileName);
}

function subFile(subDir :string, fileName: ?string) : string {
  return fileName == null || fileName == ''
    ? projectSubDir(subDir)
    : combine(projectSubDir(subDir), fileName);
}

export function combine(root : string, ...childPaths : Array < string >) {
  return path.join(root, ...childPaths);
}

export function seekFolder(startFileOrFolder : string, pathPredicate : (path : string) => boolean) :
  ? string {
    return hasValue(startFileOrFolder)
      ? pathPredicate(startFileOrFolder)
        ? startFileOrFolder
        : areEqual(path.dirname(startFileOrFolder), startFileOrFolder)
          ? null
          : seekFolder(path.dirname(startFileOrFolder), pathPredicate): null;
  }

export function pathExists(path : string) : boolean {return fs.existsSync(path);}

function projectDirTry(seedName: string, sentinalProjectFile: string) : [?string, Array<string>] {

  let tried = [];
  function isProjectDir(dir : string): boolean {
    let fullPath = combine(dir, sentinalProjectFile);
    tried.push(fullPath);
    return pathExists(fullPath);
  }

  let projFolder = seekFolder(seedName, isProjectDir);
  return [projFolder, tried];
}

let projectDirSingleton: ?string = null;
export function projectDir() : string {

  if (projectDirSingleton == null){
    let seedName = module.filename,
        try1 = projectDirTry(seedName, 'ZwtfProjectBase.txt'),
        dir1 = try1[0];

    if (dir1 != null){
      return dir1;
    }

    // assume framework testing fall back to package.json
    let try2 = projectDirTry(seedName, 'package.json'),
        dir2 = try2[0];

    projectDirSingleton = ensureHasVal(dir2, `Cannot find project file path when searching up from: ${seedName} - tried: ${forceArray(try1[1], try2[1]).join(', ')}`);
  }

  return projectDirSingleton;
}

function projectSubDir(subDir : string) : string {
  let result = combine(projectDir(), subDir);
  return ensureHasValAnd(result, pathExists, `Cannot find project file path when searching up from: ${result}`);
}
