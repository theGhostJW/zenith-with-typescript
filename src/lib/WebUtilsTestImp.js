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
          read, setRadioGroup
        } from '../lib/WebUtils';
export {
  links,
  url,
  clickLink,
  radioItemVals,
  setRadioGroup
} from '../lib/WebUtils';

export const TEST_LOG_IN = 'http://secure.smartbearsoftware.com/samples/TestComplete12/WebOrders/Login.aspx';
export const CARD_LIST_ID = '#ctl00_MainContent_fmwOrder_cardList';

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
