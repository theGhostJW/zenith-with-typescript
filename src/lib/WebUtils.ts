import {
  combine,
  fileOrFolderName,
  fromTemp,
  pathExists,
  projectDir,
  tempFileExists,
  testCaseFile,
  toTemp,
  toTempString,
} from './FileUtils';

import {log} from './Logging';

import { hasText, lowerCase, newLine, sameText,
         show, trim, trimLines, upperFirst,
         wildCardMatch } from './StringUtils';
import {
        areEqual, callstackStrings, def, ensure,
         ensureHasVal, ensureReturn, fail, 
        filePathFromCallStackLine, forceArray, functionNameFromFunction,
        hasValue, isNullEmptyOrUndefined, isSerialisable,
        stringConvertableToNumber
      } from './SysUtils';

import { disconnectClient, interact,
          isConnected,  launchWdioServerDetached, launchWebInteractor,
          runClient, stopSession, waitConnected,
          killGeckoDriver } from './WebLauncher';

const clipBoardy = require('clipboardy');

const _ = require('lodash')

// import sp from 'step-profiler';
// let prof = new sp({});


export type SelectorOrElement = string | Element;
// an incomplete type safe facade over element
export interface Element {
  getText: () => string,
  getValue: () => string,
  getTagName: () => string,
  getLocation: () => {x: number, y: number},
  getElementSize: () => {width: number, height: number},
  getHTML: () => string,
  getAttribute: (s:string) => string | undefined,
  isSelected: () => boolean,
  isDisplayed: () => boolean,
  isDisplayedInViewport: () => boolean,
  click: () => void,
  setValue: (s:string) => void,
  selectByVisibleText: (text: string)  => void,
  selectByValue: (value:string)  => void,
  selectByAttribute: (attribute: string, value: string)  => void,
  $$: (css:string) => Element[],
  $: (css:string) => Element
}

/* All existing - review again when moved to TS - I think element exists 
element

    addValue
    clearValue
    click
    doubleClick
    dragAndDrop
    getAttribute
    getCSSProperty
    getHTML
    getLocation
    getProperty
    getSize
    getTagName
    getText
    getValue
    isDisplayed
    isDisplayedInViewport
    isEnabled
    isExisting
    isFocused
    isSelected
    moveTo
    saveScreenshot
    scrollIntoView
    selectByAttribute
    selectByIndex
    selectByVisibleText
    setValue
    shadow$$
    shadow$
    touchAction
    waitForDisplayed
    waitForEnabled
    waitForExist
    waitUntil

*/

export const S : (selectorOrElement: SelectorOrElement) => Element = selectorOrElement => (typeof(selectorOrElement) === "string") 
                                                                          ? $(selectorOrElement) 
                                                                          : <any>ensureReturn(isElement(selectorOrElement), selectorOrElement, `${JSON.stringify(selectorOrElement)} is not a string or Element`);


export const SS: (css:string) => Element[] = css => <any>$$(css);

/*
********************************************************************************
******************************* Grid Utils *************************************
********************************************************************************
 */

export type SimpleCellFunc<T> = (cell: Element, rowIndex: number, colIndex: number, row: Element) => T;
export type CellFunc<T> = (cell: Element, colTitle: string, rowIndex: number, colIndex: number, row: Element) => T;
export type ReadResult = boolean | string | null;

type LookUpDef = {
  findVals: {[k:string]: ReadResult},
  setVals: {[k:string]: ReadResult}
}

type LookUpTarget = {
  findElements: {[k:string]: Element},
  setElements: {[k:string]: Element}
}

function generateLookupObjs(lookupCols: string[], dataCols: string[], columnDefs: string[],  data: ReadResult[][]): LookUpDef[] {
  let allFields = columnDefs.map(s => s.startsWith('~') ? s.slice(1) : s),
      lookupSet = new Set(lookupCols),
      dataSet = new Set(dataCols);

  function makeDef(rrs: ReadResult[], idx: number): LookUpDef {

    function updateDef(accum: LookUpDef, rr: ReadResult, idx: number): LookUpDef {
      let propName = allFields[idx];
      if (lookupSet.has(propName)){
        accum.findVals[propName] = rr;
      }

      if (dataSet.has(propName)){
        accum.setVals[propName] = rr;
      }

      return accum;
    }

    return rrs.reduce(updateDef, {
                                  findVals: {},
                                  setVals: {}
                                });
  }

  return data.map(makeDef);
}

function generateLookupTargets(tableSelector: SelectorOrElement, lookupCols: string[], dataCols: string[], visibleOnly: boolean): LookUpTarget[] {
  let lookupSet = new Set(lookupCols),
      dataSet = new Set(dataCols),
      result = <LookUpTarget[]>[],
      active: LookUpTarget = {
        findElements: {},
        setElements: {}
      };

   function accumTarget(cell: Element, colTitle: string, rowIndex: number, colIndex: number, row: Element): void {
     if (colIndex == 0){
       active = {
         findElements: {},
         setElements: {}
       };
       result.push(active);
     }

     if (lookupSet.has(colTitle)){
       active.findElements[colTitle] = cell;
     }

     if (dataSet.has(colTitle)){
       active.setElements[colTitle] = cell;
     }
   }

   mapCells(tableSelector, accumTarget, visibleOnly);
   return result;
}

function doTableSet(lookUpDefs: LookUpDef[], lookupTargets: LookUpTarget[]) {

  function setIfMatchesLookup(target: LookUpTarget) {
    let targVals: {[k:string]: ReadResult} = {},
        {findElements, setElements} = target;

    function targVal(propName: string) {
      let result = targVals[propName];
      if (result === undefined){
        let targeElement = findElements[propName];
        result = read(targeElement);
        targVals[propName] = result;
      }
      return result;
    }

    function defMatchesTarget(lDef: LookUpDef): boolean {
      let lkups = lDef.findVals;
      return _.chain(lkups)
              .keys()
              .every((k:any) => areEqual(lkups[k], targVal(k)))
              .value()
    }

    let matchingDef = lookUpDefs.find(defMatchesTarget);
    if (matchingDef != null){
      let newVals = matchingDef.setVals;
      function setTarget(val: any, key: any) {
        set(setElements[key], val);
      }

      _.each(newVals, setTarget)
    }
  }

  lookupTargets.forEach(setIfMatchesLookup);
}

const setTablePriv = (onlyVisible: boolean) => (tableSelector: SelectorOrElement, columnDefs: string[], ...dataDefs: ReadResult[][]): void  => {
  let data = dataDefs,
      colCount = columnDefs.length;

  data.forEach((ar, idx) => ensure(ar.length === colCount,
    `Data array lengths must be equal to columDefLength. Column defs have a length of: ${show(colCount)} but data record index ${idx}` +
     `has alength of ${ar.length}: \n\t ${ar.map(show).join(', ')}`));

  let lookupCols = columnDefs
                  .filter(s => s.startsWith('~'))
                  .map(s => s.slice(1)),
      dataCols = columnDefs.filter(s => !s.startsWith('~')),
      allCols = lookupCols.concat(dataCols);

  ensure(lookupCols.length > 0, 'No lookup columns defined in columnDefs (these are prepended by a tild e.g. ~Product)');

  let tbl = S(tableSelector),
      header = tbl.$('tr'),
      colMap = generateColMap(header);

  ensureAllColsInColMap(colMap, allCols);

  let lookUpObjs = generateLookupObjs(lookupCols, dataCols, columnDefs, data),
      lookupTargets = generateLookupTargets(tableSelector, lookupCols, dataCols, onlyVisible);

  doTableSet(lookUpObjs, lookupTargets);
}

