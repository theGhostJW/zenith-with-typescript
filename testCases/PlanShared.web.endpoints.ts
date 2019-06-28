import * as _ from 'lodash';

import { allItems } from '../src/lib/TestRunner';
import { baseData } from './PlanIT_Demo2.web.data';
import { testCaseEndPoint, run } from './ProjectConfig';
import { goHome, goContacts} from './PlanShared.web';
import { toTemp } from '../src/lib/FileUtils';
import { wdDebug } from '../src/lib/WebUtils';



describe('endPoint', () => {
  it('planShared - contacts', () => {
    wdDebug('http://jupiter.cloud.planittesting.com/', goContacts);
  });
});
