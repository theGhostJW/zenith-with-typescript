// @flow

import {it, describe} from 'mocha'
import {
  reorderProps,
  fillArray,
  isDefined,
  isNullEmptyOrUndefined,
  hasValue,
  def,
  xOr,
  all,
  stringConvertableToNumber,
  areEqualWithTolerance,
  areEqual,
  seekManyInObjWithInfo,
  seekManyInObj,
  seekInObj,
  seekInObjWithInfo,
  seekInObjNoCheckWithInfo,
  seekInObjNoCheck,
  setInObjn,
  setInObj1,
  setInObj2,
  setInObj3,
  setInObj4,
  seekAllInObj,
  isPOJSO,
  debug,
  yamlToObj,
  objToYaml,
  forceArray,
  autoType,
  setParts,
  hostName,
  flattenObj,
  valueTracker,
  deepReduceValues,
  functionNameFromFunction,
  _parseTaskList,
  waitRetry,
  randomInt,
  randomInt0,
  callerString,
  callstackStrings,
  isSerialisable
} from '../lib/SysUtils';
import { toTempString } from '../lib/FileUtils';
import {show, hasText} from '../lib/StringUtils';
import {chk, chkEq, chkEqJson, chkFalse, chkExceptionText, chkWithMessage, chkHasText} from '../lib/AssertionUtils';
import * as _ from 'lodash';
import { PROCESS_LIST } from '../test/SysUtils.data.test';
import { log } from '../lib/Logging';

const showTarget = v => debug('\n' + show(v))

describe('isSerialisable', () => {

  it('string', () => {
    chk(isSerialisable('HI'));
  });

  it('number', () => {
    chk(isSerialisable(23454))
  });

  it('null', () => {
    chk(isSerialisable(null))
  });

  it('undefined', () => {
    chk(isSerialisable(undefined))
  });


  it('plain obj', () => {
    chk(isSerialisable({p: 1, p2: 'hi'}))
  });

  it('plain obj with func', () => {
    chkFalse(isSerialisable({p: 1, p2: () => {}}))
  });


  it('nested obj with func', () => {
    chkFalse(isSerialisable({p: 1, p2: 'hi', n: { nn: { nnn: 1, nnm: () => {}}}}))
  });

  it('array', () => {
    chk(isSerialisable([1, 2, 3, 5]))
  });

  it('array with func', () => {
    chkFalse(isSerialisable([1, 2, 3, () => false]))
  });

  it('array with nested obj', () => {
    chk(isSerialisable([1, 2, 3, { nn: { nnn: 1, nnm: 'Hi'}}]))
  });

  it('array with newsted obj with func', () => {
    chkFalse(isSerialisable([1, 2, 3, { nn: { nnn: 1, nnm: () => {}}}]))
  });

});

describe('getCallerString', () => {


  function calledFunc() {
    return callerString();
  }

  it('simple', function blahhh(){
    let actual = calledFunc();
    chkHasText(actual, 'blahhh');
    chkHasText(actual, 'SysUtils.test.js');
  });

});


describe('callstackStrings', () => {

  it('simple', function blahhStrings() {
    let actual = callstackStrings();
    chkHasText(actual.join('\n'), 'blahhStrings');
  });

});

describe('random ', () => {

  function probTest(func: () => number, expectedVals: Array<string>) {
    _.chain(1000)
      .times(func)
      .groupBy(_.identity)
      .toPairs()
      .each(kv => {
        let k = kv[0],
            v = kv[1];
        chkWithMessage(expectedVals.includes(k), `key ${show(k)}`);
        chkWithMessage(v.length > 10, `val ${show(v)}`);
      })
      .value();
  }

  it('probablistic randomInt', () => {
    probTest(() => randomInt(1, 5.9), ['1', '2', '3', '4', '5']);
  });

  it('probablistic randomInt0', () => {
    probTest(() => randomInt0(5.9), ['0', '1', '2', '3', '4', '5']);
  });



});


describe('waitRetry', () => {

  it('success', () => {
    let actual = waitRetry(() => true, 1000);
    chk(actual);
  });

});

describe('process list parsing - _parseTaskList', () => {

  it('simple', () => {
    let actual = _parseTaskList(PROCESS_LIST);
    chkEq(210, actual.length);
  });

});

describe('functionNameFromFunction', () => {

  it('named', () => {
    chkEq('funcName', functionNameFromFunction(function funcName() {}))
  });

  it('anonymous function should return empty string', () => {
    chkEq('', functionNameFromFunction(() => {}))
  });

});

describe('deepReduceValues', () => {

  it('nested obj', () => {
    let obj = {
        name: 'Che',
        last: 'Guevara',
        dob: '14-06-1928',
            children: {
              aleida: {
                        dob: 'November 24, 1960',
                        residence: 'Havana, Cuba'
                      },
              ernesto: {
                        dob: '1965'
                       }
            }
      };

    function addProp(accum, value, address){
      accum[address] = value;
      return accum;
    };

    let actual = deepReduceValues(obj, addProp, {});

    const EXPECTED = {
                    name: 'Che',
                    last: 'Guevara',
                    dob: '14-06-1928',
                    'children.aleida.dob': 'November 24, 1960',
                    'children.aleida.residence': 'Havana, Cuba',
                    'children.ernesto.dob': '1965'
                  };

    chkEq(EXPECTED, actual);
  });

});


