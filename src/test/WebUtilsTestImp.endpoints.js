// @flow


import {chk, chkEq, chkEqJson, chkExceptionText, chkFalse, chkWithMessage} from '../lib/AssertionUtils';
import { cast, debug, waitRetry, fail } from '../lib/SysUtils';
import { rerun } from '../lib/WebUtils';

import { checkUncheck,
          clickLink,
          linkByTextText,
          links,
          smartBearLogIn,
          smartbearOrders,
          clickOrderLink,
          TEST_LOG_IN,
          invalidUncheckCheckBox
        } from '../lib/WebUtilsTestImp';

describe('set', () => {

  it('simple set', () => {
    rerun(TEST_LOG_IN, smartBearLogIn);
  });

});

describe('links', () => {

  it('getAll', () => {
    chk(cast(rerun(smartBearLogIn, links)).length > 4);
  });

});


describe('linkByText', () => {

  it('simple exists', () => {
    chkEq('View all orders', rerun(smartBearLogIn, linkByTextText));
  });

});

describe('clickLink', () => {

  it('simple link', () => {
    rerun(smartBearLogIn, clickLink, '*products*');
  });

  it('HOF', () => {
    rerun(smartBearLogIn, clickOrderLink);
  });

});

describe('setChecked', () => {

  it('setChecked - radio buttons', () => {
    rerun(smartbearOrders, checkUncheck);
  });

  it.only('setUnchecked Invalid Radio Button', () => {
      fail('BAng');
  //  try {
  //    rerun(smartbearOrders, invalidUncheckCheckBox)
  //  } catch (e) {
  //    debug(e, 'exception handled')
  //  }

    // chkExceptionText(
    //    () => rerun(smartbearOrders, invalidUncheckCheckBox),
    //   'Cannot uncheck radio buttons with setChecked'
    // )

  });

});
