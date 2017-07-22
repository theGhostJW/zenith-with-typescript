import {chk, chkEq, chkEqJson, chkFalse} from '../lib/AssertionUtils';
import * as _ from 'lodash';
import jp from 'jsonpath';
import { debug } from '../lib/SysUtils';

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