describe('valueTracker', () => {

  let idStr = (s: string) : string => s;

  it('simple set', () => {
    let testTracker = valueTracker('strTracker', idStr);
    chkEq('val1', testTracker.newVal('v1', 'val1'));
  });

  it('simple set / get', () => {
    let testTracker = valueTracker('strTracker', idStr);
    testTracker.newVal('v1', 'val1');
    testTracker.newVal('v2', 'val2');
    chkEq('val2', testTracker.getVal('v2'));
  });

  it('key not found error', () => {
    let testTracker = valueTracker('strTracker', idStr);
    testTracker.newVal('v1', 'val1');
    chkExceptionText(() => testTracker.getVal('v2'), 'No instance of value for key: v2 in strTracker');
  });

  it('set key twice error', () => {
    let testTracker = valueTracker('strTracker', idStr);
    testTracker.newVal('v1', 'val1');
    chkExceptionText(() => testTracker.newVal('v1', 'val1'), 'Name for key: v1 already created in strTracker');
  });

  it('getOrNew * 2', () => {
    let testTracker = valueTracker('strTracker', idStr);
    chkEq(testTracker.getOrNew('v1', 'val1'), 'val1');
    chkEq(testTracker.getOrNew('v1', 'val2'), 'val1');
  });

});

describe('flattenObj', () => {

  it('simple obj should return itself', () => {
    let targ = {a: 'hi'},
        actual = flattenObj(targ);
    chkEq(targ, actual);
  });

  it('nested returns simple values', () => {
    let targ = {
                a: 'hi',
                b: {
                  c: 'there',
                  d: 1,
                  e: {
                      f: 2,
                      g: null
                  }
                }
     };
     const EXPECTED = {
                       a: 'hi',
                       c: 'there',
                       d: 1,
                       f: 2,
                       g: null
                     };
    chkEq(EXPECTED, flattenObj(targ));
  });

  const NESTED = {
          a: 'hi',
          b: {
            c: 'there',
            d: 1,
            e: {
                f: 2,
                g: null,
                d: 2,
                a: 'ehi'
            }
          }
  };

  it('deeply nested values should override shallow values where allowDuplicateKeyOverwrites', () => {
    const EXPECTED = {
      a: 'ehi',
      c: 'there',
      d: 2,
      f: 2,
      g: null
    }
    chkEq(EXPECTED, flattenObj(NESTED, true));
  });

  it('deeply nested values should throw exception when allowDuplicateKeyOverwrites is false', () => {
    chkExceptionText(() => flattenObj(NESTED), 'the key: d would appear more than once in the flattened*object');
  });

});

describe('hostName', () => {

  it('does not blow up returns a string', () => {
    let actual = hostName();
    chkEq('string', typeof actual);
  });

});

describe('setparts', () => {

  it('numbers', () => {
    let expected = setParts([1,2,3,4], [2,4,6,8]);
    chkEq([[1, 3], [2, 4], [6, 8]], expected);
  });

  it('strings', () => {
    let expected = setParts(['one','two','three','four'], ['two','four','six','eight']);
    chkEq([['one','three'], ['two','four'], ['six','eight']], expected);
  });

});

