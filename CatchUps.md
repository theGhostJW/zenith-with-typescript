# Tour De HOF ii

```javascript

/*
********************************************************************************************************
********************************* Same, Same, Same but Different ****************************************
********************************************************************************************************
*/

/*** LAST WEEK ***/
['lazy', 'sleepy', 'happy', 'grumpy', 'dopy', 'lofty'].every(n => n.length > 3)

/*** THIS WEEK ***/
let _ = require('lodash');
_.every(['lazy', 'sleepy', 'happy', 'grumpy', 'dopy', 'lofty'], n => n.length > 3)

// e.g. 2
let _ = require('lodash');
_.each(['lazy', 'sleepy', 'happy', 'grumpy', 'dopy', 'lofty'], console.log)

['lazy', 'sleepy', 'happy', 'grumpy', 'dopy', 'lofty'].forEach(console.log)
/*
  * for arrays Lodash has:
                * each
                * map
                * reduce
                * find
                * includes
                * some
                * filter

   WHY and which to choose ??
*/

/*
********************************************************************************************************
************************************************* Objects **********************************************
********************************************************************************************************
*/

const obj = {       
              jill: {
                      gender: 'F',
                      pets: ['spot', 'peppa']
                    },

              jack:  {
                      gender: 'M',
                      pets: ['flopsy']
                    },
              boPeep: {
                gender: 'F',
                pets: ['snowdrop']
              },
              mary: {
                gender: 'F',
                pets: ['baba']
              },
              'tommy stout': {
                gender: 'M',
                pets: ['salina', 'sarrena', 'tom']
              }
            };

const pets = c => c.pets;

//obj.map(pets)
let _ = require('lodash');
//_.map(obj, pets);
_.map(obj, 'pets');

/*
********************************************************************************************************
************************************************* ZOOM IN  ********************************************
*/
const obj = { jill: {gender: 'F', pets: ['spot', 'peppa']  },
              jack:  { gender: 'M', pets: ['flopsy']  },
              boPeep: {gender: 'F', pets: ['snowdrop']},
              mary: {gender: 'F',pets: ['baba'] },
              'tommy stout': {gender: 'M',pets: ['salina', 'sarrena', 'tom']}};

const gender = (value, key, object) => {
  console.log(k);
//  console.log(v);
//  console.log(JSON.stringify(o));
  return v.gender;
};

let _ = require('lodash');
_.map(obj, gender);

/*
********************************************************************************************************
***********************************I******** Put it Together *********************************************
********************************************************************************************************
*/

const obj = { jill: {gender: 'F', pets: ['spot', 'peppa']  },
              jack:  { gender: 'M', pets: ['flopsy']  },
              boPeep: {gender: 'F', pets: ['snowdrop']},
              mary: {gender: 'F',pets: ['baba'] },
              'tommy stout': {gender: 'M',pets: [['salina'], 'sarrena', ['tom']]}};

let _ = require('lodash');

let boys = _.filter(obj, p => p.gender === 'M'),
    boysPets = _.map(boys, 'pets'),
    result = _.flatten(boysPets);

 result;

 /*
 ********************************************************************************************************
 ***********************************I******** Map Values *********************************************
 ********************************************************************************************************
 */

 const obj = { jill: {gender: 'F', pets: ['spot', 'peppa']  },
               jack:  { gender: 'M', pets: ['flopsy']  },
               boPeep: {gender: 'F', pets: ['snowdrop']},
               mary: {gender: 'F',pets: ['baba'] },
               'tommy stout': {gender: 'M',pets: ['salina', 'sarrena', 'tom']}};

 let _ = require('lodash');
 _.mapValues(obj, 'gender')
//_.mapValues(obj, p => p.pets.length)

// Note Object => Object


/*
********************************************************************************************************
***********************************I******** Array <=//=> Object ***************************************
********************************************************************************************************
*/

const obj = { jill: {gender: 'F', pets: ['spot', 'peppa']  },
              jack:  { gender: 'M', pets: ['flopsy']  },
              boPeep: {gender: 'F', pets: ['snowdrop']},
              mary: {gender: 'F',pets: ['baba'] },
              'tommy stout': {gender: 'M',pets: ['salina', 'sarrena', 'tom']}};

 let _ = require('lodash');
_.pairs(obj); // _.toPairs

/******************* NOT VERKING **************/

let _ = require('lodash');
_.fromPairs([['jill ', {gender: 'F', pets: ['spot', 'peppa']  }], ['jack ', { gender: 'M', pets: ['flopsy']  }]]);

/*
********************************************************************************************************
***************************************I************ Keys **********************************************
********************************************************************************************************
*/

const obj = { jill: {gender: 'F', pets: ['spot', 'peppa']  },
              jack:  { gender: 'M', pets: ['flopsy']  },
              boPeep: {gender: 'F', pets: ['snowdrop']},
              mary: {gender: 'F',pets: ['baba'] },
              'tommy stout': {gender: 'M',pets: ['salina', 'sarrena', 'tom']}};

let _ = require('lodash');
_.keys(obj);

/*
********************************************************************************************************
***************************************I************ Values **********************************************
********************************************************************************************************
*/

const obj = { jill: {gender: 'F', pets: ['spot', 'peppa']  },
              jack:  { gender: 'M', pets: ['flopsy']  },
              boPeep: {gender: 'F', pets: ['snowdrop']},
              mary: {gender: 'F',pets: ['baba'] },
              'tommy stout': {gender: 'M',pets: ['salina', 'sarrena', 'tom']}};

let _ = require('lodash');
_.values(obj)



/*
********************************************************************************************************
********************************************** O.S.I.D.N.T.D.T ****************************************
********************************************************************************************************
  Functions you could write yourself but don't need to:
    => read the docs
*/

/*
********************************************************************************************************
***************************************** Partition / Group By ****************************************
********************************************************************************************************
*/

let _ = require('lodash');
_.partition([1, 2, 3, 4], n => n % 2);


const obj = { jill: {gender: 'F', pets: ['spot', 'peppa']  },
              jack:  { gender: 'M', pets: ['flopsy']  },
              boPeep: {gender: 'F', pets: ['snowdrop']},
              mary: {gender: 'F',pets: ['baba'] },
              'tommy stout': {gender: 'M',pets: ['salina', 'sarrena', 'tom']}};

let _ = require('lodash');
_.groupBy(obj, c => c.name[0]);


/*
********************************************************************************************************
***************************************** Reject Inverse of filter *************************************
********************************************************************************************************
*/

let _ = require('lodash');
let odds = _.reject([1, 2, 3, 4], n => n % 2);
odds;

/*
********************************************************************************************************
***************************************** Flatten *************************************
********************************************************************************************************
*/

// Note - library function force array does something similar
let _ = require('lodash');
_.flatten([[1, 2, 3, 4], [1, 2, 3], [[2, 4, 6, 8]], [5]]);

let _ = require('lodash');
_.flattenDeep([[1, 2, 3, 4], [1, 2, 3], [[2, 4, 6, 8]], [5]]);


/*
********************************************************************************************************
********************************************* Chaining ************************************************
********************************************************************************************************
*/

// Method Vs Function

let _ = require('lodash');
_.forEach(['this', 'is','the', 'day', 'your', 'life', 'will', 'surely', 'change'], console.log);

['this', 'is','the', 'day', 'your', 'life', 'will', 'surely', 'change'].forEach(console.log);


['this', 'is','the', 'day', 'your', 'life', 'will', 'surely', 'change']
                                                  .map(s => s.toUpperCase())
                                                  .filter(s => s !== 'YOUR')
                                                  .forEach(console.log);


let _ = require('lodash');
_.map(['this', 'is','the', 'day', 'your', 'life', 'will', 'surely', 'change'], s => s.toUpperCase())
                                                                          .filter(s => s !== 'YOUR')
                                                                          .forEach(console.log);


let _ = require('lodash');
_.map(['this', 'is','the', 'day', 'your', 'life', 'will', 'surely', 'change'], s => s.toUpperCase())
                                                                          .reject(s => s === 'YOUR')
                                                                          .forEach(console.log);

let _ = require('lodash');
_.chain(['this', 'is','the', 'day', 'your', 'life', 'will', 'surely', 'change'])
                  .map(s => s.toUpperCase())
                  .reject(s => s === 'YOUR')
                  .forEach(console.log)
                  .value();

// Don't forget to unwrap it !!!

let _ = require('lodash');
_.chain(['this', 'is','the', 'day', 'your', 'life', 'will', 'surely', 'change'])
                  .map(s => s.toUpperCase())
                  .reject(s => s === 'YOUR')
                  .forEach(console.log);

/*
********************************************************************************************************
******************************************* Big Chain ****************************************
********************************************************************************************************
*/

let people = [
          {
            first: 'bill',
            last: 'baxter',
            gender: 'M',
            children: {
                        jill: {
                                gender: 'F',
                                pets: ['spot', 'peppa']
                              },

                        jack:  {
                                gender: 'M',
                                pets: ['flopsy']
                              }
                        }
          }
          ,

          {
            first: 'hellen',
            last: 'earth',
            gender: 'M',
            children: {
                        james: {
                                gender: 'M',
                                pets: ['spacky']
                              },

                        george:  {
                                gender: 'M'
                              }
                        }
          },

          {
            first: 'jill',
            last: 'chin',
            gender: 'F'
          }
    ];



let people = [{first: 'bill', last: 'baxter', gender: 'M', children: { jill: {gender: 'F',  pets: ['spot', 'peppa']},  jack:  {gender: 'M', pets: ['flopsy']  }, ernie:  {gender: 'M'}}},
              {first: 'hellen',last: 'earth', gender: 'M', children: { james: {gender: 'M', pets: ['spacky']}, george:  {gender: 'M'}}}];

// can use tap here
let _ = require('lodash');
_.chain(people)
           .map('children')
           .values()
           .map(_.values)
           .flatten()
            .tap(v => console.log(JSON.stringify(v)))
           .map('pets')
           .compact()
           .flatten()
           .forEach(console.log)
           .value();


// FINALLY HAS SOMEONE DONE THIS BEFORE ??? => RTFM

/*
********************************************************************************************************
************************************* Working Around Mutability ****************************************
********************************************************************************************************
*/


let _ = require('lodash'),
    child  = {first: 'doogy', last: 'housa', gender: 'M', pets: {spot: 'dog', felix: 'cat'}},
    changeFelix = c => {
                          c.pets.felix = 'dog';
                          c.first = 'felix';
                          return c
                        };
 changeFelix(child);
 //
 child;  

 let _ = require('lodash'),
     child  = {first: 'doogy', last: 'housa', gender: 'M', pets: {spot: 'dog', felix: 'cat'}},
     changeFelix = o => {
                          let c = _.clone(o)
                           c.pets.felix = 'dog';
                           c.first = 'felix';
                           return c
                         };
  changeFelix(child);
  //
  child;


  let _ = require('lodash'),
      child  = {first: 'doogy', last: 'housa', gender: 'M', pets: {spot: 'dog', felix: 'cat'}},
      changeFelix = o => {
                           let c = _.cloneDeep(o);
                            c.pets.felix = 'dog';
                            c.first = 'felix';
                            return c
                          };
   changeFelix(child);
   //
   child;


/*
********************************************************************************************************
************************************************** Pick ***********************************************
********************************************************************************************************
*/

let  _ = require('lodash'),
     object = { given: 'Janice', surname: 'Peterson', birthYear: 1977, occupation: 'News Presneter' };
_.pick(object, ['given', 'surname']);



/*
********************************************************************************************************
************************************************** Pick ***********************************************
********************************************************************************************************
*/

let  _ = require('lodash'),
     objects = [
                  { given: 'Janice', surname: 'Peterson', birthYear: 1977, occupation: 'News Presneter' },
                  { given: 'Tamara', surname: 'Oudyn', birthYear: 1977, occupation: 'News Presneter' },
                  { given: 'Guy', surname: 'Stayner', birthYear: '????', occupation: 'New Presneter' }
              ];
_.map(objects, 'given');   
// note the difference to ES6
//objects.map('given');    






```

