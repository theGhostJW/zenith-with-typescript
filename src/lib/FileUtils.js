// @flow

import {def, debug, hasValue, areEqual, ensureHasVal, fail} from '../lib/SysUtils';
import * as path from 'path';
import * as fs from 'fs';

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

function projectSubDir(subDir: string) {
  let result = combine(projectDir(), subDir);
  return
}
