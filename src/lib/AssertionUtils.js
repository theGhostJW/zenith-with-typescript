// @flow

import * as _ from 'lodash';

export function chk(val : boolean, msg : string = '') {
  if (!val) {
    throw new Error('chk failure ' + msg);
  }
}

export function chkFalse(val : boolean, msg : string = '') {
  chk(!val, msg);
}

export function chkEq(val1 : any, val2 : any, msg : string = '') : void {
  if ( !_.isEqual(val1, val2)) {
    throw new Error(val1 + ' did not equal ' + val2 + ' ' + msg);
  }
}

export function chkEqJson(val1 : {}, val2 : {}, msg : string = '') : void {
  let v1 = JSON.stringify(val1),
    v2 = JSON.stringify(val2);

  if (v1 !== v2) {
    throw new Error(v2 + 'did not equal expected ' + v1)
  };
}
