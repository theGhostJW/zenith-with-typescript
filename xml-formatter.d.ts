// Type definitions for xml-formatter [~OPTIONAL VERSION NUMBER~]
// Project: JW
// Definitions by: me <[~A URL FOR YOU~]>

/*~ This is the module template file. You should rename it to index.d.ts
 *~ and place it in a folder with the same name as the module.
 *~ For example, if you were writing a file for "super-greeter", this
 *~ file should be 'super-greeter/index.d.ts'
 */

/*~ If this module is a UMD module that exposes a global variable 'myLib' when
 *~ loaded outside a module loader environment, declare that global here.
 *~ Otherwise, delete this declaration.
 */

 declare module 'xml-formatter' {
  export function format(xml: string, options: any): string;
 }


