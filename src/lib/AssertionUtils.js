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


//ToDo: move to string utils
function toString(val : mixed){
  if (val === null)
    return 'null';

  if (val === undefined)
    return 'undefined';

  switch (typeof val) {
    case 'object':
      return val.toString();

    case 'boolean':
      return val ? 'true' : 'false';

    case 'number':
      return val.toString();

    case 'string':
        return val;

    case 'function':
      return 'function';

    default:
      return 'value cannot be represented as string'
  }
}


export function chkEq(val1 : mixed, val2 : mixed, msg : string = '') : void {
  if ( !_.isEqual(val1, val2)) {
    throw new Error(toString(val1) + ' did not equal ' + toString(val2) + ' ' + msg);
  }
}

export function chkEqJson(val1 : {}, val2 : {}, msg : string = '') : void {
  let v1 = JSON.stringify(val1),
    v2 = JSON.stringify(val2);

  if (v1 !== v2) {
    throw new Error(v2 + 'did not equal expected ' + v1)
  };
}
