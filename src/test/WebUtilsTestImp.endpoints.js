// @flow





import {
  chk,
  chkEq,
  chkEqJson,
  chkExceptionText,
  chkFalse,
  chkHasText,
  chkWithMessage,
} from '../lib/AssertionUtils';
import { show } from '../lib/StringUtils';
import { cast, debug, fail, waitRetry } from '../lib/SysUtils';
import { read, rerun, set, setForm } from '../lib/WebUtils';
import { basicSet,  cellVal, checkReturnChecked, checkUncheck, clickLink, clickOrderLink,
        /* setForm,*/ getForm,  invalidUncheckCheckBox, linkByTextText,  links, mapCellsLog, mapCellsLogNoInvisibles,
        mapCellsSimple, mapCellsSimpleLog, mapCellsSimpleLogNoInvisibles, parent, radioItemVals,
        readCell,readSetRadioGroup, recursiveParent,  setRadioGroup,  setReadInput,
        setReadProduct,  setSelect, setSmartbearcaps, setSmartbearcapsLwrAddress, setThisForm,
        setWithFindByIdOnlyAndLwrStreetName, setWithFindByIdOnlyAndLwrStreetNameAndSpcialisedFinder, smartBearLogIn,  smartbearOrders,
        readTable, setTable, AVAILABLE_PRODUCTS, CARD_LIST_ID,
        FORM_ID, FORM_INPUT_FOR_LABELS,
        FORM_INPUT_MOSTLY_IDS,
        FORM_INPUT_PROXIMAL_LABELS,
        FORM_INPUT_RADIO_NAME,
        PRODUCT_SELECTOR,
        TEST_LOG_IN
        } from '../lib/WebUtilsTestImp';

import * as _ from 'lodash';



describe('Table Utils', () => {

  describe('mapCellsSimple', () => {

    it('Include Invisible', () => {
      let rslt = rerun(smartBearLogIn, mapCellsSimpleLog, '#ctl00_MainContent_orderGrid');
      chkEq(9, rslt.length);
    });

    it('Exclude Invisible', () => {
      let rslt = rerun(smartBearLogIn, mapCellsSimpleLogNoInvisibles, '#ctl00_MainContent_orderGrid');
      chkEq(9, rslt.length);
    });

  });

  describe('mapCells', () => {

    it('mapCells Include Invisible', () => {
      let rslt = rerun(smartBearLogIn, mapCellsLog, '#ctl00_MainContent_orderGrid');
      chkEq(8, rslt.length);
    });

    it('eachCellSimple Exclude Invisible', () => {
      let rslt = rerun(smartBearLogIn, mapCellsLogNoInvisibles, '#ctl00_MainContent_orderGrid');
      chkEq(8, rslt.length);
    });

  });

  describe('cell', () => {

    it('first record', () => {
      let params = {
                     Product: 'ScreenSaver',
                      Zip: 748
                    },
      rslt = rerun(smartBearLogIn, cellVal, '#ctl00_MainContent_orderGrid', params, 'Name');
      chkEq('Paul Brown', rslt);
    });

    it('other record', () => {
      let params = {
                     Product: 'MyMoney',
                     Card: 'MasterCard'
                    },
      rslt = rerun(smartBearLogIn, cellVal, '#ctl00_MainContent_orderGrid', params, 'Name');
      chkEq('Susan McLaren', rslt);
    });

    it('bad name', () => {
      let params = {
                     Product: 'MyMoney',
                     NonExistentCol: 'MasterCard'
                   };

      chkExceptionText(
                        () => rerun(smartBearLogIn, cellVal, '#ctl00_MainContent_orderGrid', params, 'Name'),
                        'do not appear in the table header: NonExistentCol.'
      );
    });

  });

  describe('readCell', () => {

    it('simple', () => {
      let params = {
                     Product: 'FamilyAlbum',
                     Zip: 63325
                    },
          rslt = rerun(smartBearLogIn, readCell, '#ctl00_MainContent_orderGrid', params, 'Name');
      chkEq('Clare Jefferson', rslt);
    });

  });

  describe('readTable', () => {

    it('all cols', () => {
      let rslt = rerun(smartBearLogIn, readTable, '#ctl00_MainContent_orderGrid');
      chkEq(8, rslt.length);
      chkEq(13, _.keys(rslt[0]).length);
      debug(rslt);
    });

    it('some cols', () => {
      let rslt = rerun(smartBearLogIn, readTable, '#ctl00_MainContent_orderGrid', ['Name', 'Product', 'Zip']);
      chkEq(8, rslt.length);
      chkEq(3, _.keys(rslt[0]).length);
      debug(rslt);
    });

  });

  describe('setTable', () => {

    it('simple', () => {
      rerun(smartBearLogIn, setTable, '#ctl00_MainContent_orderGrid',
                                                ['~Name'     , 'idx0' ],
                                                ['Steve Johns', true],
                                              );
    });

    it('multiple', () => {
      rerun(smartBearLogIn, setTable, '#ctl00_MainContent_orderGrid',
                                                ['~Name'     , 'idx0' ],
                                                ['Steve Johns', true],
                                                ['Mark Smith',  true],
                                                ['Clare Jefferson', true]
                                              );
    });

  });

});

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
  it('setForm ~ FORLABELS', () => {
    let input = FORM_INPUT_FOR_LABELS;
    rerun(smartbearOrders, setForm, FORM_ID, input);
  });

  it('setForm ~ Proximal labels - needs special code edits to be valid', () => {
    let input = FORM_INPUT_PROXIMAL_LABELS;
    rerun(smartbearOrders, setForm, FORM_ID, input);
  });

  it('setForm - Global Setter', () => {
    rerun(smartbearOrders, setSmartbearcaps);
  });

  it('setForm - Global Setter and single setter', () => {
    rerun(smartbearOrders, setSmartbearcapsLwrAddress);
  });

  it('setForm - Global Setter and single setter and id finder', () => {
    rerun(smartbearOrders, setWithFindByIdOnlyAndLwrStreetName);
  });

  it('setForm - Global Setter and single setter and id finder and specialised finder', () => {
    rerun(smartbearOrders, setWithFindByIdOnlyAndLwrStreetNameAndSpcialisedFinder);
  });

});

describe('getForm', () => {
  it('getForm - orders', () => {
    rerun(smartbearOrders, getForm, FORM_ID);
  });
})

describe('getFormDump test', () => {

  it('getForm demo', () => {
    let params = {
      product: 'FamilyAlbum',
		  pricePerUnit: 100,
		  discount: 30,
		  customerName: 'Janice Peterson',
    };

    rerun(smartbearOrders, setThisForm, FORM_ID, params);
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
                     .defaults(FORM_INPUT_MOSTLY_IDS)
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