# Tour De HOF i

```javascript

function thisIsBad(arr){
  for (var counter = 0; counter < arr.length ; counter++){
    if (x){
      for (var counter = 0; counter < 50; counter++){
        if (a){
          if (c)
            doSomething();
        }
        else {
            if (k)
              break;
            doSomethingElse();
        }
      }
     }
     else {
      for (var counter = 0; counter < 50; counter++){
        if (a){
          doAnotherThing();
        }
        else {
          doYetAnotherThing()
        }
      }
   }
  }
}

```
## HOFs
## underscore -> lodash + ES6

## ES6 ~ Arrays

```javascript

/*
*************************************************************************************************
********************************* forEach ~ side effects ****************************************
*************************************************************************************************
*/

['lazy', 'sleepy', 'happy', 'grumpy', 'dopy'].forEach(console.log)

/*
*************************************************************************************************
**************************************** find  **************************************************
*************************************************************************************************
*/

function functionName(name) {
  return name.startsWith('h')
}
['lazy', 'sleepy', 'happy', 'grumpy', 'dopy', 'lofty'].find(n => n.startsWith('h'))
['lazy', 'sleepy', 'happy', 'grumpy', 'dopy', 'lofty'].find(n => n.startsWith('r'))

/*
*************************************************************************************************
**************************************** includes **************************************************
*************************************************************************************************
*/

// not a HOF
['lazy', 'sleepy', 'happy', 'grumpy', 'dopy', 'lofty'].includes('dopy')
['lazy', 'sleepy', 'happy', 'grumpy', 'dopy', 'lofty'].includes('nazelly')


/*
*************************************************************************************************
**************************************** some **************************************************
*************************************************************************************************
*/

['lazy', 'sleepy', 'happy', 'grumpy', 'dopy', 'lofty'].some(n => n.includes('i'))

// same as
function hasAni(str) {
  return str.includes('i')
}
['lazy', 'sleepy', 'happy', 'grumpy', 'dopy', 'lofty'].some(hasAni);

const hasi = n => n.includes('i');
['lazy', 'sleepy', 'happy', 'grumpy', 'dopy', 'lofty'].some(hasi);

/*
*************************************************************************************************
**************************************** all **************************************************
*************************************************************************************************
*/

['lazy', 'sleepy', 'happy', 'grumpy', 'dopy', 'lofty'].every(n => n.length > 3)

['lazy', 'sleepy', 'happy', 'grumpy', 'dopy', 'lofty'].every(n => n.length > 4)

// note the repetition
function longerThan(minLength) {
  return function isLonger(str) {
    return str.length > minLength
  }
}

unction isLonger(str) {
  return str.length > 4
}

['lazy', 'sleepy', 'happy', 'grumpy', 'dopy', 'lofty'].every(longerThan(3));

['lazy', 'sleepy', 'happy', 'grumpy', 'dopy', 'lofty'].every(longerThan(4));

//
//

function longerThan(minLength) {
  return function isLonger(str) {
    return str.length > minLength
  }
}

const longerThan = ml => s => s.length > ml;

['lazy', 'sleepy', 'happy', 'grumpy', 'dopy', 'lofty'].some(longerThan(4));
['lazy', 'sleepy', 'happy', 'grumpy', 'dopy', 'lofty'].every(longerThan(4));

/*
*************************************************************************************************
**************************************** sort **************************************************
*************************************************************************************************
*/

// Note limited - in place ~ not a HOF
let d = ['lazy', 'sleepy', 'happy', 'grumpy', 'dopy', 'lofty'];
d.sort();
d

/*
*************************************************************************************************
**************************************** filter **************************************************
*************************************************************************************************
*/

const dwarfs = ['lazy', 'sleepy', 'happy', 'grumpy', 'lofty']
let lDwafs = dwarfs.filter(n => n.startsWith('l'));
lDwafs
dwarfs

console.log('=== All Dwarfs ===')
dwarfs.forEach(console.log)

console.log('=== L Dwarfs ===')
lDwafs.forEach(console.log)

console.log('=== L Dwarfs Chained ===')
dwarfs
    .filter(n => n.startsWith('l'))
    .forEach(console.log)

/*
*************************************************************************************************
**************************************** map **************************************************
*************************************************************************************************
*/

// Shouty Dwarfs
 ['lazy', 'sleepy', 'happy', 'grumpy', 'dopy', 'lofty'].map(n => `${n.toUpperCase()} !!!!`)

 // Chained Shouty Long Name Dwarfs
  ['lazy', 'sleepy', 'happy', 'grumpy', 'dopy', 'lofty']
                            .filter(n => n.length > 4)
                            .map(n => `${n.toUpperCase()} !!!!`)
                            .forEach(console.log)

/*
********************************************************************************
*********************************** reduce *************************************
********************************************************************************
*/

 // many -> one

function addToObj(accum, dwarf) {
  accum[dwarf] = dwarf.length;
  return accum;
}
['lazy', 'sleepy', 'happy', 'grumpy', 'dopy', 'lofty'].reduce(addToObj, {});

// Roll your own max

['lazy', 'slee', 'happy', 'grmpy', 'dopy', 'lofty'].reduce(
                        (ml, d) => d.length > ml ? d.length : ml, 0);

var _ = require('lodash');
// this doees not work will return to this next week (with proper imports)
_.maxBy(['lazy', 'sleepy', 'happy', 'grumpy', 'dopy', 'lofty'], d => d.length);


```

