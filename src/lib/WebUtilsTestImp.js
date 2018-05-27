// @flow

import { debug, waitRetry, cast } from '../lib/SysUtils';
import { toTemp, toTempString } from '../lib/FileUtils';
import { show } from '../lib/StringUtils';
import { log } from '../lib/Logging';
import * as _ from 'lodash';
import {
          browserEx, zzzTestFunc, rerun,
          set, click, links, url,
          linkByText,  clickLink, setChecked, S, SS,
          read, setRadioGroup, setSelect, setInput,
          setForm, parent, elementIs, withSetter,
          radioItemVals, idAttribute, withFinder,
          predicateToFinder
        } from '../lib/WebUtils';

import type { Element } from '../lib/WebUtils';


export const TEST_LOG_IN = 'http://secure.smartbearsoftware.com/samples/TestComplete12/WebOrders/Login.aspx';
export const CARD_LIST_ID = '#ctl00_MainContent_fmwOrder_cardList';

export const PRODUCT_SELECTOR = '#ctl00_MainContent_fmwOrder_ddlProduct';
export const AVAILABLE_PRODUCTS = ["MyMoney", "FamilyAlbum", "ScreenSaver"];
const CUSTOMER_NAME_ID = '#ctl00_MainContent_fmwOrder_txtName';
export const FORM_INPUT_MOSTLY_IDS = {
    ctl00_MainContent_fmwOrder_ddlProduct: 'ScreenSaver',
    ctl00_MainContent_fmwOrder_txtQuantity: '\uE00395',
    ctl00_MainContent_fmwOrder_txtUnitPrice: 10,
    ctl00_MainContent_fmwOrder_txtDiscount: 7,
    ctl00_MainContent_fmwOrder_txtName: 'Janice Peterson',
    ctl00_MainContent_fmwOrder_TextBox2: '22 Vernon St',
    ctl00_MainContent_fmwOrder_TextBox3: 'Croydon',
    ctl00_MainContent_fmwOrder_TextBox4: 'Victoria',
    ctl00_MainContent_fmwOrder_TextBox5: 3136,
    //Id of container not target
    ctl00_MainContent_fmwOrder_cardList: 'American Express',
    ctl00_MainContent_fmwOrder_TextBox6: '12345678',
    ctl00_MainContent_fmwOrder_TextBox1: '12/24'
  }

  export const FORM_INPUT_ALL_IDS = {
      ctl00_MainContent_fmwOrder_ddlProduct: 'ScreenSaver',
      ctl00_MainContent_fmwOrder_txtQuantity: '\uE00395',
      ctl00_MainContent_fmwOrder_txtUnitPrice: 10,
      ctl00_MainContent_fmwOrder_txtDiscount: 7,
      ctl00_MainContent_fmwOrder_txtName: 'Janice Peterson',
      ctl00_MainContent_fmwOrder_TextBox2: '22 Vernon St',
      ctl00_MainContent_fmwOrder_TextBox3: 'Croydon',
      ctl00_MainContent_fmwOrder_TextBox4: 'Victoria',
      ctl00_MainContent_fmwOrder_TextBox5: 3136,
      //id of container radio button
      ctl00_MainContent_fmwOrder_cardList_2: true,
      ctl00_MainContent_fmwOrder_TextBox6: '12345678',
      ctl00_MainContent_fmwOrder_TextBox1: '12/24'
    }

  export const FORM_INPUT_FOR_LABELS = {
      ctl00_MainContent_fmwOrder_ddlProduct: 'ScreenSaver',
      ctl00_MainContent_fmwOrder_txtQuantity: '\uE00395',
      ctl00_MainContent_fmwOrder_txtUnitPrice: 10,
      ctl00_MainContent_fmwOrder_txtDiscount: 7,
      // for label
      'Customer name:*': 'Janice Peterson',
      ctl00_MainContent_fmwOrder_TextBox2: '22 Vernon St',
      // for label fuzzy
      'City*': 'Croydon',
      ctl00_MainContent_fmwOrder_TextBox4: 'Victoria',
      ctl00_MainContent_fmwOrder_TextBox5: 3136,
      // radio fuzzy
      '*cardList': 'American Express',
      ctl00_MainContent_fmwOrder_TextBox6: '12345678',
      ctl00_MainContent_fmwOrder_TextBox1: '12/24'
    }

   export const FORM_INPUT_PROXIMAL_LABELS = {
         'Product*': 'ScreenSaver',
         '*tity*': '\uE00395',
         '*per unit*': 10,
         'Discount:': 7,
         // for label
         'Customer name:*': 'Janice Peterson',
         'Street*': '22 Vernon St',
         // for label fuzzy
         'City*': 'Croydon',
         'State*': 'Victoria',
         'Zip*': 3136,
        // radio button
        'R~American Express': true,
         'Card Nr*': '12345678',
        'Expire*': '12/24'
      }

