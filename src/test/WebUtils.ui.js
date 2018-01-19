// @flow

import {chk, chkEq, chkEqJson, chkFalse, chkExceptionText, chkWithMessage} from '../lib/AssertionUtils';
import { debug } from '../lib/SysUtils';
import { toString } from '../lib/StringUtils';
import { toTemp, toTempString } from '../lib/FileUtils';
import * as _ from 'lodash';
import * as wd from 'webdriverio';
import * as ipc from 'node-ipc';

var title;

function runIt() {
  try {
    browser.url('http://webdriver.io');
    title = browser.getTitle();
    console.log(title + ' 1 - PID:' + toString(process.pid));

    browser.newWindow('http://google.com')
    browser.url('http://google.com')
    title = browser.getTitle();
    console.log(title + ' 2 - PID:' + toString(process.pid));

  } catch (e) {
    debug(e.toString());
    debug(e.stacktrace);
    throw e;
  }
}

describe.only('test cafe play', () => {

  it('interact', () => {
    runIt();
    chkEq('Google', title);
  });

});


function runClient() {
  ipc.config.id = 'uiTest';
  ipc.config.retry = 1000;
  ipc.config.sync= true;

  ipc.connectTo(
      'world',
      function(){
          ipc.of.world.on(
              'connect',
              function(){
                  ipc.log('## started ##', ipc.config.delay);

                  //queue up a bunch of requests to be sent synchronously
                  for(var i=0; i<10; i++){
                      ipc.of.world.emit(
                          'next-Msg',
                          {
                              id      : ipc.config.id,
                              message : 'Next Please'
                          }
                      );
                  }
              }
          );

          ipc.of.world.on(
              'disconnect',
              function(){
                  ipc.log('disconnected from world');
              }
          );

          ipc.of.uiInt.on(
              'app.message',
              function(data){
                  ipc.log('got a message from world : ', data);
              }
          );

          console.log(ipc.of.world.destroy);
      }
  );

}
