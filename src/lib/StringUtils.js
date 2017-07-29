// @flow

import { def, debug, hasValue } from '../lib/SysUtils';
import S from 'string'

export function standardiseLineEndings(str: string): string {
  var result = replace(str, '\n\r', '\n');
  result = replace(result, '\r\n', '\n');
  result = replace(result, '\r', '\n');
  return result;
}

export function newLine(repeatCount: number = 1): string {
  return "\n".repeat(repeatCount);
}

export function lowerFirst(str: string): string {
  return hasValue(str) ? str.charAt(0).toLowerCase() + str.slice(1): str;
}

export function upperFirst(str: string): string  {
  return hasValue(str) ? str.charAt(0).toUpperCase() + str.slice(1): str;
}

export const upperCase : string => string = (s) => {return s.toUpperCase();}

export const lowerCase : string => string = (s) => {return s.toLowerCase();}

export function appendDelim(str1: ?string, delim: string, str2: ?string){
   str1 = def(str1, "");
   delim = def(delim, "");
   str2 = def(str2, "");

   return (str1 === "" || str2 === "") ? str1 + str2 : str1 + delim + str2;
 };

export function replace(hayStack: string, needle: string, replacement: string, caseSensitive: boolean = false): string {
   // https://stackoverflow.com/questions/7313395/case-insensitive-replace-all

   let esc = needle.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'),
       reg = new RegExp(esc, (caseSensitive ? 'g' : 'ig'));
   return hayStack.replace(reg, replacement);
}

export function wildCardMatch(hayStack: ?string, needle: string, caseSensitive: boolean = false): boolean {
  // https://stackoverflow.com/questions/26246601/wildcard-string-comparison-in-javascript
  return hayStack == null ? false: new RegExp("^" + needle.split("*").join(".*") + "$", (caseSensitive ? undefined :'i')).test(hayStack);
}

export function toString<T>(val : T): string {
  if (val === null)
    return 'null';

  if (val === undefined)
    return 'undefined';

  switch (typeof val) {
    case 'object':
      return JSON.stringify(val);

    case 'boolean':
      return val ? 'true' : 'false';

    case 'number':
      return val.toString();

    case 'string':
        return val;

    case 'function':
      return val.toString();

    default:
      return `<<${typeof val}>>`;
  }
}

export function startsWith(str: ?string, preFix: string) : boolean {
  return str != null ? str.indexOf(preFix) === 0 : false;
}


export function endsWith(str: ?string, suffix: string) {
  return str != null ?  str.indexOf(suffix, str.length - suffix.length) !== -1 : false;
}

export function hasText(hayStack: ?string, needle: string, caseSensitive: boolean = false): boolean {
  return hayStack == null ? false :
                            caseSensitive ? hayStack.includes(needle) :
                                            hayStack.toLowerCase().includes(needle.toLowerCase()) ;
}
