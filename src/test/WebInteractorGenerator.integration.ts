import { chkHasText } from '../lib/AssertionUtils';
import { fromTempString, projectDir, tempFile, projectSubDir } from '../lib/FileUtils';
import * as _ from 'lodash';
import { generateAndDumpTestFile } from '../lib/WebInteractorGenerator';

describe('generateAndDumpTestFile-works', () => {

  it('works', () => {
    let before = {
      isUrl: true,
      name: 'http:\\google.com.au'
    };
    generateAndDumpTestFile(before, 'interactor',  projectSubDir('src') + '\\test\\WebInteractorGenerator.integration.js', tempFile('WebInteractor.js'), true);
    let actual = fromTempString('WebInteractor.js', false);
    chkHasText(actual, 'startServer();');
  });

});