export function setTable(tableSelector: SelectorOrElement, columnDefs: string[], ...dataDefs: ReadResult[][]): void {
  setTablePriv(false)(tableSelector, columnDefs, ...dataDefs);
}

export function setTableFilterVisibleOnlySlow(tableSelector: SelectorOrElement, columnDefs: string[], ...dataDefs: ReadResult[][]): void {
  setTablePriv(true)(tableSelector, columnDefs, ...dataDefs);
}

export function readTable(tableSelector: SelectorOrElement, columns: string[] | null | undefined, visibleOnly: boolean = true): {[k:string]: ReadResult}[] {
  let tbl = S(tableSelector),
      header = tbl.$('tr'),
      colMap = generateColMap(header),
      columnSubset = columns == null ? null : new Set(columns),
      lastRowIndex = -1,
      thisRow: {[k:string]: ReadResult} = {},
      result: {[k:string]: ReadResult}[] = [];

   if (columns != null) {
     ensureAllColsInColMap(colMap, columns);
   }

   const include = (colTitle: string) => columnSubset == null ? true : columnSubset.has(colTitle);
   function readSingleCell(cell: Element, colTitle: string, rowIndex: number, colIndex: number, row: Element) {

     if (lastRowIndex !== rowIndex){
        thisRow = {};
        result.push(thisRow);
        lastRowIndex = rowIndex;
     }

     if (include(colTitle)){
      thisRow[isNullEmptyOrUndefined(colTitle) ? show(colIndex): colTitle] = read(cell);
     }
  }

  mapCells(tableSelector, readSingleCell, visibleOnly);
  return result;
}

export function readCell(tableSelector: SelectorOrElement, lookUpVals: {[k:string]: ReadResult}, valueCol: string): ReadResult | void {
  let cl = cell(tableSelector, lookUpVals, valueCol);
  return cl == undefined ? undefined : read(cl);
}

function ensureAllColsInColMap(colMap: {[k:number]: string}, lookUpNames: string[]){
  let colNames: string[] = _.values(colMap),
      missing = _.difference(lookUpNames, colNames);

  ensure(missing.length === 0, `The following column names referenced in the arguments to this function do not appear in the table header: ${missing.join(', ')}. Possible values are: ${colNames.join(', ')}`);
}

export function cell(tableSelector: SelectorOrElement, lookUpVals: {[K:string]: ReadResult}, valueCol: string): Element | void {
  let tbl = S(tableSelector),
      header = tbl.$('tr'),
      colMap = generateColMap(header),
      lookUpNames = _.keys(lookUpVals);

  lookUpNames.push(valueCol)

  ensureAllColsInColMap(colMap, lookUpNames);

  // Bending a mapper into a reducer so can reuse mapCells
  // rather than rewrite flow control
  let accum = {
    rowUnmatched: false,
    value: (<Element|undefined>undefined),
    result: (<Element|undefined>undefined),
    resultSet: false
  },
  lastRowIdx = -1,
  maxColIndex = _.keys(colMap).length - 1;

  function reset() {
    accum = {
      rowUnmatched: false,
      value: (<Element|undefined>undefined),
      result: (<Element|undefined>undefined),
      resultSet: false
    }
  }

  function psuedoReducer(cell: Element, colTitle: string, rowIndex: number, colIndex: number, row: Element) {
    if (accum.resultSet){
      return ABORT_FLAG;
    }

    if (accum.resultSet || lastRowIdx === rowIndex && accum.rowUnmatched){
      return true;
    }

    if (lastRowIdx !== rowIndex){
      reset();
      lastRowIdx = rowIndex;
    }

    if (colTitle == valueCol){
      accum.value = cell;
    }

    let targetVal = lookUpVals[colTitle];
    if (targetVal !== undefined) {
      let actual = read(cell);
      accum.rowUnmatched = !areEqual(targetVal, actual)  &&
                           !((typeof targetVal != 'string' || typeof actual != 'string') && show(actual) == show(targetVal)) ;
    }

    if (colIndex == maxColIndex && !accum.rowUnmatched){
      accum.result = accum.value;
      accum.resultSet = true;
    }

    return true;
  }

  mapCellsPriv(tbl, psuedoReducer, false, colMap);
  return accum.resultSet ? accum.result : undefined;
}

function generateColMap(row: Element) : {[k:number]: string} {
  let cells = row.$$('th, td');
  function addCol(accum: {[k:number]: string}, el : Element, idx: number): {[k:number]: string} {
    let colName = trim(show(read(el)));
    accum[idx] = colName == '' ? 'idx' + show(idx) : colName;
    return accum;
  }
  return _.reduce(cells, addCol, {});
}

export function mapCells<T>(tableSelector: SelectorOrElement, cellFunc : CellFunc<T>, visibleOnly: boolean = true): T[][] {
  return mapCellsPriv(tableSelector, cellFunc, visibleOnly);
} 

// Does not allow for invisible first row
function mapCellsPriv<T>(tableSelector: SelectorOrElement, cellFunc : CellFunc<T>, visibleOnly: boolean = true, maybeColMap?: {[k:number]: string}): T[][] {
  let tbl = S(tableSelector);
  let rows = tbl.$$('tr');
  let visFilter = (e:Element) => !visibleOnly || e.isDisplayedInViewport(),
      headerRow = _.head(rows),
      dataRows =  _.tail(rows);

  if (headerRow == null) {
    return [];
  }

  let colMap: {[k:number]: string} = def(maybeColMap, generateColMap(headerRow));
  function rowFunc(row: Element, rowIndex: number): (cell: Element, colIndex: number) => T {
    return function eachCellFunc(cell: Element, colIndex: number) {
      return cellFunc(cell, colMap[colIndex], rowIndex, colIndex, row);
    }
  }

 let result = mapRows(rowFunc, visFilter, dataRows);
 return result;
}

type ABORT = 'ABORT';
const ABORT_FLAG : ABORT  = 'ABORT';

function mapImplementedWithTransform<I, T>(source: I[], mapper: (input: I, index: number) => T | ABORT): T[] {

  function transformer(accum: T[], val: I, index: number) {
    let result = mapper(val, index);
    if (result == ABORT_FLAG) {
      return false;
    } else {
      accum.push(result);
    }
  }

  return _.transform(source, transformer, []);
}

function mapRows<T>(colProcessorCreator: (e:Element, n:number) => (e:Element, n:number) => T | ABORT, elementFilter: (e:Element) => boolean, rows: Element[]): T[][] {

  let aborted = false;

  function mapRow(row: Element, rowIndex: number): T[] | ABORT {
    if (aborted){
      return ABORT_FLAG;
    }

    let innerCellFunc = colProcessorCreator(row, rowIndex),
        rowCells = row.$$('th, td');

    function innerCellFuncWithAbort(cell: Element, colIndex: number):  T | ABORT {
      let result = innerCellFunc(cell, colIndex);
      if (result == ABORT_FLAG) {
        aborted = true;
      }
      return result;
    }

    let activeCells = _.filter(rowCells, elementFilter);
    return mapImplementedWithTransform(activeCells, innerCellFuncWithAbort);
  }

  let activeRows = _.filter(rows, elementFilter);
  return mapImplementedWithTransform(activeRows, mapRow);
}

