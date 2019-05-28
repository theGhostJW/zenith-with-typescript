import {
  chk,
  chkEq,
  chkEqJson,
  chkExceptionText,
  chkFalse,
  chkHasText,
  chkWithMessage,
} from '../lib/AssertionUtils';
import { show, startsWith } from '../lib/StringUtils';
import { debug, debugStk, fail, waitRetry } from '../lib/SysUtils';
import { read, rerun, set, setForm } from '../lib/WebUtils';
import { basicSet,  cellVal, checkReturnChecked, checkUncheck, clickLinkReturnUrl, clickOrderLink,
        /* setForm,*/ getForm,  invalidUncheckCheckBox, linkByTextText,  links, mapCellsLog, mapCellsLogNoInvisibles,
        mapCellsSimple, mapCellsSimpleLog, mapCellsSimpleLogNoInvisibles, parentHtml, radioItemVals,
        readCell,readSetRadioGroup, parentTableHtml,  setRadioGroup,  setReadInput,
        setReadProduct,  setSelect, setSmartbearcaps, setSmartbearcapsLwrAddress, setThisForm,
        setWithFindByIdOnlyAndLwrStreetName, setWithFindByIdOnlyAndLwrStreetNameAndSpcialisedFinder, smartBearLogIn,  smartbearOrders,
        readTable, setTable, AVAILABLE_PRODUCTS, CARD_LIST_ID,
        FORM_ID, FORM_INPUT_FOR_LABELS,
        FORM_INPUT_MOSTLY_IDS,
        FORM_INPUT_ALL_IDS,
        FORM_INPUT_PROXIMAL_LABELS, smartBearLogInVoid,
        FORM_INPUT_RADIO_NAME,
        PRODUCT_SELECTOR,
        TEST_LOG_IN
        } from '../lib/WebUtilsTestImp';

const _ = require('lodash');



