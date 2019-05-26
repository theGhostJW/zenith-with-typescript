import { log } from './Logging';
import {show} from './StringUtils';

import {debug, waitRetry} from './SysUtils';
import {
          browserEx, click, clickLink, elementType,
          elementIs, getForm, idAttribute, linkByText,
          links,  mapCellsSimple, parent, predicateToFinder, radioItemVals,
          read, rerun, set, setChecked, getUrl,
          setForm, setInput, setRadioGroup, setSelect,
          url, withFinder, withPredicate,
          withSetter, zzzTestFunc, S, SS,
          Element, SelectorOrElement, ReadResult, SetterValue
        } from './WebUtils';

import {mapCells, cell} from './WebUtils';

const _ = require('lodash');


export {    
            links,
            radioItemVals,
            setRadioGroup,
            setSelect,
            setForm,
            getForm,
            mapCellsSimple,
            cell,
            readCell,
            readTable,
            setTable
          } from './WebUtils';


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

export function clickLinkReturnUrl(lnk: string): string {
  clickLink(lnk);
  return getUrl();
}

export function parentHtml(selector: SelectorOrElement): string {
  let p = parent(selector)
  return p != null ? p.getHTML() : "PARENT EMPTY";
}

export function parentTableHtml(selector: SelectorOrElement): string {
  let p = parent(selector, e => e.getTagName() === "table");
  return p != null ? p.getHTML() : "PARENT EMPTY";
}

export function cellVal(tableSelector: SelectorOrElement, lookUpVals: {[k:string]: ReadResult}, valueCol: string): ReadResult {
  let cl = cell(tableSelector, lookUpVals, valueCol);
  return cl == undefined ? null : read(cl);
}

function readLogCell(cell: Element, rowIndex: number, colIndex: number, row: Element) {
 let str = read(cell, false),
     rslt = `row: ${rowIndex} col: ${colIndex} ~ ${show(str)}`;
 log(rslt);
 return rslt;
}

export function mapCellsSimpleLog<T>(selector: string) : string [][] {
  return mapCellsSimple(selector, readLogCell, false);
}

export function mapCellsSimpleLogNoInvisibles<T>(selector: string): string [][] {
  return mapCellsSimple(selector, readLogCell);
}

function readHeadedLogCell(cell: Element, colTitle: string, rowIndex: number, colIndex: number, row: Element) {
 let str = read(cell, false),
     rslt = `row: ${rowIndex} col: ${colIndex} title: ${colTitle} ~ ${show(str)}`;
 log(rslt);
 return rslt;
}

export function mapCellsLogNoInvisibles(selector: string): string [][] {
  return mapCells(selector, readHeadedLogCell);
}

export function mapCellsLog(selector: string): string [][] {
  return mapCells(selector, readHeadedLogCell, false);
}

export const FORM_INPUT_RADIO_NAME = _.chain(FORM_INPUT_MOSTLY_IDS)
                                      .clone()
                                      .omit('ctl00_MainContent_fmwOrder_cardList')
                                      .extend({ctl00$MainContent$fmwOrder$cardList: 'American Express'})
                                      .value();

export const FORM_ID = '#ctl00_MainContent_fmwOrder'

function setWithCaps(el: SelectorOrElement, val: SetterValue){
  val = elementIs('input')(el)  && _.isString(val) ? (<string>val).toUpperCase() : val;
  set(el, val);
}

function setWithLwr(el: SelectorOrElement, val: SetterValue){
  val = elementIs('input')(el)  && _.isString(val) ? (<string>val).toLowerCase() : val;
  set(el, val);
}

export function setSmartbearcaps(){
  setForm(FORM_ID, FORM_INPUT_FOR_LABELS, setWithCaps);
}

export function setSmartbearcapsLwrAddress(){
  let vals = _.clone(FORM_INPUT_FOR_LABELS);
  vals.ctl00_MainContent_fmwOrder_TextBox2 = withSetter('22 Vernon Street', setWithLwr);
  setForm(FORM_ID, vals, setWithCaps);
}

function findById(key: string, editable: Element[]) : Element | undefined {
  return editable.find((e: Element) => idAttribute(e) == key);
}

export function setWithFindByIdOnlyAndLwrStreetName(){
  let vals = _.clone(FORM_INPUT_ALL_IDS);
  vals.ctl00_MainContent_fmwOrder_TextBox2 = withSetter('22 Vernon Street', setWithLwr);
  setForm(FORM_ID, vals, setWithCaps, findById);
}