export function mapCellsSimple<T>(tableSelector: SelectorOrElement, cellFunc : SimpleCellFunc<T>, visibleOnly: boolean = true): T[][] {
  let tbl = S(tableSelector),
      rows = tbl.$$('tr'),
      visFilter = (e: Element) => !visibleOnly || e.isDisplayedInViewport();

  function rowFunc(row: Element, rowIndex: number): (cell: Element, colIndex: number) => T {
    return function eachCellFunc(cell: Element, colIndex: number) {
      return cellFunc(cell, rowIndex, colIndex, row);
    }
  }

  return mapRows(rowFunc, visFilter, rows);
}

/*
********************************************************************************
******************************* Other Utils *************************************
********************************************************************************
 */


export function SSNested(parentSelectorOrElement: SelectorOrElement, manySelector: string): Element[] {
    let el = S(parentSelectorOrElement);
    return el.$$(manySelector);
}

interface FormItems {
                   allEdits: ElementPlusLoc[],
                   editsRemaining: ElementPlusLoc[],
                   nonEditsRemaining: ElementPlusLoc[],
                   result: {[k:string]: string},
                   data: {[k:string]: any},
                   dataType: {[k:string]: string},
                   sumTypes:  {[k:string]: string[]},
                 };

export const ZZForTest = {
 toPropString : toPropString,
 formatFormInfo: formatFormInfo
}

function toPropString(labelStr: string): string {

   function splitOnNonChars(accum: any, chr: any) {
     let code = chr.charCodeAt(0),
         isAlphaNum = code > 64 && code < 91 || code > 96 && code < 123 || code > 47 && code < 58,
         {words, inWord} = accum,
         lastIdx = words.length - 1;

     if (isAlphaNum && inWord){
       words[lastIdx] = words[lastIdx] + chr;
     }
     else if (isAlphaNum) {
       words.push(chr);
       accum.inWord = true;
     }
     else {
       accum.inWord = false;
     }
     return accum;
   }

   let words = labelStr.split('').reduce(splitOnNonChars, {words: [], inWord: false}).words,
       firstWrd = _.head(words);

   if (firstWrd == null) {
     return '???????'
   }
   else {
     let capsWrds = forceArray(lowerCase(firstWrd), _.tail(words).map((w:string) => upperFirst(lowerCase(w))));
     return capsWrds.join('');
   }
}

function nearestLabel(edit: ElementPlusLoc, nonEditsRemaining: ElementPlusLoc[]) : ElementPlusLoc {
  const calcDistance = (l: any) => distanceLabelToDataObject(edit, l, '*');

  function bestCandidate(accum: any, lbl: any) {
    let distance = calcDistance(lbl),
        txt = lbl.getText();

    if (distance != null && hasValue(txt) && distance < accum.distance){
      return {
        distance: distance,
        result: lbl
      }
    }
    else {
      return accum;
    }
  }

  return _.reduce(nonEditsRemaining, bestCandidate, {
                                              distance: Number.MAX_VALUE,
                                              result: null
                                            });
}

function placeholderOrLabelText(edit: ElementPlusLoc, nonEditsRemaining: ElementPlusLoc[]) : {altIdStr: string | null, nonEdit: ElementPlusLoc | null} {
  let ph = edit.getAttribute('placeholder'),
      altIdStr = null,
      nonEdit = null;

  if (ph == null || ph == ''){
    let nonEdit = def(
                      nonEditsRemaining.find(l => l.getAttribute('for') == idAttribute(edit) && l.getAttribute('for') != null),
                      nearestLabel(edit, nonEditsRemaining.filter(l => l.getAttribute('for') == null ))
                     );

    altIdStr = nonEdit == null || !hasValue(nonEdit.getText()) ? 'idOrTextNotFound' : nonEdit.getText();
  }
  else {
    altIdStr = ph;
    nonEdit = null;
  }

  return {
    altIdStr: altIdStr,
    nonEdit: nonEdit
  }

}

const isRadioOfName = (name: string) => (edit: ElementPlusLoc) => edit.getAttribute('type') == 'radio' && nameAttribute(edit) == name;

function radioOptions(name: string, allEdits: ElementPlusLoc[]): string[] {
  return <any>allEdits
            .filter(isRadioOfName(name))
            .map(e => e.getAttribute('value'))
            .filter(hasValue);
}

function selectOptions(edit: ElementPlusLoc): string[] {
  let options = edit.$$('option');
  return options.map((o: Element) => o.getText());
}

function radioValue(name: string, allEdits: ElementPlusLoc[]): string | null | undefined {
  var radio = allEdits.find(isRadioOfName(name));
  return radio == null ? null : radio.getAttribute('value');
}

function getNextFormItems(items: FormItems): FormItems {

  let {
        editsRemaining,
        allEdits,
        nonEditsRemaining,
        data,
        dataType,
        sumTypes
      } = items;

  if (editsRemaining.length == 0){
    return items;
  }

  let edit = _.head(editsRemaining),
      id = idAttribute(edit),
      result = items.result,
      {altIdStr, nonEdit} = placeholderOrLabelText(edit, nonEditsRemaining),
      lblTextkey = def(altIdStr, '?????' + show(_.keys(result).length)),
      name = nameAttribute(edit),
      namedRadio = isRadio(edit) && name != null,
      dataPropName = toPropString(namedRadio ? <string>name : lblTextkey),
      typeName = upperFirst(dataPropName),
      paramStr = 'params.' + dataPropName;

  editsRemaining = _.tail(editsRemaining);

   if (namedRadio){
     let name: string = <string>nameAttribute(edit);
     result[name] = paramStr;
     data[dataPropName] = radioValue(name, allEdits);
     dataType[dataPropName] = typeName;
     sumTypes[typeName] = radioOptions(name, allEdits)
   }
   else if (id != null){
     result[id] = paramStr;
   }
   else {
     result[lblTextkey] = paramStr
   }

   if (!namedRadio){
     let val = <any>read(edit),
         isSelect = isSelectElement(edit);

     val = typeof val == 'string' && stringConvertableToNumber(val) ? Number.parseFloat(val) : val;
     data[dataPropName] = val
     dataType[dataPropName] = edit.isCheckControl ? 'boolean' :
                                isSelect ? typeName :
                                val == null ? 'string' : typeof val;

    if (isSelect){
       sumTypes[typeName] = selectOptions(edit)
    }
   }

   return getNextFormItems(
     {
        allEdits: allEdits,
        editsRemaining: editsRemaining,
        nonEditsRemaining: items.nonEditsRemaining,
        result: result,
        data: data,
        dataType: dataType,
        sumTypes: sumTypes
      }
   );
}

export const isSelectElement = elementIs('select')

function extractFormInfo(parentElementorSelector: SelectorOrElement): FormItems {
  let {edits, nonEdits} = editsNonEdits(parentElementorSelector),
      elPos = (e0: ElementPlusLoc, e1: ElementPlusLoc) => e0.top - e1.top != 0 ? e0.top - e1.top : e0.left - e1.left;

 let editsL = addLocationsAndCheckControl(edits).sort(elPos),
     nonEditsL = addLocationsAndCheckControl(nonEdits).sort(elPos);
 return getNextFormItems({
                          allEdits: editsL,
                          editsRemaining: editsL,
                          nonEditsRemaining: nonEditsL,
                          result: {},
                          data: {},
                          dataType: {},
                          sumTypes: {},
                        });
}


function typeDeclaration(types: any, typeName: string): string {
  return `export type ${typeName} = \n\t${types.map((s:string) => `'${s}'`).join('\n\t| ')};`
}