describe('autoType', () => {

  it('single obj array', () => {

    let targ = [{noChange: 'hi'}],
        typed = autoType(targ);

    chkEq(targ, typed);
  });

  describe('simple array', () => {

    var target = [
               {
                 "id": "10",
                 "name": "exact",
                 "dob": "1979-01-01",
                 "drivers": "N",
                 "address": "N",
                 "outcome": "Y",
                 "flip/repeat": "Y"
               },
               {
                 "id": "11",
                 "name": "exact",
                 "dob": "1971-01-01",
                 "drivers": "Y",
                 "address": "N",
                 "outcome": "Y",
                 "flip/repeat": "Y"
               },
               {
                 "id": "12",
                 "name": "exact",
                 "dob": "1980-01-01",
                 "drivers": "N",
                 "address": "Y",
                 "outcome": "Y",
                 "flip/repeat": "Y"
               },
               {
                 "id": "13",
                 "name": "concatFM",
                 "dob": "1970-02-01",
                 "drivers": "N",
                 "address": "N",
                 "outcome": "Y",
                 "flip/repeat": "Y"
               },
               {
                 "id": "14",
                 "name": "concatML",
                 "dob": "1970-01-02",
                 "drivers": "Y",
                 "address": "N",
                 "outcome": "Y",
                 "flip/repeat": "Y"
               },
               {
                 "id": "15",
                 "name": "concatFM",
                 "dob": "1970-01-01",
                 "drivers": "N",
                 "address": "Y",
                 "outcome": "Y",
                 "flip/repeat": "Y"
               },
               {
                 "id": "16",
                 "name": "exact",
                 "dob": "1970-01-01",
                 "drivers": "Y",
                 "address": "Y",
                 "outcome": "Y",
                 "flip/repeat": "N"
               }
             ];

     function makeTypeCheck(typeMap) {
       return function chkTypes(obj: {}) {
         function typeChk(val, key) {
           let expectedType = typeMap[key],
               actualType = typeof val,
               id = (obj: any).id;
           chkWithMessage(expectedType == actualType, `id: ${id} - ${key} - expected: ${expectedType} - actual: ${actualType} - ${val}`);
         }
         _.each(obj, typeChk);
       }
     }

    it('multiple autotypes', () => {
      const EXPECTED_TYPES =  {
         id: "number",
         name: "string",
         dob: "object",
         drivers: "boolean",
         address: "boolean",
         outcome: "boolean",
         'flip/repeat': "boolean"
       };
      let typed = autoType(target);
      _.each(typed, makeTypeCheck(EXPECTED_TYPES));
    });

    it('define exlcuded fields', () => {
      const EXPECTED_TYPES =  {
         id: "string",
         name: "string",
         dob: "object",
         drivers: "boolean",
         address: "boolean",
         outcome: "string",
         'flip/repeat': "boolean"
       };

      let targetLocal = _.cloneDeep(target),
          recOne = targetLocal[0],
          oldId = recOne.id,
          oldOutcome =  recOne.outcome;

      recOne.id = '`' + oldId;
      recOne.outcome =  '`' +  oldOutcome;

      let typed = autoType(targetLocal);
      _.each(typed, makeTypeCheck(EXPECTED_TYPES));

      // typed
      recOne = typed[0];
      chkEq(oldId, recOne.id);
      chkEq(oldOutcome, recOne.outcome);
    });

    it('mixed type should not be autotyped', () => {
      const EXPECTED_TYPES =  {
         id: "number",
         name: "string",
         dob: "object",
         drivers: "boolean",
         address: "boolean",
         outcome: "string",
         'flip/repeat': "boolean"
       };
      let newTarget = _.cloneDeep(target);
      // will disable atotyping to bool
      newTarget[4].outcome = 'M';
      let typed = autoType(newTarget);
      _.each(typed, makeTypeCheck(EXPECTED_TYPES));
    });

    it('dot nulls', () => {
      let targ =  [{
              first: 'blahh',
              middle: '.',
              last: '.',
              dob: '1234'
            }],
            expected = [{
                  first: 'blahh',
                  middle: null,
                  last: null,
                  dob: 1234
          }],
          actual = autoType(targ);

      chkEq(expected, actual);
    });

    it('dot nulls - exclude', () => {
      let targ =  [{
                          first: 'blahh',
                          middle: '.',
                          last: '`.',
                          dob: '1234'
                  },
                  {
                          first: '.',
                          middle: '.',
                          last: '.',
                          dob: '1234'
                  }],

            expected =   [{
                            first: 'blahh',
                            middle: null,
                            last: '.',
                            dob: 1234
                          },
                          {
                            first: null,
                            middle: null,
                            last: '.',
                            dob: 1234
                          }],
          actual = autoType(targ),
          recOne = actual[0];

      chkEq('.', recOne.last);
      chkEq(expected, actual);
    });
  });

});

describe('forceArray', () => {

  it('single vals', () => {
    chkEq([1, 2, 3, 4], forceArray(1, 2, 3, 4));
  });

  it('single vals and arrays', () => {
    chkEq([1, 2, 3, 4], forceArray(1, [2, 3], [4]));
  });

  it('single vals and arrays and undefined', () => {
    chkEq([1, 2, 3, 4], forceArray(1, [2, 3], [4], undefined, undefined));
  });

});

describe('objToYaml / YamlToObj', () => {

  it('basic round trip', () => {
    let obj = {
      p1: 'hi',
      p2: [1,2,3,4],
      p3: {
        pp1: 345,
        p2: null,
       'unconventional prop': 'hello there',
       arr:['j', 34, 9]
      }
    };

    let actual = yamlToObj(objToYaml(obj));
    chkEq(obj, actual);
  });

  it('will handle trimming correctly', () => {
    let yaml =  `
                  timestamp: '2017-10-01 13:46:27'
                  level: info
                  subType: FilterLog
                  popControl: NoAction
                  message: Filter Log
                  additionalInfo: |
                    Demo_Case.js: Accepted
                    Another_Demo_Case.js: Accepted
                `;
    let actual = yamlToObj(yaml, true);
    chkEq('info', actual.level);
  });


});

interface ValKey {
  key : string | number,
  value : mixed
}

function valKeys(searcInfo : Array < $Subtype < ValKey >>) : Array < ValKey > {
  return searcInfo.map((a : ValKey) => {
    return {key: a.key, value: a.value}
  });
}

function chkValKeys(expected, actual : Array < $Subtype <
  ? ValKey >>) {
  actual = valKeys(actual);
  chkEq(expected, actual);
}

