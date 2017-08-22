'use strict';

var Gaze = require('gaze').Gaze;

var gaze = new Gaze('./src/**/*.js');

// Files have all started watching
gaze.on('ready', function(watcher) {
  console.log('Watcher Started');
});

// A file has been added/changed/deleted has occurred
gaze.on('all', function(event, filepath) {
  console.log('Change Detected')
  //const execSync = require('child_process').execSync;
  //var cmd = execSync('yarn test');
  //// const
  const spawn = require( 'child_process' ).spawn,
        child = spawn('yarn.cmd', ['test'], { env : { FORCE_COLOR: true }});

   child.stdout.on( 'data', data => {
      console.log(`${data}`);
   });

   child.stderr.on( 'data', data => {
      console.log( `stderr: ${data}` );
   });

   child.on('exit', function (code, signal) {
     console.log('child process exited with ' +
              `code ${code} and signal ${signal}`);
  });


});

//
//
// const
//     spawn = require( 'child_process' ).spawn,
//     ls = spawn( 'ls', [ '-lh', '/usr' ] );
//
// ls.stdout.on( 'data', data => {
//     console.log( `stdout: ${data}` );
// });
//
// ls.stderr.on( 'data', data => {
//     console.log( `stderr: ${data}` );
// });
//
// ls.on( 'close', code => {
//     console.log( `child process exited with code ${code}` );
// });
