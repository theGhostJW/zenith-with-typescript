import * as S from '../lib/StringUtils';

function sayHello(name: string): void {
  console.log(S.upperCase(`Hello ${name}!`));
}

sayHello("Bill");