describe('setInObjn', () => {

  const EXPECTED = {
    store: {
      book: {
        category: "new non fiction",
        author: "J. R. R. Tolkien",
        title: "The Lord of the Rings",
        isbn: "0-395-19395-8",
        price: 22.99
      },
      books: [
        {
          category: "reference",
          author: "Nigel Rees",
          title: "Sayings of the Century",
          price: 8.95
        }
      ],
      bicycle: {
        category: "fun",
        color: "red",
        gears: 12,
        price: 19.95
      }
    },
    home: {
      color: "green",
      category: "new Home",
      stuff: {
        category: "stuff cat",
        toys: "new Toys",
        author: "Me",
        other: {
          moreInfo: "Hi there"
        }
      }
    }
  };

  const ACTUAL = {
    store: {
      book: {
        category: "fiction",
        author: "J. R. R. Tolkien",
        title: "The Lord of the Rings",
        isbn: "0-395-19395-8",
        price: 22.99
      },
      books: [
        {
          category: "reference",
          author: "Nigel Rees",
          title: "Sayings of the Century",
          price: 8.95
        }
      ],
      bicycle: {
        category: "fun",
        color: "red",
        gears: 12,
        price: 19.95
      }
    },
    home: {
      color: "green",
      category: "homi",
      stuff: {
        category: "stuff cat",
        toys: "fiction",
        author: "Me",
        other: {
          moreInfo: 'Hi there'
        }
      }
    }
  };

  it('updates properties as expected', () => {
    setInObjn(ACTUAL, ['toys'], 'new Toys');
    setInObjn(ACTUAL, [
      'home', 'category'
    ], 'new Home');
    setInObjn(ACTUAL, [
      'st*', 'book', 'category'
    ], 'new non fiction');
    setInObjn(ACTUAL, ['color'], 'green');
    chkEq(EXPECTED, ACTUAL);
  });

  it('throws on missing property', () => {
      chkExceptionText(() => {
                              setInObjn(ACTUAL, ['st*', 'toys', 'will not work']);
                            }, 'toys, will not*work');
  });
});

describe('setInObj1..4', () => {

  let base = {
                store: {
                  home: {
                    colour: "green",
                    stuff: {
                      author: "Me",
                      other: {
                        moreInfo: "Hi there"
                      }
                    }
                  }
                }
               };

  let targ = () => {return (_.cloneDeep(base) : any);}

  it('setInObj1 - sets property', () => {
    let expected = targ();
    expected.store.home = {hi: 1};
    chkEq(expected, setInObj1(targ(), 'home', {hi: 1}));
  });

  it('setInObj2 - sets property', () => {
    let expected = targ();
    expected.store.home = {hi: 1};
    chkEq(expected, setInObj2(targ(), 'store', 'home', {hi: 1}));
  });

  it('setInObj3 - sets property', () => {
    let expected = targ();
    expected.store.home.colour = 'blu';
    chkEq(expected, setInObj3(targ(), 'store', 'home', 'colour', 'blu'));
  });

  it('setInObj4 - sets property', () => {
    let expected = targ();
    expected.store.home.stuff.author = 'You';
    chkEq(expected, setInObj4(targ(), 'store', 'home', 'stuff', 'author', 'You'));
  });
});

describe('seekInObjxxx - derived functions', () => {

  const EG_OBJ = {
    store: {
      book: {
        category: "fiction",
        author: "J. R. R. Tolkien",
        title: "The Lord of the Rings",
        isbn: "0-395-19395-8",
        price: 22.99
      },
      books: [
        {
          category: "reference",
          author: "Nigel Rees",
          title: "Sayings of the Century",
          price: 8.95
        }, {
          category: "fiction",
          author: "Evelyn Waugh",
          title: "Sword of Honour",
          price: 12.99
        }
      ],
      bicycle: {
        category: "fun",
        color: "red",
        gears: 12,
        price: 19.95
      }
    },
    home: {
      color: "green",
      category: "homi",
      stuff: {
        category: "stuff cat",
        toys: "fiction",
        author: "Me",
        other: {
          moreInfo: 'Hi there'
        }
      }
    }
  };

  describe('seekAllInObj', () => {

    it('basic find all', () => {
      chkEq(["homi","fiction","fun","stuff cat"], seekAllInObj(EG_OBJ, 'category'));
    });

  });

  describe('seekManyInObj', () => {

    it('single item', () => {
      chkEq(['Hi there'], seekManyInObj(EG_OBJ, 'moreInfo'));
    });

    it('missing item', () => {
      chkEq([], seekManyInObj(EG_OBJ, 'lessInfo'));
    });

  });

 /* CATCH UPS */
  describe('seekInObj', () => {

    it('single item', () => {
      showTarget(EG_OBJ)
      debug(seekInObj(EG_OBJ, 'moreInfo'), "seekInObj(EG_OBJ, 'moreInfo')")
      chkEq('Hi there', seekInObj(EG_OBJ, 'moreInfo'));
    });

    it('missing item', () => {
      showTarget(EG_OBJ)
      debug(seekInObj(EG_OBJ, 'lessInfo'), "seekInObj(EG_OBJ, 'lessInfo')")
      chkEq(undefined, seekInObj(EG_OBJ, 'lessInfo'));
    });

    it('ambiguous - expect error', () => {

      showTarget(EG_OBJ)
      debug('store, category', "seekInObj(EG_OBJ, 'store', 'category')")
      debug('BANG')
      chkExceptionText(() => {
        seekInObj(EG_OBJ, 'store', 'category')
      },
      'More than one object matches supplied specifiers:*store.book.category, store.bicycle.category');
    });

  });

  describe('seekInObjWithInfo', () => {

    it('single item', () => {
      showTarget(EG_OBJ)
      debug(seekInObjWithInfo(EG_OBJ, 'moreInfo'))
      chkValKeys([
        {
          key: 'moreInfo',
          value: 'Hi there'
        }
      ], [seekInObjWithInfo(EG_OBJ, 'moreInfo')]);
    });

    it('missing item', () => {
      chkEq(undefined, seekInObjWithInfo(EG_OBJ, 'lessInfo'));
    });

    it('ambiguous - expect error', () => {
      chkExceptionText(() => {
        seekInObjWithInfo(EG_OBJ, 'store', 'category')
      }, 'More than one object matches supplied specifiers:*store.book.category, store.bicycle.category');
    });

  });

  describe('seekInObj*NoCheck', () => {

    it('seekInObjNoCheckWithInfo ambiguous - no error', () => {
      showTarget(EG_OBJ);
      debug(seekInObjNoCheck(EG_OBJ, 'store', 'category'), "seekInObjNoCheck(EG_OBJ, 'store', 'category')");
      chkValKeys([
        {
          "key": "category",
          "value": "fiction"
        }
      ], [seekInObjNoCheckWithInfo(EG_OBJ, 'store', 'category')]);
    });

    it('seekInObjNoCheck ambiguous - no error', () => {
      chkEq("homi", seekInObjNoCheck(EG_OBJ, 'category'));
    });

  });

});