function typeLines(dataType: {[k:string]: string}): string {
  let lines = _.map(dataType, (v:string, n:string) => '\t\t' + n + ': ' + v);
  return lines.join(',\n');
}

function formParamLines(result: {[k:string]: string}): string {
  let lines = _.map(result, (v: string, n: string) => '\t\t' + n + ': ' + v);
  return lines.join(',\n');
}

function dataLines(data: {[k:string]: any}, dataType: {[k:string]: string}) {
  function valShow(name: string, typeName: string) {
    let val = show(data[name]);
    return typeName == 'boolean' || typeName == 'number' ? val : "'" + val + "'";
  }

  let lines = _.map(dataType, (v: string, n: string) => '\t\t' + n + ': ' + valShow(n,v));
  return lines.join(',\n');
}

function formatFormInfo(info: FormItems): string {
  let {
      result,
      data,
      dataType,
      sumTypes
      } = info;

  // Sum Types
  let sumTypeStr = _.map(sumTypes, typeDeclaration).join('\n\n');
  sumTypeStr = trim(sumTypeStr) == '' ? '' : `// Field Subtypes\n${sumTypeStr}`;

  // data Type
  let dataTypeStr = `// Complete Form Input Type\nexport type CompleteFormInput = \n\t{\n${typeLines(dataType)}\n\t}`;

  // default data
  let defaultData = `// Default Data\nexport const formDefaults = () => {\n return {\n${dataLines(data, dataType)}\n\t}\n}`;

  // set form function
  let setFormStr =
`export function setThisForm(parentElementorSelector: SelectorOrElement, params: FormInput) {
  params = _.defaults(params, formDefaults());
  let formParams = \n\t{\n${formParamLines(result)}\n\t};
  setForm(parentElementorSelector, formParams);
}`;

  return [
          sumTypeStr,
          dataTypeStr,
          '// Form Input\nexport type FormInput = $Supertype<CompleteFormInput>;',
          defaultData,
          setFormStr
        ].join('\n\n');
}

export function getForm(parentElementorSelector: SelectorOrElement): string {
  let result = formatFormInfo(extractFormInfo(parentElementorSelector));
  log(result);
  toTempString(result);
  (<any>clipBoardy).write(result);
  log('sourcecode copied to clipboard');
  return result;
}

type EditsNonEdits = {
                      edits: Element[],
                      nonEdits: Element[]
                    };

function editsNonEdits(parentElementorSelector: SelectorOrElement): EditsNonEdits {
  let elements = SSNested(parentElementorSelector, '*');
  return _.reduce(elements, splitEditsNonEdits, {edits: [], nonEdits: []});
}

// do not move onto multiple lines ~ confuses symbold view
export function setForm(parentElementorSelector: SelectorOrElement, valMap: {[k:string]: SetterValue | ValueWithFinderSetter}, setter: SetterFunc = set, finder?: FinderFunc): void {

  type ElementInfo = {
                     elementMap: {},
                     customSetters: {},
                     trueVals: {},
                     failedMappings: string[]
                   };

  let {edits, nonEdits} = editsNonEdits(parentElementorSelector),
      idedEdits = _.memoize(() => finder == null ? _.reduce(edits, addId, {}) : {}),
      findElement = finder == null ? defaultFinder(parentElementorSelector, idedEdits, edits, nonEdits) : finder;

  function deconstructFindElement(accum: ElementInfo, val: SetterValue | ValueWithFinderSetter, key: string): ElementInfo {

    let isCustomObj = _.isObject(val),
        trueVal: SetterValue = isCustomObj ? ensureHasVal((<any>val).value, 'setform custom object must have value property defined') : val,
        customSetter: SetterFunc | null | undefined = isCustomObj ? (<any>val).setter : undefined,
        finder: FinderFunc = isCustomObj && (<any>val).finder != null ? (<any>val).finder : findElement,
        target: Element | null | undefined = finder(key, edits);

    if (target == null) {
      accum.failedMappings.push(`Could not find matching input element for: ${key} is setForm: {${key}: ${show(trueVal)}, ...}`);
    }
    else {
      (<any>accum).customSetters[key] = customSetter;
      (<any>accum).trueVals[key] = trueVal;
      (<any>accum).elementMap[key] = target;
    }

    return accum;
  }

  let infoSeed = {
                    elementMap: {},
                    customSetters: {},
                    trueVals: {},
                    failedMappings: []
                  },
      elementInfo = _.reduce(valMap, deconstructFindElement, infoSeed),
      safeSetter = handledSet(setter, elementInfo.customSetters),
      trueVals = elementInfo.trueVals;

  _.each(elementInfo.elementMap, (e: Element, k: string) => safeSetter(e, k, trueVals[k]));

  let fails = elementInfo.failedMappings;
  ensure(fails.length === 0, `setForm failures:\n ${fails.join('\n')}`);
}


function forLabelsMapFromArray(labelLike: ElementWithForAndText[], idedEdits: {[k:string]: Element}): {} {

  function addLabelLike(accum: {}, label: ElementWithForAndText): {} {
    let lblTxt = label.text;
    if (lblTxt != null){
      (<any>accum)[lblTxt] = (<any>idedEdits)[label.for];
    }
    return accum;
  }
  return labelLike.reduce(addLabelLike, {});
}


type ElementWithForAndText =  Element & {for: string, text: string};
type ClassifiedLabels = {
                          forLbls: ElementWithForAndText[],
                          nonForLbls: Element[]
                        };

// label above / below Left / right / default (left the  above)
export type LabelSearchDirectionModifier = 'A'| 'B' | 'L' | 'R' | '*';

const allModifiers = ['A', 'B', 'L', 'R', '*'];

export const unitTestingTargets = {
  sliceSearchModifier: sliceSearchModifier
}

function sliceSearchModifier(str: string): [LabelSearchDirectionModifier, string] {
  if (str.length < 3 || str[1] != '~' ) {
    return ['*', str];
  }

  let modifier = str[0].toUpperCase();
  return allModifiers.includes(modifier) ? [<any>modifier, str.slice(2) ]: ['*', str];
}

function partitionAddFor(nonEdits: Element[]): ClassifiedLabels {

  function clasifyElement(accum: ClassifiedLabels, label: Element) {
    let forTxt = label.getAttribute('for');
    if (forTxt == null){
      accum.nonForLbls.push(label);
    }
    else  {
      accum.forLbls.push(_.extend(label, {
                                          for: forTxt,
                                          text: label.getText()}));
    }
    return accum;
  }

  return nonEdits.reduce(clasifyElement,  {
                            forLbls: [],
                            nonForLbls: []
                          } );
}

type ElementWithPlaceHolder =  Element & {placeholder: string};
function addPlaceHolders(edits: Element[]) : ElementWithPlaceHolder[]  {

  function addIfPlaceHolder(accum: ElementWithPlaceHolder[], elm: Element) : ElementWithPlaceHolder[] {
    let ph = elm.getAttribute('placeholder');
    if (ph != null){
      (<any>elm).placeholder = ph;
      accum.push(<ElementWithPlaceHolder>elm);
    }
    return accum;
  }

  let unsorted: ElementWithPlaceHolder[] = edits.reduce(addIfPlaceHolder, []);
  return _.sortBy(unsorted, (e: ElementWithPlaceHolder) => e.placeholder.length);
}

