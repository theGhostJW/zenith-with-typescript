import * as _ from 'lodash';
import { register, RunConfig, TestCase, TestConfig, Validators, AllCountries  } from './ProjectConfig';
import { baseData, DataItem  } from './PlanIT_Demo.web.data';
import { checkEqual} from '../src/lib/CheckUtils';
import { S, url, getUrl } from '../src/lib/WebUtils';

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

const catchUrl : string = "https://www.catch.com.au";

export function interactor(item: Item, runConfig: RunConfig): ApState {
  url(catchUrl);
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
