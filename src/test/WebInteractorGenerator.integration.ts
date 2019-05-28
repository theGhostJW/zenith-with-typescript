import { chkHasText } from '../lib/AssertionUtils';
import { fromTempString } from '../lib/FileUtils';
import * as _ from 'lodash';
import { generateAndDumpTestFile } from '../lib/WebInteractorGenerator';

describe('generateAndDumpTestFile', () => {

  it('works', () => {
    let before = {
      isUrl: true,
      name: 'http:\\google.com.au'
    };
    generateAndDumpTestFile(before, 'interactor',  'C:\\ZenithFlow\\src\\test\\WebInteractorGenerator.integration.js', 'C:\\ZenithFlow\\temp\\WebInteractor.js', true);
    let actual = fromTempString('WebInteractor.js', false);
    chkHasText(actual, 'startServer();');
  });

});
