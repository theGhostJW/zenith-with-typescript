// @flow

import S from 'string'

/*
  no tin use delete later this is for documentation prrposes only
*/
export function replace(hayStack: ?string, needle: string, replacement: string): ?string {
  if (hayStack == null){
    return hayStack;
  }
  else {
    let result : string = S(hayStack).replaceAll(needle, replacement).s;
    return typeof result == 'string' ? result : 'ERRRROR ' + JSON.stringify(result);
  }
}