# Tour De ZWTF ~ ???

# Tour De ES6 ~ 07-03-2018

Run using console.js ~ see also ES6 Google Slides
```javascript

/*
  Packages
 */

import * as sysU from '../lib/SysUtils';
import {fail, objToYaml, debug, def, ensureHasVal, hasValue} from '../lib/SysUtils';
import * as _ from 'lodash';               // import from node Modules
import { transform } from 'lodash';       // import from node Modules
import moment from 'moment';            // default import from node Modules

/*
*******************************************************************************
********************************* LET ****************************************
*******************************************************************************
*/

var greeting
if (true) {
  greeting = 'Hello'
}
greeting;


if (true) {
  let greeting = 'Hello'
  greeting;
}

/*
*******************************************************************************
****************************  CONSTANTS **************************************
*******************************************************************************
 */

const defaultFirstName = 'Barry';
defaultFirstName = 'Garry';

//------------------------------------------------------------

const defaultName = {
  given: 'Barry',
  surname: 'Smith'
};

defaultName.given = 'Garry';
defaultName.middle = 'Larry';
defaultName;


/*
*******************************************************************************
******************************** Params ***************************************
*******************************************************************************
 */

//---- default Params

function bestPony(name = 'Fluttershy') {
  return name + ' is best pony'
}
bestPony()

//
function bestPony(name = 'Fluttershy') {
  return name + ' is best pony'
}
bestPony('Pinky Pie')


//---- default Params II

function bestPonies(pony1 = 'Fluttershy', pony2 = 'Pinky Pie') {
  return pony1 + ' and ' + pony2 + ' are best ponies'
}
bestPonies()

//
function bestPonies(pony1 = 'Fluttershy', pony2 = 'Pinky Pie') {
  return pony1 + ' and ' + pony2 + ' are best ponies'
}
bestPonies(undefined, 'Bon Bon')

//
function bestPonies(pony1 = 'Fluttershy', pony2 = 'Pinky Pie') {
  return pony1 + ' and ' + pony2 + ' are best ponies'
}
bestPonies('Bon Bon', 'Sparkle')

//---- rest Params

function bestPoniesWithArray(ponies){
  // DO NOT WRITE CODE LIKE THIS
  let result = [];
  for (let i = 0; i < ponies.length; i++) {
    result.push(ponies[i] + ' is best pony !')
  }
  return result.join(' AND ');
}
bestPoniesWithArray(['Bon Bon', 'Sparkle', 'Fluttershy']);

// with rest
function bestPoniesWithRest(...ponies){
  // DO NOT WRITE CODE LIKE THIS
  let result = [];
  for (let i = 0; i < ponies.length; i++) {
    result.push(ponies[i] + ' is best pony !')
  }
  return result.join(' AND ');
}
bestPoniesWithRest('Bon Bon', 'Sparkle', 'Fluttershy');

// --- trailing

function bestPoniesWithRest(suffix, ...ponies){
  // DO NOT WRITE CODE LIKE THIS
  let result = [];
  for (let i = 0; i < ponies.length; i++) {
    result.push(ponies[i] + ' is best pony ' + suffix)
  }
  return result.join(' AND ');
}
bestPoniesWithRest('!!!!!!!', 'Bon Bon', 'Sparkle', 'Fluttershy');

//--------- Spread and Rest

function bestPoniesLogWithArray(ponies){
  // DO NOT WRITE CODE LIKE THIS
  let result = [];
  for (let i = 0; i < ponies.length; i++) {
    console.log((ponies[i] + ' is best pony !'))
  }
}

function bestPoniesWithRest(suffix, ...ponies){
  // DO NOT WRITE CODE LIKE THIS
  let result = [];
  for (let i = 0; i < ponies.length; i++) {
    result.push(ponies[i] + ' is best pony ' + suffix)
  }
  return result.join(' AND ');
}

function ponyProcessing(...ponies) {
  bestPoniesLogWithArray(ponies);
  return bestPoniesWithRest(':-)', ...ponies)
}

ponyProcessing('Bon Bon', 'Sparkle', 'Fluttershy');


/*
*******************************************************************************
*************************** DESTRUCTION ***************************************
*******************************************************************************
 */

// ---- Object Destructor

const tanks2 = {
   choice1: 'Tiger Tank',
   choice2: 'Panther Tank'
}

function destroyTanksObj(tanks) {
  let {
       choice1,
       choice2
      } =  tanks;

   return 'My favourite tanks:  ' + choice1 + ' and  ' + choice2;
}
destroyTanksObj(tanks2);

// ---- Object Destructor + Defaults

const tanks2 = {
   choice1: 'Tiger Tank',
   choice2: 'Panther Tank'
}

function destroyTanksObj(tanks) {
  let {
       choice1 = 'Sturmgeschütz III',
       choice2 = 'Panzer IV',
       choice3 = 'M18 Hellcat'
      } =  tanks;

   return 'My favourite tanks:  ' + choice1 + ' and  ' + choice2  + ' and ' + choice3;
}
destroyTanksObj(tanks2);

//--- Same works for arrays
// ---- Object Destructor

const tanksArr2 = [
    'Tiger Tank',
    'Panther Tank'
];

function destroyTanksObj(tanksArr2) {
  let [
       choice1,
       choice2
      ] =  tanksArr2;

   return 'My favourite tanks:  ' + choice1 + ' and  ' + choice2;
}
destroyTanksObj(tanksArr2);

// ---- Object Destructor + Defaults

const tanksArr2 = [
   'Tiger Tank',
   'Panther Tank'
]

let [
       choice1 = 'Sturmgeschütz III',
       choice2 = 'Panzer IV',
       choice3 = 'M18 Hellcat',
       choice4
      ] =  tanksArr2;

'My favourite tanks:  ' + choice1 + ' and  ' + choice2  + ' and ' + choice3  + ' and ' + choice4;

/*
*******************************************************************************
****************************** String Functions ******************************
*******************************************************************************
 */

//-- Multi-Line Strings

const myBigString = `
  Hello
  i am
  very
  pleased to use this very big string
