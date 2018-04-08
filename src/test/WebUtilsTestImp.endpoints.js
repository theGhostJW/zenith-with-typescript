// @flow


import {chk, chkEq, chkEqJson, chkExceptionText, chkFalse, chkWithMessage,
        chkHasText } from '../lib/AssertionUtils';
import { cast, debug, waitRetry, fail } from '../lib/SysUtils';
import { rerun } from '../lib/WebUtils';
import { show } from '../lib/StringUtils';
import * as _ from 'lodash';


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
          setRadioGroup,
          setSelect,
          setReadProduct,
          setReadInput,
          PRODUCT_SELECTOR,
          AVAILABLE_PRODUCTS,
          FORM_INPUT_IDS,
          FORM_INPUT_RADIO_NAME,
          FORM_INPUT_FOR_LABELS,
          basicSet,
          setForm,
          parent,
          recursiveParent,
          FORM_ID
        } from '../lib/WebUtilsTestImp';


describe('setForm', () => {

  it('setForm ~ ids', () => {
    // let actual = rerun(smartbearOrders, setFormWithIds),
    //     expected = _.chain({ctl00_MainContent_fmwOrder_txtQuantity: '95'})
    //                  .defaults(FORM_INPUT)
    //                  .mapValues(show)
    //                  .value();

    //chkEq(expected, actual)
  });

  // Radio set by group name
  it('setForm ~ radio group by name', () => {
    let input = FORM_INPUT_RADIO_NAME;
    debug('running');
    rerun(smartbearOrders, setForm, FORM_ID, input);
     // let actual = ,
     //     expected = _.chain({ctl00_MainContent_fmwOrder_txtQuantity: '95'})
     //                 .defaults(FORM_INPUT)
     //                 .mapValues(show)
     //                 .value();
     //
     // chkEq(expected, actual)
  });

  // Radio set by group name
  it.only('setForm ~ FORLABELS', () => {
    let input = FORM_INPUT_FOR_LABELS;
    debug('running');
    rerun(smartbearOrders, setForm, FORM_ID, input);
     // let actual = ,
     //     expected = _.chain({ctl00_MainContent_fmwOrder_txtQuantity: '95'})
     //                 .defaults(FORM_INPUT)
     //                 .mapValues(show)
     //                 .value();
     //
     // chkEq(expected, actual)
  });

});


describe('parent', () => {

  it('simple', () => {
    let result = rerun(smartbearOrders, parent, '#ctl00_MainContent_fmwOrder_cardList_0');
    debug(result);
  });

  it('recursive to top', () => {
    let result = rerun(smartbearOrders, recursiveParent);
    // Only sort of working can't gettext on top parent
    chk(result != null);
  });

});

describe('full form set ~ hard coded', () => {
  it('set and read', () => {
    let actual = rerun(smartbearOrders, basicSet),
        expected = _.chain({ctl00_MainContent_fmwOrder_txtQuantity: '95'})
                     .defaults(FORM_INPUT_IDS)
                     .mapValues(show)
                     .value();

    chkEq(expected, actual)
  });
});

describe('setInput', () => {
  it('set and read', () => {
    let actual = rerun(smartbearOrders, setReadInput);
    chkEq('Janice Peterson', actual);
  });
});

describe('select', () => {

  it('simple select', () => {
    let allProducts = cast(rerun(smartbearOrders, setReadProduct));
    chkEq(AVAILABLE_PRODUCTS.reverse(), allProducts);
  });

  it('invalid select', () => {
    chkExceptionText(
       () => rerun(smartbearOrders, setSelect, 'Lexus'),
      'An element could not be located'
    )
  });

});

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

  it('setRadioGroup - mising value exception ', () => {
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