interface ElementPlusLoc extends Element {
                                            x: number,
                                            y: number,
                                            left: number,
                                            right: number,
                                            top: number,
                                            bottom: number,
                                            width: number,
                                            height: number,
                                            verticalCentre: number,
                                            horizontalCentre: number
                                          };

function addLocation(el: Element): ElementPlusLoc {
  let loc = el.getLocation(),
      size = el.getElementSize(),
      elpl = <ElementPlusLoc>el;

  elpl.x = loc.x,
  elpl.y = loc.y;
  elpl.left = loc.x;
  elpl.right = loc.x + size.width;
  elpl.top = loc.y;
  elpl.bottom = loc.y + size.height;
  elpl.width = size.width;
  elpl.height = size.height;
  elpl.verticalCentre = loc.y + size.height/2;
  elpl.horizontalCentre = loc.x + size.width/2;
  return elpl;
}

function addLocationsAndCheckControl(locs: Element[]): ElementPlusLoc[] {
  return locs.map(addLocation);
}

function addLocations(locs: Element[]): ElementPlusLoc[] {
  return locs.map(addLocation);
}

interface ElementPlusLocPlusText extends ElementPlusLoc {x: number, y: number, text: string}
function addLocationsAndText(locs: Element[]): ElementPlusLocPlusText[] {
  return _.sortBy(addLocations(locs).map((e: ElementPlusLoc) => {
                                      (<any>e).text = e.getText();
                                      return e;
                                    }),
                                    (e:ElementPlusLocPlusText) => e.text.length
                                  );
}

function pointsOverlap(lowerBound1: number, upperBound1: number, lowerBound2: number, upperBound2: number){

  function liesWithin(target: number, lowerBound: number, upperBound: number){
    return (target >= lowerBound && target <= upperBound);
  }

  return  liesWithin(lowerBound1, lowerBound2, upperBound2) ||
          liesWithin(upperBound1, lowerBound2, upperBound2) ||
          liesWithin(lowerBound2, lowerBound1, upperBound1) ||
          liesWithin(upperBound2, lowerBound1, upperBound1);
}

function centrePassesThroughTarget(candidate: ElementPlusDistance, targetLabel: ElementPlusLoc, directionModifier: LabelSearchDirectionModifier): boolean {

  let horizonallyAligned = targetLabel.horizontalCentre < candidate.right && targetLabel.horizontalCentre > candidate.left,
      verticallyAligned = targetLabel.verticalCentre > candidate.top && targetLabel.verticalCentre < candidate.bottom;

  return (directionModifier === 'A' || directionModifier === 'B') ?  horizonallyAligned :
         (directionModifier === 'R' || directionModifier === 'L') ?  verticallyAligned  :
         horizonallyAligned || verticallyAligned;
}

function distanceLabelToDataObject(candidate: ElementPlusLoc, targetLabel: ElementPlusLoc, directionModifier: LabelSearchDirectionModifier): number | null {
  function veritcalOverlap(targetLabel: ElementPlusLoc, candidate: ElementPlusLoc){
    return pointsOverlap(candidate.top, candidate.bottom, targetLabel.top, targetLabel.bottom);
  }

  function editPixToRight(candidate: ElementPlusLoc, targetLabel: ElementPlusLoc){
    let result = targetLabel.right <= candidate.left && veritcalOverlap(targetLabel, candidate) ?
           candidate.left - targetLabel.right: null;
    return result;
  }

  function editPixToLeft(candidate: ElementPlusLoc, targetLabel: ElementPlusLoc){
    let result = targetLabel.left >= candidate.left /* using .left not .right because some labels envelop their control esp clickable controls */ && veritcalOverlap(targetLabel, candidate) ?
                  Math.max(targetLabel.left - candidate.right, 0) : null;
    return result;
  }

  function horizontalOverlap(targetLabel: ElementPlusLoc, candidate: ElementPlusLoc){
    return pointsOverlap(candidate.left, candidate.right, targetLabel.left, targetLabel.right);
  }

  function editPixAbove(candidate: ElementPlusLoc, targetLabel: ElementPlusLoc){
    return targetLabel.top >= candidate.bottom  && horizontalOverlap(targetLabel, candidate) ?
          targetLabel.top - candidate.bottom: null;
  }

  function editPixBelow(candidate: ElementPlusLoc, targetLabel: ElementPlusLoc){
    return targetLabel.bottom <= candidate.top && horizontalOverlap(targetLabel, candidate) ?
         candidate.top - targetLabel.bottom: null;
  }

 // Because LabelSearchDirectionModifier from the perspective of the label
 // but this code was implemented from the perspective of the data control
 // the functions are flipped below
  switch (directionModifier) {
    case 'A': // label object to above
      return editPixBelow(candidate, targetLabel);

    case 'B': // label object to below
      return editPixAbove(candidate, targetLabel);

    case 'R': // label object to right
      return editPixToLeft(candidate, targetLabel);

    case 'L': // label object to left
      return editPixToRight(candidate, targetLabel);

    default:
      let distanceFromTarget = def(editPixToRight(candidate, targetLabel), editPixBelow(candidate, targetLabel));

      // only look to left of label if chkbox or radio ~ note the flip see above
      if (isCheckable(candidate)){
        var pixLeft = editPixToLeft(candidate, targetLabel); // candidate to left of lbl
        if (pixLeft != null && (distanceFromTarget == null || pixLeft < distanceFromTarget) ){
          distanceFromTarget = pixLeft;
        }
      }
      return distanceFromTarget;
  }
}

interface ElementPlusDistance extends ElementPlusLoc {
                                                distanceFromTarget?: number, 
                                                labelCentred: boolean
                                              }

function nearestObject(targetLabel: ElementPlusLoc, directionModifier: LabelSearchDirectionModifier, candidate: ElementPlusDistance, bestSoFar: ElementPlusDistance | null){
  let distanceFromTarget = distanceLabelToDataObject(candidate, targetLabel, directionModifier);

  const distanceFromTargetCloser = () => {
    return distanceFromTarget == null || bestSoFar == null ? false :
              distanceFromTarget < (<any>bestSoFar).distanceFromTarget ||
              distanceFromTarget === bestSoFar.distanceFromTarget && !bestSoFar.labelCentred;
  }

  if (distanceFromTarget != null && (bestSoFar == null || distanceFromTargetCloser())){
    candidate.distanceFromTarget = distanceFromTarget;
    candidate.labelCentred = centrePassesThroughTarget(candidate, targetLabel, directionModifier);
    return candidate;
  }
  else {
    return bestSoFar;
  }
}

function closestObject(targetLabel: ElementPlusDistance, edts: ElementPlusDistance[], directionModifier: LabelSearchDirectionModifier): Element | null {
  function chooseBestObject(bestSoFar: ElementPlusDistance | null, candidate: ElementPlusDistance){
    return nearestObject(targetLabel, directionModifier, candidate, bestSoFar);
  }
  return edts.reduce(chooseBestObject, null);
}

function nearestEdit(key: string, edts: ElementPlusDistance[], labels: ElementPlusLocPlusText[],
                      wildcard: boolean, lblModifier: LabelSearchDirectionModifier): Element | null {
  // Note labels previously sorted by text length so will pick the match
  //with the shortest label
  let pred : (e:ElementPlusLocPlusText) => boolean = wildcard ? e => wildCardMatch(e.text, key) : e => e.text === key,
      targetLabel = _.find(labels, pred);

  return targetLabel == null ? null : closestObject(targetLabel, edts, lblModifier);
}