`;

myBigString;

//------ Template Strings

let name = 'Sparkle',
    age = 5,
    tank = 'M18 Hellcat'

const myBigString = `
  Hello my name ${name}
  i am ${age} years old and
  i am very fond of ${tank}s
`;

myBigString;


 /*
 *******************************************************************************
 ******************* New Array / Object Functions ******************************
 *******************************************************************************
  */

//--- Real Constants
const obj = Object.freeze({p1: 'Spakle', p2: 'Fluttershy'});
obj.p1 = 'Pinky Pie';
obj;

//-- Our Underscore Friends Have Gone Native - Bring Back the Ponies

let ponies = [
            'Fluttershy',
            'Pinky Pie',
            'Bon Bon',
            'Sparkle'
          ];

function len(word){
  return word.length;
}

ponies.map(len);

//

let ponies = [
            'Fluttershy',
            'Pinky Pie',
            'Bon Bon',
            'Sparkle'
          ];

function isSevenLong(word){
  return word.length === 7;
}
ponies.find(isSevenLong);

/*
Also:
    * reduce()
    * some()
    * every()
 */


 let ponies = [
             'Fluttershy',
             'Pinky Pie',
             'Bon Bon',
             'Sparkle'
           ];


 ponies.map(function(word){return word.length;});

 // Total Letters

let ponies = [
             'Fluttershy',
             'Pinky Pie',
             'Bon Bon',
             'Sparkle'
           ];


 ponies.reduce(function(acc, word){return acc + word.length;}, 0);


 //

 let ponies = [
             'Fluttershy',
             'Pinky Pie',
             'Bon Bon',
             'Sparkle'
           ];

 ponies.find(function (word){return word.length === 7;});


//--- Arrow Functions


let ponies = [
            'Fluttershy',
            'Pinky Pie',
            'Bon Bon',
            'Sparkle'
          ];


ponies.map(w => w.length);

//

let ponies = [
            'Fluttershy',
            'Pinky Pie',
            'Bon Bon',
            'Sparkle'
          ];

ponies.find(w => w.length === 7);

//

let ponies = [
            'Fluttershy',
            'Pinky Pie',
            'Bon Bon',
            'Sparkle'
          ];

ponies.reduce((l, w) => l + w.length, 0);

```

# Tour De Atom ~ 27-02-2018

## Screenshots and OSS Power
  * Screenshots manual test
  * Powered by browser + Greenshot + Ctrl-Shift-PrintScreen

## Plugins Makith the Experience
  * Electron >> Atom >> Plugins
  * Settings >> Drill into plug in
    * Simple >> Quickstep
    * Complex >> Nuclide
  * Observe the bottom boarder to see plugins
  * Other Notable Packages
    * Minimap
    * splitDiff


## Shortcuts
  * *GetYourHandOffIt*
    * TestComplete >> ... >> Atom >> ... >> EMacs / Vim
    * Ctrl-Shift-P - is the key
      * e.g terminal
      * Show / hide file tree
      * omni search
      * find\
      * overview
    * key binding resolver
      * You are in control >> Key map

## Screen Splitting

## Snippets
  * from packages
  * custom

## Node Projects and Structure
  * project file
  * custom
