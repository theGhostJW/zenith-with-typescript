import {chk, chkEq, chkEqJson, chkFalse} from '../lib/AssertionUtils';
import * as _ from 'lodash';
import { debug } from '../lib/SysUtils';
import { log } from '../lib/Logging';
import { toTempString } from '../lib/FileUtils';
import child_process from 'child_process'
import ps_node from 'ps-node'
import cp from 'current-processes'
import util from  'util';
import psn from 'psnode'
import fkill from 'fkill'
import async from 'async'


describe('currrentprocesses', () => {

  it('list', () => {
    debug('Before');
    cp.get(function(err, processes) {
        debug('IN');
    var sorted = _.sortBy(processes, 'cpu');
    var top5  = sorted.reverse().splice(0, 5);

    console.log(top5);
  });

  debug('After');
  });

});

describe('spawn', () => {

  it('fkill', () => {
      fkill('firefox.exe').then(() => {
        log('Killed process');
      });
  });

  it('psn', () => {
    psn.list((err, results) => {
                          if (err)
                            throw new Error( err );
                          console.log(results); // [{pid: 2352, command: 'command'}, {...}]
                      });
    debug(prm);
  });

  it('list processes', () => {
    debug('start');
    ps_node.lookup({command:  '.*'}, (err, resultList ) => {

    debug(resultList, 'resultList');
    if (err) {
        throw new Error( err );
    }

      resultList.forEach(( process ) => {
        if( process ){
            log( 'PID: %s, COMMAND: %s, ARGUMENTS: %s', process.pid, process.command, process.arguments );
        }
      });
    });
  });

  it('child_process', () => {

  // let child = child_process.spwn('"C:\\Program Files\\Notepad++\\notepad++.exe"'); - does not work
  // let child = child_process.execFile('"C:\\Program Files\\Notepad++\\notepad++.exe"');  - does not work

//  let child = child_process.exec('"C:\\Program Files\\Notepad++\\notepad++.exe"'); - works
//  let child = child_process.execSync('"C:\\Program Files\\Notepad++\\notepad++.exe"'); - works waits
    //
    // taskkill /im filename.exe /t
    // taskkill /im filename.exe /t

  let processList = child_process.execSync('tasklist', {timeout: 30000}).toString();
  log(processList);
  toTempString(processList);

}).timeout(50000);

});

describe('process', () => {

  it('platform', () => {
    debug(`${process.platform}`, 'This platform is');
  });

  it('file name', () => {
    debug(module.filename, 'module name');
  });

});


describe.skip('defaultsDeep', () => {

  it('complex array', () => {
    let actual = _.defaultsDeep({}, { 'a': [5, 6, 7, 8, 9, {hi: 'hi'}] });
    chkEq({ 'a': [5, 6, 7, 8, 9, {hi: 'hi'}] }, actual);
  });

});
describe.skip('cloneDeep', () => {

  const TARGET = {
                john: {

                        pets: {
                                stompa: 'rabbit',
                                spot: 'dog'
                              }
                       },
                 betty: {
                          pets: {
                                  sooty: [1, 2, 3, 4]
                                }
                       }
               };

  it('pojso', () => {
    let actual = _.cloneDeep(TARGET);
    debug(actual);
    chkEq(TARGET, actual);
  });

  it('pmutation doesn\'t change clone', () => {
    let actual = _.cloneDeep(TARGET);
    let oldName = TARGET.john.pets.stompa;
    actual.john.pets.stompa = 'bear';
    chkEq(oldName, TARGET.john.pets.stompa);
  });

  it('empty array', () => {
    let actual = _.cloneDeep([]);
    chkEq([], actual);
  });

  it(' array', () => {
    let expected = [1, 'hi', 5],
        actual = _.cloneDeep(expected);
    chkEq([1, 'hi', 5], actual);
  });

  it(' array complex', () => {
    let expected = [1, 'hi', {hi: 1, arr: [1, 2, 3, 4]}],
        actual = _.cloneDeep(expected);
    expected[2].hi = 444;
    chkEq([1, 'hi', {hi: 1, arr: [1, 2, 3, 4]}], actual);
  });

  it('number', () => {
    chkEq(4, _.cloneDeep(4));
  });

  it('number', () => {
    chkEq(null, _.cloneDeep(null));
  });
});
