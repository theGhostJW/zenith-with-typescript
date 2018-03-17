'use strict';


const spawn = require( 'child_process' ).spawn,
      child = spawn('yarn.cmd', ['run', 'endPoints'], { env : { FORCE_COLOR: true }});

 child.stdout.on( 'data', data => {
    console.log(`${data}`);
 });

 child.stderr.on( 'data', data => {
    console.log( `${data}` );
 });

 child.on('exit', function (code, signal) {
   console.log('child process exited with ' +
            `code ${code} and signal ${signal}`);
});
