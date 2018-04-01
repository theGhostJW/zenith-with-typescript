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
          CARD_LIST_ID,
          invalidUncheckCheckBox,
          checkReturnChecked,
          readSetRadioGroup,
          radioItemVals,
          setRadioGroup
        } from '../lib/WebUtilsTestImp';


describe('radioGroup', () => {

  const AVAILABLE_CARDS = ['Visa', 'MasterCard', 'American Express'];
  it('radioItemVals', () => {
      let groupReads = cast(rerun(smartbearOrders, radioItemVals, CARD_LIST_ID));
      chkEq(AVAILABLE_CARDS, groupReads);
  });

  it('setRadioGroup / readRadioGroup', () => {
      let groupReads = cast(rerun(smartbearOrders, readSetRadioGroup));
      chkEq(AVAILABLE_CARDS, groupReads);
  });

  it.only('setRadioGroup - mising value exception ', () => {
    chkExceptionText(
       () => rerun(smartbearOrders, setRadioGroup, CARD_LIST_ID, 'BitCoin'),
      'Could not find matching radio*button for value or label: BitCoin'
    )
  });


});

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

  it('check uncheck radio', () => {
      let checkedUnchecked = cast(rerun(smartBearLogIn, checkReturnChecked));
      chkEq([true, false], checkedUnchecked);
  });

  it('setChecked - radio buttons', () => {
    rerun(smartbearOrders, checkUncheck);
  });

  it('setUnchecked Invalid Radio Button', () => {
    chkExceptionText(
       () => rerun(smartbearOrders, invalidUncheckCheckBox),
      'Cannot uncheck radio buttons with setChecked'
    )
  });

});
