

const _ : _.LoDashStatic = require('lodash');

function testLodash(): number[] {
  //console.log(S.upperCase(`Hello ${name}!`));
  function square(n: number) {
    return n * n;
  }
   

  return _.map([4, 8], square);
}
