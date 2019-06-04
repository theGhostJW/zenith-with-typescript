import {describe, it} from 'mocha'
import { seekInObj } from '../lib/SysUtils';
import { defaultLogParser, elementsToFullMock,  } from '../lib/LogParser';
import { testDataFile, toTemp, fromTestData } from '../lib/FileUtils';
import { mockFileNameUseEnvironment } from '../../testCases/ProjectConfig';
import {chkEq} from '../lib/AssertionUtils';
import { replaceAll} from '../lib/StringUtils';

describe('file Parsing check failure', () => {

  it("will generate expected result", () => {
    let rawPath = testDataFile('Demo2Log.raw.yaml'),
        summary = defaultLogParser(mockFileNameUseEnvironment)(rawPath);
    toTemp(summary);
  });

})
