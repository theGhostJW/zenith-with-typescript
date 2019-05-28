import { def } from '../src/lib/SysUtils';
import { fileToString } from '../src/lib/FileUtils';
import { sameText  } from '../src/lib/StringUtils';
import { register, RunConfig, TestCase, TestConfig, Validators, AllCountries } from './ProjectConfig';
import { check, checkFalse, checkEqual} from '../src/lib/CheckUtils';
import * as wd from 'webdriverio';

let config: TestConfig = {
  when: 'a log in is performed',
  then: 'access is granted or denied as expected',
  owner: 'JW',
  enabled: true,
  countries: AllCountries
}

export type Item = {
  id: number,
  when: string,
  then: string,
  userName: string,
  invalidPassword?: string | null,
  expectedErrors: string[],
  validators: Validators<DState>
}

export type ApState = {
  url: string,
  pageTitle: string,
  userName: string,
  logInModelVisible: boolean,
  errors: string[]
}

type DState = {
  userNameValid: boolean,
  passwordValid: boolean,
  loggedIn: boolean,
  expectedErrors: string[],
  errors: string[],
}

const validUserName = "theghostjw@gmail.com.au";

function prepState(a: ApState, i: Item, rc: RunConfig): DState {
  return {
    userNameValid: sameText(validUserName, a.userName),
    passwordValid: i.invalidPassword == null,
    loggedIn: a.logInModelVisible,
    expectedErrors: i.expectedErrors,
    errors: a.errors,
  }
}

function check_logged_in(d: DState, valTime: moment$Moment) {
  check(d.loggedIn);
}

function check_not_logged_in(d: DState, valTime: moment$Moment) {
  checkFalse(d.loggedIn);
}

function check_errors(d: DState, valTime: moment$Moment) {
  checkEqual(d.expectedErrors, d.errors, "errors should equal");
}

const catchUrl : string = "https://www.catch.com.au";
const validPassword = () => fileToString("C:\\Demo\\creds.txt");

function logIn(userName: string, password: string){
  browser.url(catchUrl);
  // $('a[href*="login"]').click();
  populateLoginForm(userName, password);
  browser.keys(["Tab", "Enter"]);
}

//https://www.wired.com/2014/12/google-one-click-recaptcha/
function populateLoginForm(userName: string, password: string){
  // $('#login_email').setValue(userName);
  // $('#login_password').setValue(password);
}

function isLoggedIn() : boolean {
  return true; //$('a[href="/my-account/details"').isExisting()
}

//todo screenshot video
export function interactor(item: Item, runConfig: RunConfig): ApState {
  const userName = item.userName,
        password = def(item.invalidPassword, validPassword());

  logIn(userName, password);

  return {
    url: <any>browser.getUrl(),
    pageTitle: <any>browser.getTitle(),
    userName: userName,
    logInModelVisible: isLoggedIn(),
    errors: []
 }
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
  testItems: testItems
}

register(testCase)