export const FORM_INPUT_RADIO_NAME = _.chain(FORM_INPUT_MOSTLY_IDS)
                                      .clone()
                                      .omit('ctl00_MainContent_fmwOrder_cardList')
                                      .extend({ctl00$MainContent$fmwOrder$cardList: 'American Express'})
                                      .value();

export const FORM_ID = '#ctl00_MainContent_fmwOrder'

function setWithCaps(el, val){
  val = elementIs('input')(el)  && _.isString(val) ? cast(val).toUpperCase() : val;
  set(el, val);
}

function setWithLwr(el, val){
  val = elementIs('input')(el)  && _.isString(val) ? cast(val).toLowerCase() : val;
  set(el, val);
}

export function setSmartbearcaps(){
  setForm(FORM_ID, FORM_INPUT_FOR_LABELS, setWithCaps);
}

export function setSmartbearcapsLwrAddress(){
  let vals = _.clone(FORM_INPUT_FOR_LABELS);
  vals.ctl00_MainContent_fmwOrder_TextBox2 = cast(withSetter('22 Vernon Street', setWithLwr));
  setForm(FORM_ID, vals, setWithCaps);
}

function findById(key: string, editable: Array<Element>, nonEditable: ?Array<Element>) : ?Element {
  return editable.find(e => idAttribute(e) == key);
}

export function setWithFindByIdOnlyAndLwrStreetName(){
  // #ctl00_MainContent_fmwOrder_cardList_2
  let vals = _.clone(FORM_INPUT_ALL_IDS);
  vals.ctl00_MainContent_fmwOrder_TextBox2 = cast(withSetter('22 Vernon Street', setWithLwr));
  setForm(FORM_ID, vals, setWithCaps, findById);
}

export function setWithFindByIdOnlyAndLwrStreetNameAndSpcialisedFinder(){
  let vals = _.clone(FORM_INPUT_ALL_IDS);
  cast(vals).ctl00$MainContent$fmwOrder$txtName =  cast(
                                                    withFinder(
                                                      withSetter('JANICE PETERSON', setWithLwr),
                                                      predicateToFinder((k, e) => e.getAttribute('name') == k)
                                                    )
                                                  );
  setForm(FORM_ID, vals, setWithCaps, findById);
}

export function recursiveParent() {

  function topParent(el) {
    let result = parent(el);

    if (result == null){
      return el;
    }
    else {
      return topParent(result)
    }
  }

  let rslt = topParent('#ctl00_MainContent_fmwOrder_cardList_0');
  // Only sort of working can't gettext on top parent
  return rslt;
}

export function basicSet() {
  _.each(FORM_INPUT_MOSTLY_IDS, (v, k) => set('#' + k, v));
 return _.mapValues(FORM_INPUT_MOSTLY_IDS, (v, k) => read('#' + k));
}

export function setReadInput() {
  setInput(CUSTOMER_NAME_ID, 'Janice Peterson');
  return read(CUSTOMER_NAME_ID);
}

export function setReadProduct() {
  let result = [];
  setSelect(PRODUCT_SELECTOR, 'ScreenSaver');

  result.push(read(PRODUCT_SELECTOR));

  setSelect(PRODUCT_SELECTOR, 'FamilyAlbum');
  result.push(read(PRODUCT_SELECTOR));

  setSelect(PRODUCT_SELECTOR, 'MyMoney');
  result.push(read(PRODUCT_SELECTOR));
  return result;
}

export function readSetRadioGroup() {
  setRadioGroup(CARD_LIST_ID, 'Visa');
  let r0 = read(CARD_LIST_ID);

  setRadioGroup(CARD_LIST_ID, 'MasterCard');
  let r1 = read(CARD_LIST_ID);

  setRadioGroup(CARD_LIST_ID, 'American Express');
  let r2 = read(CARD_LIST_ID);

  return [r0, r1, r2]
}

export function checkReturnChecked() {
  let selector = '#ctl00_MainContent_orderGrid_ctl02_OrderSelector';

  setChecked(selector, true);
  let r0 = read(selector);

  setChecked(selector, false);
  let r1 = read(selector);

  return [r0, r1];
}


export function clickOrderLink() {
  clickLink(s => s === 'Order')
}

export function smartBearLogIn() {
  url(TEST_LOG_IN);
  set('#ctl00_MainContent_username', 'Tester');
  set('#ctl00_MainContent_password', 'test');
  click('#ctl00_MainContent_login_button');
}

export function smartbearOrders() {
  smartBearLogIn();
  clickOrderLink();
}

export function checkUncheck() {
  setChecked('#ctl00_MainContent_fmwOrder_cardList_0', true);
  setChecked('#ctl00_MainContent_fmwOrder_cardList_1', true);
  setChecked('#ctl00_MainContent_fmwOrder_cardList_2', true);
}

export function invalidUncheckCheckBox() {
  setChecked('#ctl00_MainContent_fmwOrder_cardList_0', false);
}

export function linkByTextText() {
  return linkByText('*order*').getText();
}