describe('seekManyInObjWithInfo', () => {

  const EG_OBJ = {
    store: {
      book: {
        category: "fiction",
        author: "J. R. R. Tolkien",
        title: "The Lord of the Rings",
        isbn: "0-395-19395-8",
        price: 22.99
      },
      books: [
        {
          category: "reference",
          author: "Nigel Rees",
          title: "Sayings of the Century",
          price: 8.95
        }, {
          category: "fiction",
          author: "Evelyn Waugh",
          title: "Sword of Honour",
          price: 12.99
        }
      ],
      bicycle: {
        category: "fun",
        color: "red",
        gears: 12,
        price: 19.95
      }
    },
    home: {
      color: "green",
      category: "homi",
      stuff: {
        category: "stuff cat",
        toys: "fiction",
        author: "Me",
        other: {
          moreInfo: 'Hi there'
        }
      }
    }
  };

  describe('property selectors', () => {
    it('finds a single string match', () => {

      let targ = {
          blah: 1
        },
        expected = [
          {
            parent: {
              "parent": null,
              value: {
                "blah": 1
              },
              key: "",
              specifiers: [null]
            },
            value: 1,
            key: "blah",
            specifiers: []
          }
        ],
        actual = seekManyInObjWithInfo(targ, 'blah');

      chkEqJson(expected, actual);
    });

    it('on-ly finds single object in branch', () => {
      let expected = [
        {
          key: "category",
          value: "homi"
        }
      ];
      chkValKeys(expected, seekManyInObjWithInfo(EG_OBJ, 'home', 'category'));
    });

    let targ = {
      blah1: 1,
      blah: 2,
      blahh2: 'Gary',
      child: {
        blah: 2,
        grandChild: {
          blah: [
            1, 2, 3
          ],
          blahh2: 'Gary'
        }
      }
    };

    it('finds a multiple wildcard string match', () => {
      showTarget(targ)
      debug(seekManyInObj(targ, 'blah*'), 'seekManyInObj(targ, "blah*")')

      showTarget(targ)
      debug(seekAllInObj(targ, 'blah*'), 'seekAllInObj(targ, "blah*")')

      let expected = [
          {
            "key": "blah1",
            "value": 1
          }, {
            "key": "blah",
            "value": 2
          }, {
            "key": "blahh2",
            "value": "Gary"
          }
        ],
        actual = seekManyInObjWithInfo(targ, 'blah*');
      chkEq(expected, valKeys(actual));
    });

    it('finds with multiple specifiers - single not nested', () => {
      let expected = [
          {
            "key": "blah",
            "value": 2
          }
        ],
        actual = seekManyInObjWithInfo(targ, 'child', 'blah*');

      chkEq(expected, valKeys(actual));
    });

    it('index specifier', () => {
      let expected = [
          {
            "key": "blah",
            "value": 1
          }
        ],
        actual = seekManyInObjWithInfo(targ, 'child', [0]);

      chkEq(expected, valKeys(actual));
    });

    it.only('index specifier plus multiple specifiers', () => {

      let targ = {
        blah1: 1,
        child: {
          blah: 2,
          grandChild: {
            blah: [
              1,
              2, {
                final: 1
              }
            ],
            blahh2: 'Gary'
          }
        }
      };

      let expected = [
          {
            key: "final",
            value: 1
          }
        ],
        actual = seekManyInObjWithInfo(targ, 'child', 'grandChild', 'blah', [2], 'final');

      showTarget(targ);
      debug(seekManyInObj(targ, 'child', 'grandChild', 'blah', [2], 'final'),
                    "seekManyInObj(targ, 'child', 'grandChild', 'blah', [2], 'final')"
                  );

      chkEq(expected, valKeys(actual));
    });

    it('index specifier plus multiple specifiers and non obj in array', () => {

      let targ = {
        blah1: 1,
        child: {
          blah: 2,
          grandChild: {
            blah: [
              1, 2, 7
            ],
            blahh2: 'Gary'
          }
        }
      };

      let expected = [
          {
            key: "blah",
            value: 7
          }
        ],
        actual = seekManyInObjWithInfo(targ, 'child', 'grandChild', 'blah', [2]);

      chkEq(expected, valKeys(actual));
    });

    it('index specifier plus multiple specifiers and non obj in array - object does not exist', () => {

      let targ = {
        blah1: 1,
        child: {
          blah: 2,
          grandChild: {
            blah: [
              1, 2, 7
            ],
            blahh2: 'Gary'
          }
        }
      };

      let expected = [],
        actual = seekManyInObjWithInfo(targ, 'child', 'grandChild', 'blah', [2], 'final');

      chkEq(expected, []);
    });

    it('simple prop - deeply nested', () => {
      let expected = [
          {
            key: "gears",
            value: 12
          }
        ],
        actual = seekManyInObjWithInfo(EG_OBJ, 'gears');
      chkEq(expected, valKeys(actual));
    });

    it('simple prop - null', () => {
      let targ = {
          prop: null
        },
        expected = [
          {
            key: "prop",
            value: null
          }
        ],
        actual = seekManyInObjWithInfo(targ, 'prop');
      chkEq(expected, valKeys(actual));
    });

    it('simple prop - shallow', () => {
      let expected = [
          {
            "key": "category",
            "value": "fiction"
          }, {
            "key": "category",
            "value": "fun"
          }
        ],
        actual = valKeys(seekManyInObjWithInfo(EG_OBJ, 'store', 'category'));

      chkEq(expected, actual);
    });

    it('deeply nested - with wildcard', () => {
      let expected = [
          {
            "key": "category",
            "value": "stuff cat"
          }
        ],
        actual = valKeys(seekManyInObjWithInfo(EG_OBJ, 'stuff', 'cat*'));
      chkEq(expected, actual);
    });

    it('property missing - should be null', () => {
      let actual = seekManyInObjWithInfo(EG_OBJ, 'nonProperty');
      chkEq([], actual);
    });

    it('nested property with substring of name', () => {
      let targ = {
          blah1: 1,
          child: {
            blah: 2
          }
        },
        actual = valKeys(seekManyInObjWithInfo(targ, 'blah')),
        expected = [
          {
            key: "blah",
            value: 2
          }
        ];
      chkEq(expected, actual);
    });
  });

  describe('object Selectors', () => {

    it('nested with object selectors and wild cards', () => {
      let expected = [
          {
            key: "book",
            value: EG_OBJ.store.book
          }
        ],
        actual = valKeys(seekManyInObjWithInfo(EG_OBJ, {author: '*Tol*'}));
      chkEq(expected, actual);
    });

    it('multi prop object specifier', () => {
      let expected = [
          {
            key: "stuff",
            value: EG_OBJ.home.stuff
          }
        ],
        actual = valKeys(seekManyInObjWithInfo(EG_OBJ, {
          color: "g*"
        }, {author: "Me"}));

      chkEq(expected, actual);
    });

    it('mix object / string specifier', () => {
      let expected = [
          {
            key: 'moreInfo',
            value: 'Hi there'
          }
        ],
        actual = valKeys(seekManyInObjWithInfo(EG_OBJ, {
          author: "M*"
        }, 'moreInfo'));
      chkEq(expected, actual);
    });

    it('object specifier missing prop', () => {
      let expected = [],
        actual = seekManyInObjWithInfo(EG_OBJ, {
          noWhereProp: "M*"
        }, 'moreInfo');
      chkEq(expected, actual);
    });
  });

  describe('function selectors', () => {

    function areToys(val : any, key : string | number) : boolean {
      return areEqual('toys', key);
    }

    it('function spec', () => {

      let expected = [
          {
            key: 'toys',
            value: 'fiction'
          }
        ],
        actual = valKeys(seekManyInObjWithInfo(EG_OBJ, areToys));

        showTarget(EG_OBJ)
        debug(`function areToys(val : any, key : string | number) : boolean {
          return areEqual('toys', key);
        }`)
        debug(actual, "seekManyInObjWithInfo(EG_OBJ, areToys)")

      chkEq(expected, actual);
    });

  });

  describe('array selectors', () => {
    describe('simple array on-ly cases', () => {
      const EG_OBJ1 = {
        blah1: 1,
        child: {
          blah: [
            {
              book: {
                title: 'Wild Swans'
              }
            }
          ]
        }
      };

      it('simple nested', () => {
        let expected = [
          {
            key: 'blah',
            value: EG_OBJ1.child.blah[0]
          }
        ];
        chkValKeys(expected, seekManyInObjWithInfo(EG_OBJ1, 'blah', [0]));
      });

      it('simple nested no property', () => {
        let expected = [];
        chkEq(expected, seekManyInObjWithInfo(EG_OBJ1, 'blahg', [0]));
      });

      it('simple nested out of bounds', () => {
        let expected = [];
        chkEq(expected, seekManyInObjWithInfo(EG_OBJ1, 'blah', [1]));
      });

    });

    describe('complex nested selectors', () => {

      const TARG = {
        blah1: 1,
        child: {
          blah: [
            {
              book: {
                title: 'Wild Swans',
                editions: [1, 2, 3, 4]
              }
            }
          ]
        }
      };

      it('multiple array selectors', () => {
        let expected = [
          {
            key: 'editions',
            value: 4
          }
        ];
        chkValKeys(expected, seekManyInObjWithInfo(TARG, 'blah', [0], 'editions', [3]));
      });

      it('multiple hof array selectors on array', () => {
        let expected = [
          {
            key: 'editions',
            value: 2
          }
        ];

        function hasSwansTitle(val) {
          return hasText(((val : any) : {
            book: {
              title: string
            }
          })['book']['title'], 'swans');
        }

        function isTwo(val) {
          return val === 2;
        }

        chkValKeys(expected, seekManyInObjWithInfo(TARG, 'blah', [hasSwansTitle], 'editions', [isTwo]));
      });

    });

  });

});