export function setWithFindByIdOnlyAndLwrStreetNameAndSpcialisedFinder(){
  let vals = _.chain(FORM_INPUT_ALL_IDS)
              .clone()
              .omit('ctl00_MainContent_fmwOrder_txtName')
              .value();
  (<any>vals).ctl00$MainContent$fmwOrder$txtName = withPredicate(
                                                    withSetter('JANICE PETERSON', setWithLwr),
                                                    (k, e) => e.getAttribute('name') == k
                                                  );
  setForm(FORM_ID, vals, setWithCaps, findById);
}

export function basicSet() {
  _.each(FORM_INPUT_MOSTLY_IDS, (v: any, k: any) => set('#' + k, v));
 return _.mapValues(FORM_INPUT_MOSTLY_IDS, (v: any, k: any) => read('#' + k));
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

  return [r0, r1, r2];
}

export function checkReturnChecked() {
  let selector = '#ctl00_MainContent_orderGrid_ctl02_OrderSelector';

  setChecked(selector, true);
  let r0 = read(selector);

  setChecked(selector, false);
  let r1 = read(selector);

  return [r0, r1];
}


export function clickOrderLink(): string {
  clickLink(s => s === 'Order');
  return getUrl();
}

export function smartBearLogIn() {
  url(TEST_LOG_IN);
  set('#ctl00_MainContent_username', 'Tester');
  set('#ctl00_MainContent_password', 'test');
  click('#ctl00_MainContent_login_button');
  return getUrl();
}

export function smartBearLogInVoid() {
  smartBearLogIn();
}

export function smartbearOrders() {
  smartBearLogIn();
  clickOrderLink();
}

export function checkUncheck(): any {
  setChecked('#ctl00_MainContent_fmwOrder_cardList_0', true);
  setChecked('#ctl00_MainContent_fmwOrder_cardList_1', true);
  setChecked('#ctl00_MainContent_fmwOrder_cardList_2', true);
  return read('#ctl00_MainContent_fmwOrder_cardList_2');
}

export function invalidUncheckCheckBox() {
  setChecked('#ctl00_MainContent_fmwOrder_cardList_0', false);
}

export function linkByTextText() {
  return linkByText('*order*').getText();
}


/******************************************************************************
************************** Sample From getForm ********************************
*******************************************************************************/

// Field Subtypes
export type Product =
	'MyMoney'
	| 'FamilyAlbum'
	| 'ScreenSaver';

export type Ctl00MaincontentFmworderCardlist =
	'Visa'
	| 'MasterCard'
	| 'American Express';

// Complete Form Input Type
export interface CompleteFormInput
	{
		product: Product,
		quantity: string,
		pricePerUnit: number,
		discount: number,
		customerName: string,
		street: string,
		city: string,
		state: string,
		zip: string,
		ctl00MaincontentFmworderCardlist: Ctl00MaincontentFmworderCardlist,
		cardNr: string,
		expireDateMmYy: string
	}

// Default Data
export const formDefaults = () => {
 return {
		product: 'FamilyAlbum',
		quantity: '\uE00395',
		pricePerUnit: 100,
		discount: 10,
		customerName: 'name',
		street: 'street',
		city: 'city',
		state: 'state',
		zip: '3103',
		ctl00MaincontentFmworderCardlist: 'Visa',
		cardNr: '0124587',
		expireDateMmYy: '12/30'
	}
}

export function setThisForm(parentElementorSelector: SelectorOrElement, params: CompleteFormInput) {
  params = _.defaults(params, formDefaults());
  let formParams =
	{
		ctl00_MainContent_fmwOrder_ddlProduct: params.product,
		ctl00_MainContent_fmwOrder_txtQuantity: params.quantity,
		ctl00_MainContent_fmwOrder_txtUnitPrice: params.pricePerUnit,
		ctl00_MainContent_fmwOrder_txtDiscount: params.discount,
		ctl00_MainContent_fmwOrder_txtName: params.customerName,
		ctl00_MainContent_fmwOrder_TextBox2: params.street,
		ctl00_MainContent_fmwOrder_TextBox3: params.city,
		ctl00_MainContent_fmwOrder_TextBox4: params.state,
		ctl00_MainContent_fmwOrder_TextBox5: params.zip,
		ctl00$MainContent$fmwOrder$cardList: params.ctl00MaincontentFmworderCardlist,
		ctl00_MainContent_fmwOrder_TextBox6: params.cardNr,
		ctl00_MainContent_fmwOrder_TextBox1: params.expireDateMmYy
	};
  setForm(parentElementorSelector, formParams);
}
