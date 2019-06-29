import * as _ from 'lodash';
import { register, RunConfig, TestCase, TestConfig, Validators, AllCountries  } from './ProjectConfig';
import { chkEq} from '../src/lib/CheckUtils';
import { S, url, getUrl } from '../src/lib/WebUtils';

const config: TestConfig = {
  title: 'sub-menus are as expected',
  owner: 'JW',
  enabled: true,
  countries: AllCountries
}

export type Item = {
  id: number,
  when: string,
  then: string,
  dataTarget: string,
  expectedLinks: string[],
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
    expectedLinks: i.expectedLinks,
    linkList: a.linkList
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
  chkEq(dState.expectedLinks, dState.linkList, "links should be the same");
}

function  testItems(runConfig: RunConfig): Item[] {
  return [
    {
      id: 100,
      when: "the women's list is visited",
      then: 'the shop by category list is as expected',
      dataTarget: 'womens-fashion',
      expectedLinks: ["Women's Clothing",
            "Women's Shoes",
            "Jewellery",
            "Watches",
            "Sunglasses",
            "Handbags",
            "Luggage",
            "Hats",
            "Wallets",
            'Accessories',
            "Intimate Apparel",
            "Backpacks"],
      validators: check_expected_links
    },
    {
      id: 200,
      when: "the mens's list is visited",
      then: 'the shop by category list is as expected',
      dataTarget: 'mens-fashion',
      expectedLinks: [
          "Men's Clothing",
          "Men's Shoes",
          "Workwear",
          "Watches",
          "Sunglasses",
          "Bags",
          "Luggage",
          "Hats",
          "Wallets",
          "Accessories",
          "Jewellery",
          "Backpacks"],
      validators: check_expected_links
    },
    {
      id: 300,
      when: "the mens's list is visited with an incorrect expected list",
      then: 'we get an error',
      dataTarget: 'mens-fashion',
      expectedLinks: [
          "Men's Clothing",
          "Men's Shoes",
          "Workwear",
          "Watches",
          "Sunglasses",
          "Bags",
          "Luggage",
          "Hats",
          "Wallets",
          "Accessories",
          "Jewellery",
          "Mens Stuff",
          "Backpacks"],
      validators: check_expected_links
    },
    {
      id: 400,
      when: "there is an interactor error",
      then: 'we get an error error',
      dataTarget: 'cats-fashion',
      expectedLinks: [],
      validators: check_expected_links
    },

  ];
}

export const testCase: TestCase<Item, ApState, DState>  = {
  testConfig: config,
  interactor: interactor,
  prepState: prepState,
  testItems: testItems
}

register(testCase)