describe('isPOJSO', () => {

  it('returns true for POJSO', () => {
    chk(isPOJSO({}));
  });

  it('returns false for null', () => {
    chkFalse(isPOJSO(null));
  });

  it('returns false for array', () => {
    chkFalse(isPOJSO([]));
  });

});

describe('areEqualWithTolerance', () => {

  it('all', () => {
    chk(areEqualWithTolerance(1, 1.000000, 0.000001));
    chk(areEqualWithTolerance(1.000001, 1.000000, 0.000001));
    chkFalse(areEqualWithTolerance(1.000001, 1.000000, 0.0000009));
    chk(areEqualWithTolerance(0, 0, 0.000001));
    chk(areEqualWithTolerance(1, 1.1, 0.1));
    chk(areEqualWithTolerance(1, '1.1', 0.1));
    chk(areEqualWithTolerance(1, '0.9', 0.1));
    chk(areEqualWithTolerance(0.0000000001, 0.0000000001));

    chkFalse(areEqualWithTolerance(1, '0.9', 0.09));
    chk(areEqualWithTolerance(1.000001, '1', 0.000001));
    chkFalse(areEqualWithTolerance(1.000001, '1', 0.0000009999999));
    chkFalse(areEqualWithTolerance(1.000001, '1.000001001', 0));
  });
});

