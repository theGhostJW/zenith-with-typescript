import {describe, it} from 'mocha'
import { defaultLogParser} from '../lib/LogParser';
import { testDataFile, toTemp, tempFile } from '../lib/FileUtils';
import { mockFileNameUseEnvironment } from '../../testCases/ProjectConfig';

describe('file Parsing check failure', () => {

  it("will generate expected result", () => {
    let rawPath = testDataFile('Demo2Log.raw.yaml'),
        summary = defaultLogParser(mockFileNameUseEnvironment, tempFile())(rawPath);
    toTemp(summary);
  });

})