type ElementWithType = Element & {type: string};
function addType(elements: Element[]): ElementWithType[] {
  function addEl(accum: ElementWithType[], e: Element) {
    let type = e.getAttribute('type');
    if (type != null){
      (<any>e).type = type;
      accum.push(<any>e);
    }
    return accum;
  }
  return elements.reduce(addEl, []);
}

function addId(accum: {[k:string]: Element}, element: Element): {[k:string]: Element} {
   let id = idAttribute(element);
   if (id != null){
     accum[id] = element;
   }
   return accum;
}

export type SetterFunc = (element:Element, value: string | number | boolean) => void;
export type FinderFunc = (key: string, editable: Element[]) => Element | undefined | null;
export type SetterValue = string | number | boolean;
export type ValueWithFinderSetter = {
  value: SetterValue,
  finder?: FinderFunc,
  setter?: SetterFunc
}

export function predicateToFinder(pred: (key: string, element: Element) => boolean): FinderFunc {
  return function finder(key: string, editable: Element[]): Element | undefined | null {
    return editable.find((element:Element) => pred(key, element));
  }
}

export function withSetter(value: SetterValue | ValueWithFinderSetter, setter: SetterFunc): ValueWithFinderSetter {
  return _.isObject(value) ?
                    {
                      value: ensureHasVal((<any>value).value, 'withSetter value object value property is null or undefined'),
                      finder: (<any>value).finder,
                      setter: setter
                    } :
                    {
                      value: <any>value,
                      setter: setter
                    };

}

export function withFinder(value: SetterValue | ValueWithFinderSetter, finder: FinderFunc): ValueWithFinderSetter {
  return _.isObject(value) ?
                    {
                      value: ensureHasVal((<any>value).value, 'withFinder value object value property is null or undefined'),
                      finder: finder,
                      setter: (<any>value).setter
                    } :
                    {
                      value: <any>value,
                      finder: finder
                    };
}

export function withPredicate(value: SetterValue | ValueWithFinderSetter, predicate: (key: string, element: Element) => boolean): ValueWithFinderSetter {
  let finder = predicateToFinder(predicate);
  return withFinder(value, finder);
}

function splitEditsNonEdits(accum: EditsNonEdits, element: Element) {
  let tag = element.getTagName(),
      isEditableElement = canEditTag(tag) && canEditTypeAttr(element.getAttribute('type'));

   if (isEditableElement){
    accum.edits.push(element);
   }
   else if (isLabelLikeTag(tag)) {
     accum.nonEdits.push(element);
   }

  return accum;
}

function defaultFinder(parentElementorSelector: SelectorOrElement, idedEdits: () => {[k:string]: Element}, edits: Element[], nonEdits: Element[]) {

  const partitionAddForNonEdits = () => partitionAddFor(nonEdits),
        forLblMapFunc: () => {[k:string]: ElementWithForAndText} = () => forLabelsMapFromArray(forLabels(), idedEdits());

  let editsWithPlaceHolders = _.memoize(addPlaceHolders),
      addCoords = _.memoize(addLocations),
      addCoordsCheckable = _.memoize(addLocationsAndCheckControl),
      addCoordsTxt = _.memoize(addLocationsAndText),
      elementsWithType = _.memoize(addType),
      partitionedForLabels = _.memoize(partitionAddForNonEdits),
      forLblMap = _.memoize(forLblMapFunc),
      sortedForTexts = _.memoize(sortedForTextsFunc);

  function forLabels(): ElementWithForAndText[] {
    return partitionedForLabels().forLbls;
  }

  function nonForLabels(): Element[] {
    return partitionedForLabels().nonForLbls;
  }



  function sortedForTextsFunc(): string[] {
    return _.chain(forLabels())
                              .map('text')
                              .sortBy((t:ElementWithForAndText[]) => t.length)
                              .value();
  }

  return function defaultFinder(keyWithLabelDirectionModifier: string, edits: Element[]): Element | null {
    // Ided fields and search modifiers (e.g. A~Female ~ female label above)
    let [lblModifier, key] = sliceSearchModifier(keyWithLabelDirectionModifier),
        result = <Element | null | undefined>idedEdits()[key],
        wildcard = result == null && (typeof key == 'string') && key.includes('*');

    // Named radio group
    if (result == null){
      result = findNamedRadioGroup(key, elementsWithType(edits), wildcard);
    }

    // For labels
    if (result == null){
      result = forLblMap()[key];
    }

    // For labels with for + wildcard
    if (result == null && wildcard){
      // for labels

      let lblText = sortedForTexts().find((t:string )=> wildCardMatch(t, key));
      result = lblText == null ? null : forLblMap()[lblText];
    }

    // Placeholders
    if (result == null){
      let pred : (e:ElementWithPlaceHolder) => boolean = wildcard ? e => wildCardMatch(e.placeholder, key) : e => e.placeholder === key;
      result = editsWithPlaceHolders(edits).find(pred);
    }

    // Proximal labels - non for
    if (result == null){
      let labels = addCoordsTxt(nonForLabels()),
          edts = addCoordsCheckable(edits);
      result = nearestEdit(key, edts, labels, wildcard, lblModifier);
    }

    return result;
  }

}

function handledSet(setter: SetterFunc, customSetters: {[K:string]: SetterFunc}) {
  return function handledSet(element: Element, key: string, value: SetterValue) {
    try {
      let setterFunc = def(customSetters[key], setter);
      setterFunc(element, value);
    } catch (e) {
      let elementInfo = element == null ? 'Undefined Element' : element.getHTML();
      fail(`setForm function failed setting element: key: ${key} \n value: ${show(value)} \n element: ${elementInfo}`, e);
    }
  }
}

function findNamedRadioGroup(searchTerm: string, edits: ElementWithType[], wildCard: boolean) : Element | null {
  // string could be group name
  let atrPred = wildCard ?
                (s:string | null | undefined) => s != null && wildCardMatch(s, searchTerm) :
                (s:string | null | undefined) => s === searchTerm,
      namedRadios = edits.filter(e => e.type === 'radio' && atrPred(nameAttribute(e)));
  return namedRadios.length > 0 ? commonParent(namedRadios) : null;
}

function commonParent(radios: Element[]) : Element | null {
  let radiosLength = radios.length;
  if (radiosLength === 0) {
    return null;
  }

  let fst = radios[0],
      name = nameAttribute(fst);

  function parentOfAll(chld: Element): Element | null {
    let prnt = parent(chld);
    if(prnt != null){
      let theseRadios = radioElements(prnt, name);
      return theseRadios.length === radiosLength ? prnt : parentOfAll(prnt);
    }
    else {
      return null;
    }
  }

  return parentOfAll(fst);
}

function canEditTag(tagName: string) {
  return ['input', 'select'].includes(tagName);
}

function canEditTypeAttr(typeAttr: string | null | undefined) {
  const blackList = ['submit', 'reset', 'button', 'hidden'];
  return typeAttr == null || !blackList.includes(typeAttr);
}


function isLabelLikeTag(tagName: string) {
  return ['label'].includes(tagName);
}

function canEdit(element: Element) {
  return canEditTag(element.getTagName()) && canEditTypeAttr(element.getAttribute('type'));
}

// may be required with strange inputs
export const BACKSPACE = '\uE003';

export const nameAttribute: (e:Element) => string | null | undefined = e => e.getAttribute('name');
export const idAttribute: (e:Element) => string | null | undefined = e => e.getAttribute('id');