describe('areEqual', () => {

  it('null', () => {
    chk(areEqual(null, null));
  });

  it('2 ints', () => {
    chk(areEqual(22, 22));
  });

  it('unequal numbers ints one as string', () => {
    chkFalse(areEqual(22, 22.1));
  });

  it('two floats', () => {
    chk(areEqual(22.111, 22.111));
  });

  it('two floats ii', () => {
    chk(areEqual(22.0000000001, 22.0000000001));
  });

  let val1,
    val2;
  val1 = {
    a: {
      b: 1.2222,
      c: 5.667
    },

    b: new Date(1977, 8, 9),
    c: 66,
    d: 'hi'
  }

  val2 = {
    b: new Date(1977, 8, 9),
    c: 66,
    d: 'hi',
    a: {
      b: 1.2222,
      c: (6 - 0.333)
    }
  };

  it('two objects', () => {
    chk(areEqual(val1, val2));
  });

  it('two objects differ', () => {
    val1.c = 66.00001;
    chkFalse(areEqual(val1, val2));
  });

  it('two strings', () => {
    let val2 = _.cloneDeep(val1);
    chk(areEqual(val1, val2));
  });

  it('two objects with strings', () => {
    let dStr = () => {
      return '[1,2,3]';
    }
    chk(areEqual('[1,2,3]', dStr()));
  });

  it('2 arrays with strings', () => {
    let v1 = () => {
        return [
          {
            "key": "category",
            "value": "homi"
          }, {
            "key": "category",
            "value": "fiction"
          }, {
            "key": "category",
            "value": "fun"
          }, {
            "key": "category",
            "value": "stuff cat"
          }
        ];
      },
      v2 = [
        {
          "key": "category",
          "value": "homi"
        }, {
          "key": "category",
          "value": "fiction"
        }, {
          "key": "category",
          "value": "fun"
        }, {
          "key": "category",
          "value": "stuff cat"
        }
      ];
    chk(areEqual(v1(), v2));
  });

  it('nested obj with array', () => {
    let obj = {
      p1: 'hi',
      p2: [1,2,3,4],
      p3: {
        pp1: 345,
        p2: null,
        p5: undefined,
       'unconventional prop': 'hello there',
       arr:['j', 34, 9]
      }
    };
    let oth = {
      p1: 'hi',
      p2: [1,2,3,4],
      p3: {
        pp1: 345,
        p2: null,
        p5: undefined,
       'unconventional prop': 'hello there',
       arr:['j', 34, 9]
      }
    };
    chkEq(obj, oth)
  });
});

