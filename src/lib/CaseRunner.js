// @flow

import { eachFile, testCaseFile } from '../lib/FileUtils';

let cases = [];
export function testCase(name: string, func: () => void){
  cases.push(
    {
      name: name,
      func: func
    }
  );
}



export function loadAll(){

  function loadFile(name, pth) {
    // Delete cache entry to make sure the file is re-read from disk.
    delete require.cache[pth];
    // Load function from file.
    var func = require(pth);
  }

  eachFile(testCaseFile(''), loadFile);
  cases.forEach((info) => {console.log(info.name); info.func()});

}
