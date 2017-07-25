import {chk, chkEq, chkEqJson, chkFalse} from '../lib/AssertionUtils';
import * as _ from 'lodash';
import jp from 'jsonpath';
import { debug } from '../lib/SysUtils';



describe.skip('defaultsDeep', () => {

  it('complex array', () => {
    let actual = _.defaultsDeep({}, { 'a': [5, 6, 7, 8, 9, {hi: 'hi'}] });
    chkEq({ 'a': [5, 6, 7, 8, 9, {hi: 'hi'}] }, actual);
  });

});
describe.skip('cloneDeep', () => {

  const TARGET = {
                john: {

                        pets: {
                                stompa: 'rabbit',
                                spot: 'dog'
                              }
                       },
                 betty: {
                          pets: {
                                  sooty: [1, 2, 3, 4]
                                }
                       }
               };

  it('pojso', () => {
    let actual = _.cloneDeep(TARGET);
    debug(actual);
    chkEq(TARGET, actual);
  });

  it('pmutation doesn\'t change clone', () => {
    let actual = _.cloneDeep(TARGET);
    let oldName = TARGET.john.pets.stompa;
    actual.john.pets.stompa = 'bear';
    chkEq(oldName, TARGET.john.pets.stompa);
  });

  it('empty array', () => {
    let actual = _.cloneDeep([]);
    chkEq([], actual);
  });

  it(' array', () => {
    let expected = [1, 'hi', 5],
        actual = _.cloneDeep(expected);
    chkEq([1, 'hi', 5], actual);
  });

  it(' array complex', () => {
    let expected = [1, 'hi', {hi: 1, arr: [1, 2, 3, 4]}],
        actual = _.cloneDeep(expected);
    expected[2].hi = 444;
    chkEq([1, 'hi', {hi: 1, arr: [1, 2, 3, 4]}], actual);
  });

  it('number', () => {
    chkEq(4, _.cloneDeep(4));
  });

  it('number', () => {
    chkEq(null, _.cloneDeep(null));
  });

});

describe.skip('demo jsonPath', () => {

  it('jspath demo', () => {
    var cities = [
      { name: "London", "population": 8615246 },
      { name: "Berlin", "population": 3517424 },
      { name: "Madrid", "population": 3165235 },
      { name: "Rome",   "population": 2870528 }
    ];

    var names = jp.query(cities, '$..name');
    debug(names, 'Plain old array');

    let bookStore = {
                      "store": {
                        "book": [
                          {
                            "category": "reference",
                            "author": "Nigel Rees",
                            "title": "Sayings of the Century",
                            "price": 8.95
                          }, {
                            "category": "fiction",
                            "author": "Evelyn Waugh",
                            "title": "Sword of Honour",
                            "price": 12.99
                          }, {
                            "category": "fiction",
                            "author": "Herman Melville",
                            "title": "Moby Dick",
                            "isbn": "0-553-21311-3",
                            "price": 8.99
                          }, {
                             "category": "fiction",
                            "author": "J. R. R. Tolkien",
                            "title": "The Lord of the Rings",
                            "isbn": "0-395-19395-8",
                            "price": 22.99
                          }
                        ],
                        "bicycle": {
                          "color": "red",
                          "price": 19.95
                        }
                      }
                    };

      debug(jp.query(bookStore, '$.store.book[*].author'), 'authors of books');

      debug(jp.query(bookStore, '$..store..[?(@.price>10)]'), 'all items more than $10');

  });

});