describe('Table Utils', () => {

  describe('mapCellsSimple', () => {

    it('Include Invisible', () => {
      let rslt = rerun(smartBearLogInVoid, <any>mapCellsSimpleLog, '#ctl00_MainContent_orderGrid');
      chkEq(9, (<any>rslt).length);
    });

    it('Exclude Invisible', () => {
      let rslt = rerun(smartBearLogInVoid, <any>mapCellsSimpleLogNoInvisibles, '#ctl00_MainContent_orderGrid');
      chkEq(9, (<any>rslt).length);
    });

  });

  describe('mapCells', () => {

    it('mapCells Include Invisible', () => {
      let rslt = rerun(smartBearLogInVoid, mapCellsLog, '#ctl00_MainContent_orderGrid');
      chkEq(8, (<any>rslt).length);
    });

    it('eachCellSimple Exclude Invisible', () => {
      let rslt = rerun(smartBearLogInVoid, mapCellsLogNoInvisibles, '#ctl00_MainContent_orderGrid');
      chkEq(8, (<any>rslt).length);
    });

  });

  describe('cell', () => {

    it('first record', () => {
      let params = {
                     Product: 'ScreenSaver',
                      Zip: 748
                    },
      rslt = rerun(smartBearLogInVoid, <any>cellVal, '#ctl00_MainContent_orderGrid', params, 'Name');
      chkEq('Paul Brown', rslt);
    });

    it('other record', () => {
      let params = {
                     Product: 'MyMoney',
                     Card: 'MasterCard'
                    },
      rslt = rerun(smartBearLogInVoid, <any>cellVal, '#ctl00_MainContent_orderGrid', params, 'Name');
      chkEq('Susan McLaren', rslt);
    });

    it('bad name', () => {
      let params = {
                     Product: 'MyMoney',
                     NonExistentCol: 'MasterCard'
                   };

      chkExceptionText(
                        () => rerun(smartBearLogInVoid, <any>cellVal, '#ctl00_MainContent_orderGrid', params, 'Name'),
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
          rslt = rerun(smartBearLogInVoid, readCell, '#ctl00_MainContent_orderGrid', params, 'Name');
      chkEq('Clare Jefferson', rslt);
    });

  });

  describe('readTable', () => {

    it('all cols', () => {
      let rslt = rerun(smartBearLogInVoid, readTable, '#ctl00_MainContent_orderGrid');
      chkEq(8, rslt.length);
      chkEq(13, _.keys(rslt[0]).length);
    });

    it('some cols', () => {
      let rslt = rerun(smartBearLogInVoid, readTable, '#ctl00_MainContent_orderGrid', ['Name', 'Product', 'Zip']);
      chkEq(8, rslt.length);
      chkEq(3, _.keys(rslt[0]).length);
    });

  });

  // todo - add checks
  describe('setTable', () => {

    it('simple', () => {
      rerun(smartBearLogInVoid, setTable, '#ctl00_MainContent_orderGrid',
                                                ['~Name'     , 'idx0' ],
                                                ['Steve Johns', true],
                                              );
    });

    it('multiple', () => {
      rerun(smartBearLogInVoid, setTable, '#ctl00_MainContent_orderGrid',
                                                ['~Name'     , 'idx0' ],
                                                ['Steve Johns', true],
                                                ['Mark Smith',  true],
                                                ['Clare Jefferson', true]
                                              );
    });

  });

});

// todo - add checks
describe('setForm', () => {

  it('setForm ~ ids', () => {
    rerun(smartbearOrders, setForm, FORM_ID, FORM_INPUT_ALL_IDS);
  });

  // Radio set by group name
  it('setForm ~ radio group by name', () => {
    let input = FORM_INPUT_RADIO_NAME;
    rerun(smartbearOrders, setForm, FORM_ID, input);
  });


  // FRAMEWORK DEMO
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

describe('another setform test', () => {

  it('setform demo', () => {
    let params = {
      product: 'FamilyAlbum',
		  pricePerUnit: 100,
		  discount: 30,
		  customerName: 'Janice Peterson',
    };

    rerun(smartbearOrders, setThisForm, FORM_ID, params);
  });

});

// - is this an impl thing
describe('parent', () => {
  it('simple', () => {
    let result = rerun(smartbearOrders, parentHtml, '#ctl00_MainContent_fmwOrder_cardList_0');
    chk(startsWith(result, '<td><input id="ctl00_MainContent_fmwOrder_cardList_0"'));
  });

  it('with predicate', () => {
    let result = rerun(smartbearOrders, parentTableHtml, '#ctl00_MainContent_fmwOrder_cardList_0');
    chk(startsWith(result, '<table id="ctl00_MainContent_fmwOrder_cardList"'));
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
    let allProducts = rerun(smartbearOrders, setReadProduct);
    chkEq(AVAILABLE_PRODUCTS.reverse(), allProducts);
  });

  it('invalid select', () => {
    chkExceptionText(
       () => rerun(smartbearOrders, setSelect, '#ctl00_MainContent_fmwOrder_ddlProduct', 'Lexus'), 
      'could not be located either by visible text or by value'
    )
  });

});

describe('radioGroup', () => {

  const AVAILABLE_CARDS = ['Visa', 'MasterCard', 'American Express'];
  it('radioItemVals', () => {
      let groupReads = rerun(smartbearOrders, radioItemVals, CARD_LIST_ID);
      chkEq(AVAILABLE_CARDS, groupReads);
  });

  it('setRadioGroup / readRadioGroup', () => {
      let groupReads = rerun(smartbearOrders, readSetRadioGroup);
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
    let url = rerun(TEST_LOG_IN, smartBearLogIn);
    chkEq('http://secure.smartbearsoftware.com/samples/testcomplete12/weborders/', url);
  });

});

describe('links', () => {

  it('getAll', () => {
    chk(rerun(smartBearLogInVoid, links).length > 4);
  });

});


describe('linkByText', () => {

  it('simple exists', () => {
    chkEq('View all orders', rerun(smartBearLogInVoid, linkByTextText));
  });

});

describe('clickLink', () => {

  it('simple link', () => {
    let url = rerun(smartBearLogInVoid, clickLinkReturnUrl, '*products*');
    chkEq('http://secure.smartbearsoftware.com/samples/testcomplete12/weborders/Products.aspx', url);
  });

  it('HOF', () => {
    let url = rerun(smartBearLogInVoid, clickOrderLink);
    chkEq('http://secure.smartbearsoftware.com/samples/testcomplete12/weborders/Process.aspx', url);
  });

});

describe('setChecked', () => {

  it('check uncheck radio', () => {
      let checkedUnchecked = rerun(smartBearLogInVoid, checkReturnChecked);
      chkEq([true, false], checkedUnchecked);
  });

  it('setChecked - radio buttons', () => {
    const americanExpressIsChecked = rerun(smartbearOrders, checkUncheck);
    chk(americanExpressIsChecked);
  });

  it('setUnchecked Invalid Radio Button', () => {
    chkExceptionText(
       () => rerun(smartbearOrders, invalidUncheckCheckBox),
      'Cannot uncheck radio buttons with setChecked'
    )
  });

});