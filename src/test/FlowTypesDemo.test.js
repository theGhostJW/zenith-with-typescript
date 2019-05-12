//@flow

/*
  * Primative
  * literal Types
  * union types
  * mixed
  * any
  * Dealing with nothing
    * undefined
    * null
    * default params
    * return null (prefer this)
    * void
    * map types / object types
      * optional props
      * supertype
  * object / map types
  * array
  * tuple
  * cast
  * type aliases
    * opaque type aliases
 */


//************************** Motivation ***************************

// FRAMEWORK DEMO
// + yarn run testCoverage and look in coverage for html
// + endpoints ~ WebUtilsTestImp.endpoints.js
function fullName(given, last) {
  if (given === 'John'){
    return given + ' The Rampaging Bunny ' + last;
  }
}

// function fullNameTyped(given: string, last: string): string {
//   if (given === 'John'){
//     return given + ' The Rampaging Bunny ' + last;
//   }
// }

// The FUNNEL
// https://www.google.com/url?sa=i&source=images&cd=&cad=rja&uact=8&ved=2ahUKEwiB5eKe-LrbAhWDmJQKHaS8A7YQjRx6BAgBEAU&url=http%3A%2F%2Fvicam.com%2Fsupplies%2Ffilters-funnels%2FFilter-Funnel-105-mm&psig=AOvVaw3Gaaf3N2m_hDjapBv7v8s8&ust=1528233634586915

// Vs Pipe
// https://cdn.shopify.com/s/files/1/0691/2709/products/335i_Catted_DP_B.jpg?v=1484922762

//************************** Primative Types esp Bool ***************************

// https://flow.org/en/docs/types/

//************************** Literal Types & Sum (aka. Union) Types ***************************

//https://flow.org/en/docs/types/literals/

// function getColor(name: "success" | "warning" | "danger"): string {
//   switch (name) {
//     case "success" : return "green";
//     case "warning" : return "yellow";
//     case "danger"  : return "red";
//   }
// }

// Magic string State S&M

//************************** Mixed and Any Types (and cast) ***************************

// Any ~ makes the type system go away
// https://flow.org/en/docs/types/any/
//

// Mixed - must work for every type
// https://flow.org/en/docs/types/mixed/

// cast: for when you know more than they type system
// search moment


//************************** notThereness: undefined null and void and Maybe ***************************

function isBig(num: number = 10000000): boolean {
  return num > 100;
}

function callBig() {
  let v1: boolean = isBig(200),
      //v11: boolean = isBig(10),
      v2: boolean = isBig(),
      v6: boolean = isBig(),
    //  v3: boolean = isBig(null),
      v4: boolean = isBig(undefined);
}

// 1 fix the function
//
// const isBig: number => boolean = n => n > 100
//
// function callBig() {
//   let v1: boolean = isBig(200),
//       v11: boolean = isBig(10),
//       v2: boolean = isBig(4),
//       v3: boolean = isBig(3),
//       v4: boolean = isBig(1);
// }

// 2 - return type - bad

// use maybe / void / optional / default

const showBig : (b: boolean) => string = b => b ? 'BIG' : 'small';

function isBig(num: number): ?boolean {
  if (num > 100)
    return true
  else
    return null
}

// function callBig() {
//   let v1: ?boolean = isBig(200),
//       v11: ?boolean = isBig(10),
//       v2: boolean = isBig(),
//       v3: boolean = isBig(null),
//       v4: ?boolean = isBig(undefined),
//       v5: string = showBig(v4)
// }

// represnt possible absensce as null e.g. boolean | null
function propsNotThere() {

  type Person = {
    given: string,
    last: string
  }

  type BitOfAPerson = $Supertype<Person>;

  let p : BitOfAPerson = {
                      given: 'Janice',
                      dob: '1 Jan 1978'
                   };

   let p1 : BitOfAPerson = {
                     given: 'Janice',
                     last: undefined
                   };

    let p2 : BitOfAPerson = {
                     given: 'Janice',
                     last: null
                   };
}

// Defaulting Values

// function alwaysString(s: ?string): string {
//   return s == null ? 'dafault' : s;
// }

// Object Types
// https://flow.org/en/docs/types/objects/


 //----



// Unsealed
// function unsealed(obj: {}) {
//   let str = obj.hello,
//       str1 = obj.hello == null ? 'HOWDY' :  obj.hello,
//       str2 = obj['hello'] == null ? 'HOWDY' :  obj.hello;
// }
//
// function unsealed(obj: Object) {
//   let str = obj.hello,
//       str1 = obj.hello == null ? 'HOWDY' :  obj.hello,
//       str2 = obj['hello'] == null ? 'HOWDY' :  obj.hello;
// }

// Arrays
// https://flow.org/en/docs/types/arrays/
//

// Tuples
// https://flow.org/en/docs/types/arrays/


// https://flow.org/en/docs/types/aliases/
//

// https://flow.org/en/docs/types/tuples/

// skip - https://flow.org/en/docs/types/opaque-types/


// https://flow.org/en/docs/types/casting/ ~ through any
