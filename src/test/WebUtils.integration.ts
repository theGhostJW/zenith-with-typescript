import {  projectSubDir, combine} from '../lib/FileUtils';
import * as _ from 'lodash';
import { findMatchingSourceFile } from '../lib/WebUtils';

describe('findMatchingSourceFile', () => {
  it('simple', function blahhh(){
    var target = combine(projectSubDir('src'), 'test', 'WebUtils.test.ts')
    console.log(findMatchingSourceFile(target));
  });
});
