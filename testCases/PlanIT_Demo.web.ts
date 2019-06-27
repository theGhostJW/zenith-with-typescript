import * as _ from 'lodash';
import { register, RunConfig, TestCase, TestConfig, Validators, AllCountries  } from './ProjectConfig';
import { baseData, DataItem  } from './PlanIT_Demo.web.data';
import { checkEqual} from '../src/lib/CheckUtils';
import { S, url, getUrl, setForm, getForm, SS } from '../src/lib/WebUtils';
import { waitRetry, debug } from '../src/lib/SysUtils';

const config: TestConfig = {
  title: 'planIT demo',
  owner: 'JW',
  enabled: true,
  countries: AllCountries
}

export interface Item extends DataItem {
  validators: Validators<DState>
}

export type ApState = {
  url: string,
  pageTitle: string,
  linkList: string[],
}

type DState = {
  expectedLinks: string[],
  linkList: string[]
}

function prepState(a: ApState, i: Item, rc: RunConfig): DState {
  return {
    expectedLinks: [],
    linkList: []
  }
}

export const smartbearUrl : string = 'http://secure.smartbearsoftware.com/samples/TestComplete12/WebOrders/Login.aspx';

export function populateLogIn() {
  setForm('form', {
      ctl00_MainContent_username: 'Tester',
      ctl00_MainContent_password: 'test'
  }
 );
}

export function clickLogin() {
  S('#ctl00_MainContent_login_button.button').click();
}

export function logInSmartbear() {
  url(smartbearUrl);
  populateLogIn();
  clickLogin();
}

export function waitRetryDemo() {
  // browser.debug();
  debug(waitRetry(() => S("nnoexistant").isExisting(), 2000), "does not exist");
  debug(waitRetry(() => S("#ctl00_MainContent_login_button").isExisting(), 2000), "Exists ID");
  debug(waitRetry(() => S(".button").isExisting(), 2000), "any button");
  debug(waitRetry(() => S('.button[value^="Log"]').isExisting(), 2000), "button value prefix partial");
  debug(waitRetry(() => S('.button[value*="og"]').isExisting(), 2000), "button value partial anywhere");
  debug(waitRetry(() => S('#aspnetForm [value*=og]').isExisting(), 2000), "button text partial anywhere in form");
  debug(waitRetry(() => SS('#aspnetForm .info').length > 0, 2000), "infos");
  debug(waitRetry(() => SS('#aspnetForm .info').length > 0, 2000), "paragraphs");
  // note you can use set
}

export function dragAndDrop() {

}


export function interactor(item: Item, runConfig: RunConfig): ApState {
  //url(catchUrl);
  S(`a[data-target="${item.dataTarget}"]`).click();
  
  const catList = S(
                    "html.js.no-webp body.chunky-prices article#mainContentBlock.main-content section.container.grid-row div.category-visualiser div.category-visualiser__card div.category-visualiser__section.category-visualiser__subcategories div.category-visualiser__section-body ul.category-visualiser__subcategories-list")
                    .$$("a")
                    .filter(e => e.isDisplayedInViewport())
                    .map(e => e.getText()),
        title = browser.getTitle(),
        thisUrl = getUrl();

  return {
    url: thisUrl,
    pageTitle: <any>title,
    linkList: catList
  }
}

function check_expected_links(dState: DState) {
  checkEqual(dState.expectedLinks, dState.linkList, "links should be the same");
}

function  testItems(runConfig: RunConfig): Item[] {
  return [] // baseData();
}

export const testCase: TestCase<Item, ApState, DState>  = {
  testConfig: config,
  interactor: interactor,
  prepState: prepState,
  testItems: testItems
}

register(testCase)
