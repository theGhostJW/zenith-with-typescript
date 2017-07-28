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
  seekAllInObj,
  isPOJSO,
  debug
} from '../lib/SysUtils';
import {toString, hasText} from '../lib/StringUtils';
import {chk, chkEq, chkEqJson, chkFalse, chkExceptionText} from '../lib/AssertionUtils';
import * as _ from 'lodash';

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
                             }, 'toys, will not work');
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
    chkEq(["homi","fiction","fun","stuff cat"], seekAllInObj(EG_OBJ, 'category'));
  });

  describe('seekManyInObj', () => {

    it('single item', () => {
      chkEq(['Hi there'], seekManyInObj(EG_OBJ, 'moreInfo'));
    });

    it('missing item', () => {
      chkEq([], seekManyInObj(EG_OBJ, 'lessInfo'));
    });

  });

  describe('seekInObj', () => {

    it('single item', () => {
      chkEq('Hi there', seekInObj(EG_OBJ, 'moreInfo'));
    });

    it('missing item', () => {
      chkEq(undefined, seekInObj(EG_OBJ, 'lessInfo'));
    });

    it('ambiguous - expect error', () => {
      chkExceptionText(() => {
        seekInObj(EG_OBJ, 'store', 'category')
      },
      'More than one object matches supplied specifiers: store.book.category, store.bicycle.category');
    });

  });

  describe('seekInObjWithInfo', () => {

    it('single item', () => {
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
      }, 'More than one object matches supplied specifiers: store.book.category, store.bicycle.category');
    });

  });

  describe('seekInObj*NoCheck', () => {

    it('seekInObjNoCheckWithInfo ambiguous - no error', () => {
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

    it('only finds single object in branch', () => {
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

    it('index specifier plus multiple specifiers', () => {

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
      chkEq(expected, actual);
    });

  });

  describe('array selectors', () => {
    describe('simple array only cases', () => {
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

    /*



       nested properties multiple arrays


    nested properties using HOFS


      targ = {
                  blah1: 1,
                    child: {
                      blah: [
                              {
                                book: {
                                      title: 'Wild Swans',
                                      editions: [1,2,3,4]
                                    }
                                }
                      ]
                    }
                  };

      expected = {
                  parent: [1,2,3,4],
                  value: 2,
                  key: 1,
                  address: "child.blah." + ARRAY_QUERY_ITEM_LABEL() + '.book.editions.' + ARRAY_QUERY_ITEM_LABEL()
                };

      function hasSwansTitle(val){
        return hasText(val.book.title, 'swans');
      }

      function isTwo(val){
        return val === 2;
      }
      result = seekInObj(targ, 'blah', [hasSwansTitle], 'editions', [isTwo], true);
      checkEqual(expected, result, 'multi nested array');

        null property
      targ = {
        prop: null
      };
      result = seekInObj(targ, 'prop');
      checkEqual(null, result, 'null prop');


     */

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
