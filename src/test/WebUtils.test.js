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
import {toTempString} from '../lib/FileUtils';
import { cast, debug, waitRetry, yamlToObj } from '../lib/SysUtils';
import { unitTestingTargets, ZZForTest  } from '../lib/WebUtils';



describe.only('formatFormInfo', () => {
  const formatFormInfo = ZZForTest.formatFormInfo;

  const infoYaml = `
result:
  ctl00_MainContent_fmwOrder_ddlProduct: params.product
  ctl00_MainContent_fmwOrder_txtQuantity: params.quantity
  ctl00_MainContent_fmwOrder_txtUnitPrice: params.pricePerUnit
  ctl00_MainContent_fmwOrder_txtDiscount: params.discount
  ctl00_MainContent_fmwOrder_txtTotal: params.total
  ctl00_MainContent_fmwOrder_txtName: params.customerName
  ctl00_MainContent_fmwOrder_TextBox2: params.street
  ctl00_MainContent_fmwOrder_TextBox3: params.city
  ctl00_MainContent_fmwOrder_TextBox4: params.state
  ctl00_MainContent_fmwOrder_TextBox5: params.zip
  ctl00$MainContent$fmwOrder$cardList: params.ctl00MaincontentFmworderCardlist
  ctl00_MainContent_fmwOrder_TextBox6: params.cardNr
  ctl00_MainContent_fmwOrder_TextBox1: params.expireDateMmYy
data:
  product: FamilyAlbum
  quantity: 1
  pricePerUnit: 100
  discount: 10
  total: 1000
  customerName: name
  street: street
  city: city
  state: state
  zip: postcode
  ctl00MaincontentFmworderCardlist: Visa
  cardNr: cardNumber
  expireDateMmYy: exp
dataType:
  product: Product
  quantity: number
  pricePerUnit: number
  discount: number
  total: number
  customerName: string
  street: string
  city: string
  state: string
  zip: string
  ctl00MaincontentFmworderCardlist: Ctl00MaincontentFmworderCardlist
  cardNr: string
  expireDateMmYy: string
sumTypes:
  Product:
    - MyMoney
    - FamilyAlbum
    - ScreenSaver
  Ctl00MaincontentFmworderCardlist:
    - Visa
    - MasterCard
    - American Express
  `

  // this is really just an endpoint
  it('formats as expected', () => {
    let info = yamlToObj(infoYaml),
        rslt = formatFormInfo(info);

    toTempString(rslt);
    chkHasText(rslt, 'FormInput');
  });

});

describe('toPropString', () => {

  const toPropString = ZZForTest.toPropString;
  it('allAlpha', () => {
    chkEq('allalphachars', toPropString('AllAlphaChars'))
  });

  it('allNums', () => {
    chkEq('123456', toPropString('123456'))
  });


  it('alpha space and stuff', () => {
    chkEq('alphaCharsEtAl12a33', toPropString('alpha chars$#@et_al    !! 12a33'))
  });

  it('noalpha', () => {
    chkEq('???????', toPropString('$%^%&^^%'))
  });


});


describe('sliceSearchModifier', () => {

  const sliceSearchModifier = unitTestingTargets.sliceSearchModifier;

  it('*', () => {
    chkEq(['*', 'str'], sliceSearchModifier('str'))
  });

  it('*/empty', () => {
    chkEq(['*', ''], sliceSearchModifier(''))
  });

  it('wrong index *', () => {
    chkEq(['*', 'at~r'], sliceSearchModifier('at~r'))
  });

  it('not a modifier', () => {
    chkEq(['*', 'at~z'], sliceSearchModifier('at~z'))
  });

  it('above', () => {
    chkEq(['A', 'dddd'], sliceSearchModifier('a~dddd'))
  });

  it('above caps', () => {
    chkEq(['A', 'dddd'], sliceSearchModifier('A~dddd'))
  });

  it('below', () => {
    chkEq(['B', 'fdfdud'], sliceSearchModifier('b~fdfdud'))
  });

  it('below caps', () => {
    chkEq(['B', 'uyser'], sliceSearchModifier('B~uyser'))
  });

  it('left', () => {
    chkEq(['L', 'Leerr'], sliceSearchModifier('l~Leerr'))
  });

  it('left caps', () => {
    chkEq(['L', 'tfusr'], sliceSearchModifier('L~tfusr'))
  });

  it('right', () => {
    chkEq(['R', 'you'], sliceSearchModifier('r~you'))
  });

  it('right caps', () => {
    chkEq(['R', 'truiv'], sliceSearchModifier('R~truiv'))
  });


});