describe('stringConvertableToNumber', () => {

  it('when true', () => {
    chk(stringConvertableToNumber('0'));
    chk(stringConvertableToNumber('1'));
    chk(stringConvertableToNumber('1.1110'));
    chk(stringConvertableToNumber('0.1110'));
  });

  it('when false', () => {
    chkFalse(stringConvertableToNumber('a1.1110'));
    chkFalse(stringConvertableToNumber('01.1110'));
    chkFalse(stringConvertableToNumber('.1110'));
    chkFalse(stringConvertableToNumber('00.1110'));
    chkFalse(stringConvertableToNumber('.1110'));
    chkFalse(stringConvertableToNumber(''));
  });

  it('null / undefined', () => {
    chkFalse(stringConvertableToNumber(null));
    chkFalse(stringConvertableToNumber(undefined));
  });

});

describe('all', () => {

  let even = (n : number) => {
      return n % 2 === 0;
    },
    allEven = (arr : Array < number >) => {
      return all(even, arr)
    };

  it('when true', () => {
    chk(allEven([2, 4, 6, 8, 10]));
  });

  it('when false', () => {
    chkFalse(allEven([2, 4, 6, 8, 11]));
  });

  it('empty', () => {
    chk(allEven([]));
  });

});

describe('xOr', () => {

  it('all', () => {
    chk(xOr(true, false));
    chk(xOr(false, true));
    chkFalse(xOr(false, false));
    chkFalse(xOr(true, true));
  });

});

describe('def', () => {

  it('def - undefined', () => {
    var deffedVar = def(undefined, 1);
    chkEq(1, deffedVar);
  });

  it('def - empty string', () => {
    /* empty string is treated as a value and not defaulted */
    let myVar = "",
      deffedVar = def(myVar, 1);
    chkEq("", deffedVar);
  });

  it('def - null', () => {
    let myVar = null,
      deffedVar = def(myVar, 1);
    chkEq(1, deffedVar);
  });
});

describe('hasValue', () => {

  it('hasValue - all', () => {
    var obj,
      result;

    result = hasValue(obj);
    chkFalse(result);

    result = hasValue(null);
    chkFalse(result);

    obj = null;
    result = hasValue(obj);
    chkFalse(result);

    result = hasValue("");
    chkFalse(result);

    result = hasValue("John");
    chk(result);

    result = hasValue("1/1/2000");
    chk(result);

    result = hasValue("1\\1\\2000");
    chk(result);

    result = hasValue(1);
    chk(result);

    result = hasValue(0);
    chk(result);

    var obj = Array(1, 2, 3)
    result = hasValue(obj);
    chk(result);

    obj = Date.parse('2013-1-1');
    result = hasValue(obj);
    chk(result);

    result = hasValue({exists: true});
    chk(result);

    result = hasValue({Exists: true});
    chk(result);

    result = hasValue({exists: false});
    chkFalse(result);

    result = hasValue({Exists: false});
    chkFalse(result);

    result = hasValue({});
    chk(result);
  });
});

describe('isNullEmptyOrUndefined', () => {

  it('isNullEmptyOrUndefined  - null', () => {
    chk(isNullEmptyOrUndefined(null));
  });

  it('isNullEmptyOrUndefined - undefined', () => {
    chk(isNullEmptyOrUndefined(undefined));
  });

  it('isNullEmptyOrUndefined - str non empty', () => {
    chkFalse(isNullEmptyOrUndefined('a'));
  });

  it('isNullEmptyOrUndefined - str', () => {
    chk(isNullEmptyOrUndefined(''));
  });
});

describe('isDefined', () => {

  it('is defined - null', () => {
    chk(isDefined(null));
  });

  it('is defined - string', () => {
    chk(isDefined(''));
  });

  it('is defined - undefined', () => {
    chkFalse(isDefined(undefined));
  });
});

describe('fillArray', () => {

  it('fillArray - empty', () => {
    var ar = fillArray(0, 'a');
    chkEq(0, ar.length);
  });

  it('fillArray - items', () => {
    var ar = fillArray(3, 'a');
    chkEq([
      'a', 'a', 'a'
    ], ar);
  });
});

describe('reorderProps', () => {

  let sample : {} = {
    prop0: 0,
    prop3: 3,
    prop1: 1,
    prop2: 2
  };

  it('reorderProps - partial', () => {

    let expected : {} = {
      prop2: 2,
      prop1: 1,
      prop0: 0,
      prop3: 3
    };

    let result = reorderProps(sample, 'prop2', 'prop1');
    chkEqJson(expected, result);
  });

  it('reorderProps - missing props', () => {

    let expected : {} = {
      prop2: 2,
      prop1: 1,
      prop0: 0,
      prop3: 3
    };

    let result = reorderProps(sample, 'prop2', 'prop1', 'prop5');
    chkEqJson(expected, result);
  });

  it('reorderProps - all', () => {

    let expected : {} = {
      prop2: 2,
      prop1: 1,
      prop3: 3,
      prop0: 0
    };

    let result = reorderProps(sample, 'prop2', 'prop1', 'prop3', 'prop0');
    chkEqJson(expected, result);
  });

});
