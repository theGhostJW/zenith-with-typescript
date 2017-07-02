// @flow

export function toString(val : mixed){
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
      return val.toString();

    default:
      return 'value cannot be represented as string'
  }
}

export function startsWith(str: ?string, preFix: string) : boolean {
  return str != null ? str.indexOf(preFix) === 0 : false;
}


export function endsWith(str: ?string, suffix: string) {
  return str != null ?  str.indexOf(suffix, str.length - suffix.length) !== -1 : false;
}
