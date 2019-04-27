// @flow

import * as _ from 'lodash';
import { debug, fail, waitRetry, def, delay } from '../src/lib/SysUtils';
import { log, expectDefect, endDefect, logException, logError } from '../src/lib/Logging';
import { toTempString, fileToString } from '../src/lib/FileUtils';
import { show, sameText  } from '../src/lib/StringUtils';
import child_process from 'child_process'
import type { RunConfig, TestCase, TestConfig, Validators, Country, Depth } from '../testCases/ProjectConfig';
import { register } from '../testCases/ProjectConfig';
import { check, checkFalse, checkEqual} from '../src/lib/CheckUtils';
import * as wd from 'webdriverio';
import moment from 'moment';


let config: TestConfig = {
  when: 'I go to catch',
  then: 'I get caught',
  owner: 'JW',
  enabled: true,
  countries: ['New Zealand', 'Australia']
}

export type Item = {|
  id: number,
  when: string,
  then: string,
  userName: string,
  invalidPassword: ?string,
  expectedErrors: string[],
  validators: Validators<DState>
|}

export type ApState = {|
  url: string,
  pageTitle: string,
  userName: string,
  invalidPassword: ?string,
  logInModelVisible: boolean,
  errors: string[]
|}

type DState = {|
  userNameValid: boolean,
  passwordValid: boolean,
  loggedIn: boolean,
  expectedErrors: string[],
  errors: string[],
|}

const validUserName = "theghostjw@gmail.com.au";

function prepState(apState: ApState, item: Item, runConfig: RunConfig): DState {
  return {
    userNameValid: sameText(validUserName, apState.userName),
    passwordValid: apState.invalidPassword == null,
    loggedIn: apState.logInModelVisible,
    expectedErrors: item.expectedErrors,
    errors: apState.errors,
  }
}

function check_logged_in(dState: DState, valTime: moment$Moment) {
  check(dState.loggedIn);
}

function check_not_logged_in(dState: DState, valTime: moment$Moment) {
  checkFalse(dState.loggedIn);
}

function check_errors(dState: DState, valTime: moment$Moment) {
  checkEqual(dState.expectedErrors, dState.errors, "errors should equal");
}


const catchUrl : string = "https://www.catch.com.au";
const validPassword = () => fileToString("C:\\Demo\\creds.txt");

function logIn(userName: string, password: string){
  browser.url(catchUrl);
  $('a[href*="login"]').click();
  populateLoginForm(userName, password);
}


//https://www.wired.com/2014/12/google-one-click-recaptcha/
function populateLoginForm(userName: string, password: string){
  $('#login_email').setValue(userName);
  $('#login_password').setValue(password);
  browser.debug();
  // if ($('iframe').isExisting()){
  //   $('iframe').click(40, 40);
  // }
  $('#button-login').click();
}

function isLoggedIn() : boolean {
  return $('a[href="/my-account/details"').isExisting()
}

//todo screenshot video
export function interactor(item: Item, runConfig: RunConfig): ApState {
  const userName = item.userName,
        password = def(item.invalidPassword, validPassword());

  logIn(userName, password);

  return {
    url: browser.getUrl(),
    pageTitle: browser.getTitle(),
    userName: userName,
    invalidPassword: password === validPassword() ? null : password,
    logInModelVisible: isLoggedIn(),
    errors: []
 }
}

function summarise(runConfig: RunConfig, item: Item, apState: ApState, dState: DState): string | null {
  return null;
}

function  testItems(runConfig: RunConfig): Item[] {
  return [
    {
      id: 100,
      when: "login creds are valid",
      then: 'login is successful',
      userName: validUserName,
      invalidPassword: null,
      expectedErrors: [],
      validators: [check_logged_in, check_errors]
    }
  ];
}

export const testCase: TestCase<Item, ApState, DState>  = {
  testConfig: config,
  interactor: interactor,
  prepState: prepState,
  summarise: summarise,
  testItems: testItems
}

register(testCase)