export function setSelect(elementOrSelector: SelectorOrElement, visText: string): void {

  let el = S(elementOrSelector),
      isSet = false;

  function isNotFoundError(e:any){
    let msg = e.message;
    return hasText(msg,'An element could not be located') ||
           hasText(msg,"because element wasn't found") ||
           hasText(msg, 'Malformed type for "elementId" parameter of command');
  }
    
  try {
    el.selectByVisibleText(visText);
    isSet = true;
  } catch (e) {
    if (!isNotFoundError(e)) {
      throw(e);
    }
  }

  if (!isSet){
    try {
      el.selectByAttribute('value', visText);
    } catch (e) {
      if (!isNotFoundError(e)){
        throw(e);
      }
      fail('Select element could not be located either by visible text or by value: ' + visText, e);
    }
  }

}

function radioElements(containerElementOrSelector: SelectorOrElement, groupName: string | null = null, wantUniqueNameCheck: boolean = true): Element[] {
  let el = S(containerElementOrSelector),
      radioElements = el.$$('input[type=radio]'),
      groupNameSpecified = groupName != null;

  if (groupNameSpecified){
    radioElements = radioElements.filter(e => areEqual(nameAttribute(e), groupName))
  }
  else if (wantUniqueNameCheck) {
    let radioNames = _.uniq(radioElements.map(e => e.getAttribute('name')));
    ensure(radioNames.length === 1, `The selected container ${show(containerElementOrSelector)} must contain one and only one radio group. Groups found: ${show(radioNames)}`);
  }

  return radioElements;
}

function radioLabels(containerElementOrSelector: SelectorOrElement, candidateRadioElements: Element[]) {

  let el = S(containerElementOrSelector),
      labels = el.$$("[for]"),
      radioIds = candidateRadioElements.reduce(addId, {});

 function idExists(lbl: Element) {
   let forAttr = lbl.getAttribute('for');
   return forAttr != null && (<any>radioIds)[forAttr];
 }

  return labels.filter(idExists);
}

export function setRadioGroup(containerElementOrSelector: SelectorOrElement, valueOrLabel: string, groupName: string | null = null) {
  let els = radioElements(containerElementOrSelector, groupName),
      target = els.find(e => areEqual(e.getAttribute('value'), valueOrLabel));

  if (target == null){
    let labels = radioLabels(containerElementOrSelector, els),
        targetLabel = labels.find(l => areEqual(valueOrLabel, l.getText()));

    ensureHasVal(targetLabel, `Could not find matching radio button for value or label: ${valueOrLabel}`);

    target = els.find(e => areEqual(e.getAttribute('id'), targetLabel));
  }

  setChecked(ensureHasVal(target, `Could not find matching radio button for value or label: ${valueOrLabel}`), true);
}

export function readRadioGroup(containerElementOrSelector: SelectorOrElement, groupName: string | null = null) {
  let els = radioElements(containerElementOrSelector),
      active = els.find(e => e.isSelected()),
      result = active == null ? null : active.getAttribute('value');

  return result == null ? null : result;
}

export function isRadioGroup(containerElementOrSelector: SelectorOrElement): boolean {
  return radioElements(containerElementOrSelector, null, false).length > 0;
}


export function radioItemVals(containerElementOrSelector: SelectorOrElement, groupName: string | null = null) : string[] {
  // type checker wants to handle nulls as well which are not realistic
  return <string[]>radioElements(containerElementOrSelector, groupName).map(e => e.getAttribute('value'));
}


export function isElement(candidate: any): boolean {
  return candidate != null &&
        _.isObject(candidate) &&
        !_.isArray(candidate) && (
          !_.isUndefined((<any>candidate).ELEMENT) ||
          !_.isUndefined((<any>candidate).getHTML)
        )
}

export function elementIs(tagName: string) {
  return function functionElementMatches(elementOrSelector: SelectorOrElement) {
    let el = S(elementOrSelector);
    return areEqual(tagName, el.getTagName());
  }
}


function readSelect(elementOrSelector: SelectorOrElement) : string {
  let el = S(elementOrSelector);
  return el.getValue();
}

export function setInput(elementOrSelector: SelectorOrElement, value: string) {
  let el = S(elementOrSelector);
  el.setValue(value);
}

export function parent(elementOrSelector: SelectorOrElement, prd: (e:Element) => boolean = _ => true): Element | null {
  
  ensureHasVal(elementOrSelector, "parent function: elementOrSelector is null");

  function handleKnown<a, b>(f: () => a, dflt: b): a | b | null {
    let rslt = null;
    try {
      rslt = f()
    } catch (e) {
      let eTxt = e.toString(),
          known = hasText(eTxt, 'attached to the DOM', true) ||
                  hasText(eTxt, 'element could not be located', true);
      if (known){
        rslt = dflt;
      }
      else {
        fail('parent function failed', e);
      }
    }
    return rslt;
  }

  function nxtParent(elChild: SelectorOrElement){
    function rawParent(): Element | null {
      let el = S(elChild);
      return  el.$('..');
    }

    return handleKnown(rawParent, null);
  }

  function nearestParent(el0: SelectorOrElement): Element | null {
    let el1 = nxtParent(el0);
    return el1 == null || handleKnown(() => prd(<Element>el1), false) ? el1 : nearestParent(el1);
  }

  return nearestParent(elementOrSelector);
}

// need date later
export function read(elementOrSelector: SelectorOrElement, includeRaioGroups: boolean = true): ReadResult {
  let el = S(elementOrSelector);

  let tagName = el.getTagName();
  switch (tagName) {
    case 'select':  return readSelect(el);
    case 'input': return isCheckable(el) ? el.isSelected() : el.getValue();
    default:
      return includeRaioGroups && isRadioGroup(el) ? readRadioGroup(el) : el.getText();
  }
}

export function set(elementOrSelector: SelectorOrElement, value: string | number | boolean) : void {
  setPrivate(true, elementOrSelector, value);
}

function findSettable(element: Element): Element | undefined {
  let els = element.$$('*');
  return els.find(isSetable);
}

export function isSetable(elementOrSelector: SelectorOrElement) {
  return setPrivate(false, elementOrSelector, 'ignored')
}

function setPrivate(wantSet: boolean, elementOrSelector: SelectorOrElement, value: string | number | boolean) : boolean {
  let el = S(elementOrSelector),
      checkable = isCheckable(el),
      bool = _.isBoolean(value),
      tagName = el.getTagName();

  const isIsNot = (b: any) => `is${b ? '' : ' not'}`;
  if (checkable !== bool && wantSet && tagName !== 'td'){
    fail(`set - type mismatch - value type ${isIsNot(bool)} boolean but element ${isIsNot(checkable)} a radio button or checkbox.`);
  }

  let result = checkable;

  if (checkable) {
    if (wantSet) {
      setChecked(el, <any>value);
    }
  }
  else {
    result = true;
    switch (tagName) {
      case 'select':
        if (wantSet) {
          setSelect(el, <any>value);
        }
        break;

      case 'input':
        if (wantSet) {
          setInput(el, show(value));
        }
        break;

      case 'td':
        let settableChild = findSettable(el);
        result = settableChild != null;
        if (result && wantSet){
          setPrivate(true, <any>settableChild, value);
        }
        break;

      default:
        result = false;
        break;
      }
  }

  if (!result && isRadioGroup(el)){
    result = true;
    if (wantSet){
      setRadioGroup(el, <any>value);
    }
  }

  if (wantSet && !result) {
    fail('set failure - unhandled element type: "' + tagName + '"', el.getHTML());
  }
  return result;
}

