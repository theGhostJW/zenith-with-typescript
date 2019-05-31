exports.config = {
  // framework: 'mocha',
  // mochaOpts: {
  //     timeout: 100000000
  // }
  before: function() {
    require('ts-node').register({ files: true });
  }
}

// Cause all of our Selenium scripts to get transpiled by Babel in real-time into full ES6,
// running on Node.js. Allow generator calls to directly go through, since Node.js has efficient
// support for those.
//require('ts-node/register')({
//});