export function isRadio(elementOrSelector: SelectorOrElement) {
  let el = S(elementOrSelector);
  return isRadioType(elementType(el));
}

export function isCheckBox(elementOrSelector: SelectorOrElement) {
  let el = S(elementOrSelector);
  return isCheckBoxType(elementType(el));
}

function isRadioType(type: string): boolean {
    return sameText(type, 'radio');
}

function isCheckBoxType(type: string): boolean {
   return sameText(type, 'checkbox');
}

export function elementType(el: Element) {
  return def(el.getAttribute('type'), <string>'');
}

export function isCheckable(elementOrSelector: SelectorOrElement) {
  let el = S(elementOrSelector),
      type = elementType(el);

  return isCheckableType(type);
}

export function isCheckableType(type: string) {
  return isRadioType(type) || isCheckBoxType(type);
}

export function setChecked(elementOrSelector: SelectorOrElement, checkedVal: boolean) {
  let el = S(elementOrSelector),
      type = def<string>(el.getAttribute('type'), ''),
      isRadio = sameText(type, 'radio'),
      isCheckBox = sameText(type, 'checkbox');

  ensure(isRadio || isCheckBox,
                      'setChecked can only be called on radio buttons or checkboxes');

  let checked = el.isSelected();

  ensure(isCheckBox || checkedVal,
            'Cannot uncheck radio buttons with setChecked - check a different radio button to true instead');

  if (checkedVal !== checked){
    el.click();
  }

}

export function clickLink(displayTextOrFunc: string | ((s: string) => boolean)): void {
  linkByText(displayTextOrFunc).click();
} 

export function linkByText(displayTextOrFunc: string | ((s: string) => boolean)): Element {
  let pred : (s:string) => boolean = typeof displayTextOrFunc == 'string' ? elText => wildCardMatch(elText, displayTextOrFunc) : displayTextOrFunc,
      result = links().find(l => pred(l.getText()));

  return ensureHasVal(result, 'linkByText Failed.\nCould not find a link with display text matching: ' + show(displayTextOrFunc));
}

export function links() {
  return SS('[href]');
}

export function url(url: string) {
  browser.url(url);
}

export function getUrl(): string {
  return <any>browser.getUrl();
}

export function click(elementSelector: string) {
  S(elementSelector).click();
}

/***********************************************************************************************
******************************************** LOADING *******************************************
************************************************************************************************/

function signature(beforeFuncOrUrl: (() => void) | string | null = null, func: (p?:any[]) => any) {
  return {
    before: _.isFunction(beforeFuncOrUrl) ? functionNameFromFunction(beforeFuncOrUrl) : show(beforeFuncOrUrl),
    target: functionNameFromFunction(func)
  }
}

const webDriverIOParamsSignatureFileName = 'webioParams.yaml';

function saveSignature(sig: {}) {
  toTemp(sig, webDriverIOParamsSignatureFileName, false, false);
}

function signatureChanged(sig: {}) {
  return tempFileExists(webDriverIOParamsSignatureFileName) ? !areEqual(fromTemp(webDriverIOParamsSignatureFileName, false), sig) : true;
}

export function rerun(beforeFuncOrUrl?: (() => void) | string | null | undefined, func?: (...p:any) => any, ...params: any[]): any {
  let result;
  try {
    runClient();
    // Closing - if already closed will do nothing
    if (func == null){
      stopSession();
      throw 'rerun Session Stop';
    }

    let connected = isConnected(),
        sig = signature(beforeFuncOrUrl, func),
        sigChangedConnected = connected && signatureChanged(sig);

    // close off session if signatureChanged
    if (sigChangedConnected) {
      stopSession();
    }

    saveSignature(sig);

    result = !connected || sigChangedConnected ?
                                 launchSession(beforeFuncOrUrl, func, ...params) :
                                 rerunLoaded(...params);

  } finally {
    disconnectClient();
  }

  return result;
}

export function zzzTestFunc() {
  return browser.getTitle();
}

export function browserEx(func: (...p: any) => any, ...params: any[]): any {
   try {
     let caller = firstTestModuleInStack();
     return browserExBase(null, caller, func, ...params);
   }
  catch (e) {
    fail('browserEx - fail', e)
   } finally {
    stopSession();
   }
}

export const TEST_SUFFIXES = ['.endpoints.', '.integration.', '.test.'];

function firstTestModuleInStack(): string {
  let fullStack = callstackStrings(),
      line = fullStack.find(s => TEST_SUFFIXES.some(suffix => hasText(s, suffix)));

  return filePathFromCallStackLine(
      ensureHasVal(line, `Could not find test module in callstack the calling function can only be executed from a test module: ${fullStack.join(newLine())}`)
  );
}

function launchSession<T>(before: (() => void) | null | string | undefined, func: (...params: any) => T, ...params: any[]): T {
   try {
     let caller = firstTestModuleInStack(),
     {
       funcName,
       beforeFuncInfo,
       sourcePath
     } = extractNamesAndSource(before, caller, func);
     
     killGeckoDriver();
     launchWdioServerDetached(sourcePath, beforeFuncInfo, funcName, true);

     ensure(waitConnected(30000), 'Timed out waiting on interactor');
     return interact(...params);
   }
  catch (e) {
    return fail('launchSession - fail', e)
   }
}

function rerunLoaded<T>(...params: any[]): T {
   try {
     return interact(...params);
   }
  catch (e) {
    return fail('rerunLoaded - fail', e)
   }
}


function extractNamesAndSource(before: (() => void) | string | null | undefined, caller: string, func: (...params: any) => any) {
  let beforeIsString = _.isString(before);
  return {
    funcName: functionNameFromFunction(func),
    beforeFuncInfo: before == null ? null : {
                                              isUrl: beforeIsString,
                                              name: beforeIsString ? show(before) : functionNameFromFunction(before)
                                            },
    sourcePath: findMatchingSourceFile(caller)
  }
}

function browserExBase(before: (() => void) | null | string, caller: string, func: (...p: any) => any, ...params: any[]): any {
  let {
      funcName,
      beforeFuncInfo,
      sourcePath
    } = extractNamesAndSource(before, caller, func);

   ensure(params.every(isSerialisable), 'browserEx optional params ~ unserailisable parameter passed in (like a function)');
   launchWebInteractor(sourcePath, beforeFuncInfo, funcName, true);
   return interact(...params);
}

export function findMatchingSourceFile(callerPath: string): string {
  let callerFileName = fileOrFolderName(callerPath);
  let suffix = TEST_SUFFIXES.find(s => hasText(callerFileName, s, true));

  suffix = ensureHasVal(suffix, trimLines(`webUtilsTestLoad - calling file: ${callerPath} is not a standard test file.
  This function can only be called from a standard test file that includes one of the following in the file name: ${TEST_SUFFIXES.join(', ')}`));

  let sourceFileName = callerFileName.replace(suffix, '.');
  function srcFile(fileName: string) {
    return combine(projectDir(), 'src', 'lib', fileName);
  }

  let candidatePaths = [srcFile(sourceFileName), testCaseFile(sourceFileName)],
    sourcePath = candidatePaths.find(pathExists);

  sourcePath = ensureHasVal(sourcePath, trimLines(`webUtilsTestLoad - target source file consistent with calling test file: ${callerPath} not found.
                                                   tried: ${candidatePaths.join(', ')}`));
  return sourcePath;
}
