// @flow

import {
  combine,
  copyFile,
  fileOrFolderName,
  fileToString,
  fromTemp,
  parentDir,
  pathExists,
  projectDir,
  projectSubDir,
  runTimeFile,
  stringToFile,
  tempFileExists,
  testCaseFile,
  toTemp,
  toTempString,
  PATH_SEPARATOR,
} from './FileUtils';

import {log} from './Logging';

import { hasText, lowerCase, lowerFirst, newLine, replaceAll, sameText,
         show, subStrAfter, subStrBetween, trim, trimChars,
         trimLines, upperFirst,
         wildCardMatch } from './StringUtils';
import {
        areEqual, callstackStrings, cast, debug, def, delay, ensure,
         ensureHasVal, ensureReturn, fail,
        filePathFromCallStackLine, forceArray, functionNameFromFunction,
        hasValue, isSerialisable, stringConvertableToNumber,
                                   waitRetry,
                                   TEST_SUFFIXES
      } from './SysUtils';

import { disconnectClient, interact,
          isConnected,  launchWdioServerDetached, launchWebInteractor,
          runClient, sendClientDone, stopSession, waitConnected } from './WebLauncher';
import * as _ from 'lodash';

import clipBoardy from 'clipboardy';

export type SelectorOrElement = string | Element;
export type Element = {
  hcode: number,
  sessionId: any,
  getText: () => string,
  getValue: () => string,
  getTagName: () => string,
  getLocation: () => {x: number, y: number},
  getElementSize: () => {width: number, height: number},
  getHTML: () => string,
  getAttribute: string => string | null,
  isSelected: () => boolean,
  isVisible: () => boolean,
  click: () => void,
  setValue: (string | number | Array<string|number>) => void,
  selectByVisibleText: string  => void,
  selectByValue: string  => void,
  $$: string => Array<Element>,
  $: string => Element
}

//$FlowFixMe
export const S : SelectorOrElement => Element = s => _.isString(s) ? $(s) : ensureReturn(isElement(s), s, `${JSON.stringify(s)} is not a string or Element`);

//$FlowFixMe
export const SS: string => Array<Element> = s => $$(s);

/*
********************************************************************************
******************************* Grid Utils *************************************
********************************************************************************
 */

export type SimpleCellFunc<T> = (cell: Element, rowIndex: number, colIndex: number, row: Element) => T;
export type CellFunc<T> = (cell: Element, colTitle: string, rowIndex: number, colIndex: number, row: Element) => T;
export type ReadResult = boolean | string | null;

// readCell
// cell
// setGrid
// readGrid

export function cell(tableSelector: SelectorOrElement, lookUpVals: {[string]: ReadResult}, valueCol: string): Element | void {
  let tbl = S(tableSelector),
      header = tbl.$('tr'),
      colMap = generateColMap(header),
      colNames: string[] = _.values(colMap),
      lookUpNames = _.keys(lookUpVals),
      missing = lookUpNames.filter(n => !colNames.includes(n));

  ensure(missing.length === 0, `The following lookup columns do not appear in the table header: ${missing.join(', ')}. Possible values are: ${colNames.join(', ')}`);
  ensure(colNames.includes(valueCol), `The value column: ${valueCol} does not appear in the table header. Possible values are: ${colNames.join(', ')}`);


  // Bending a mapper into a reducer so can reuse mapCells
  // rather than rewrite flow control
  let accum = {
    rowUnmatched: false,
    value: (undefined: ?Element),
    result: (undefined: ?Element),
    resultSet: false
  },
  lastRowIdx = -1,
  maxColIndex = colNames.length - 1;

  function reset() {
    accum = {
      rowUnmatched: false,
      value: (undefined: ?Element),
      result: (undefined: ?Element),
      resultSet: false
    }
  }

  function psuedoReducer(cell: Element, colTitle: string, rowIndex: number, colIndex: number, row: Element) {
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
      accum.rowUnmatched = !areEqual(targetVal, read(cell));
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

function generateColMap(row: Element) : {[number]: string} {
  let cells = row.$$('th, td');
  function addCol(accum: {[number]: string}, el : Element, idx: number): {[number]: string} {
    accum[idx] = trim(show(read(el)));
    return accum;
  }
  return _.reduce(cells, addCol, {});
}

export const mapCells = <T>(tableSelector: SelectorOrElement, cellFunc : CellFunc<T>, visibleOnly?: boolean) => mapCellsPriv(tableSelector, cellFunc, visibleOnly);

// Does not allow for invisible first row
function mapCellsPriv<T>(tableSelector: SelectorOrElement, cellFunc : CellFunc<T>, visibleOnly: boolean = true, maybeColMap: ?{[number]: string}): T[][] {
  let tbl = S(tableSelector),
      rows = tbl.$$('tr'),
      visFilter = e => !visibleOnly || e.isVisible(),
      headerRow = _.head(rows),
      dataRows =  _.tail(rows);

  if (headerRow == null) {
    return [];
  } else {
    let colMap: {[number]: string} = def(maybeColMap, generateColMap(headerRow));

    function rowFunc(row: Element, rowIndex: number): (cell: Element, colIndex: number) => T {
      return function eachCellFunc(cell: Element, colIndex: number) {
        return cellFunc(cell, colMap[colIndex], rowIndex, colIndex, row);
      }
    }

   function mapRow(row, rowIndex): T[] {
      let innerCellFunc = rowFunc(row, rowIndex),
          rowCells = row.$$('th, td');

      return _.chain(rowCells)
              .filter(visFilter)
              .map(innerCellFunc)
              .value();
    }

    return _.chain(dataRows)
            .filter(visFilter)
            .map(mapRow)
            .value();

  }
}

export function mapCellsSimple<T>(tableSelector: SelectorOrElement, cellFunc : SimpleCellFunc<T>, visibleOnly: boolean = true): T[][] {
  let tbl = S(tableSelector),
      rows = tbl.$$('tr'),
      visFilter = e => !visibleOnly || e.isVisible();

  function rowFunc(row: Element, rowIndex: number): (cell: Element, colIndex: number) => T {
    return function eachCellFunc(cell: Element, colIndex: number) {
      return cellFunc(cell, rowIndex, colIndex, row);
    }
  }

  function mapRow(row, rowIndex): T[] {
    let innerCellFunc = rowFunc(row, rowIndex),
        rowCells = row.$$('th, td');

    return _.chain(rowCells)
            .filter(visFilter)
            .map(innerCellFunc)
            .value();
  }

  return _.chain(rows)
          .filter(visFilter)
          .map(mapRow)
          .value();
}

 /*
 ********************************************************************************
 ******************************* Other Utils *************************************
 ********************************************************************************
  */


export function SSNested(parentSelectorOrElement: SelectorOrElement, manySelector: string): Array<Element> {
    let el = S(parentSelectorOrElement);
    return el.$$(manySelector);
}

type FormItems =  {
                   allEdits: ElementPlusLocIsCheckControl[],
                   editsRemaining: ElementPlusLocIsCheckControl[],
                   nonEditsRemaining: ElementPlusLocIsCheckControl[],
                   result: {[string]: string},
                   data: {[string]: mixed},
                   dataType: {[string]: string},
                   sumTypes:  {[string]: string[]},
                 };

export const ZZForTest = {
 toPropString : toPropString,
 formatFormInfo: formatFormInfo
}

function toPropString(labelStr: string): string {

   function splitOnNonChars(accum, chr) {
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
     let capsWrds = forceArray(lowerCase(firstWrd), _.tail(words).map(w => upperFirst(lowerCase(w))));
     return capsWrds.join('');
   }
}

function nearestLabel(edit: ElementPlusLocIsCheckControl, nonEditsRemaining: ElementPlusLocIsCheckControl[]) : ?ElementPlusLocIsCheckControl {
  const calcDistance = l => distanceLabelToDataObject(edit, l, '*');

  function bestCandidate(accum, lbl) {
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

  _.reduce(nonEditsRemaining, bestCandidate, {
                                              distance: Number.MAX_VALUE,
                                              result: null
                                            });
}

function placeholderOrLabelText(edit: ElementPlusLocIsCheckControl, nonEditsRemaining: ElementPlusLocIsCheckControl[]) : {altIdStr: string | null, nonEdit: ElementPlusLocIsCheckControl | null} {
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
    log('PLACEHOLDER: ' + ph)
    altIdStr = ph;
    nonEdit = null;
  }

  return {
    altIdStr: altIdStr,
    nonEdit: nonEdit
  }

}

const isRadioOfName = (name: string) => (edit: ElementPlusLocIsCheckControl) => edit.getAttribute('type') == 'radio' && nameAttribute(edit) == name;

function radioOptions(name: string, allEdits: ElementPlusLocIsCheckControl[]): string[] {
  return allEdits
            .filter(isRadioOfName(name))
            .map(e => e.getAttribute('value'))
            .filter(hasValue);
}

function selectOptions(edit: ElementPlusLocIsCheckControl): string[] {
  let options = edit.$$('option');
  return options.map(o => o.getText());
}

function radioValue(name: string, allEdits: ElementPlusLocIsCheckControl[]): string | null {
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
      dataPropName = toPropString(namedRadio ? cast(name) : lblTextkey),
      typeName = upperFirst(dataPropName),
      paramStr = 'params.' + dataPropName;

  editsRemaining = _.tail(editsRemaining);

   if (namedRadio){
     let name: string = cast(nameAttribute(edit));
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
     let val = read(edit),
         isSelect = isSelectElement(edit);

     val = typeof val == 'string' && stringConvertableToNumber(val) ? Number.parseFloat(cast(val)) : val;
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
      elPos = (e0, e1) => e0.top - e1.top != 0 ? e0.top - e1.top : e0.left - e1.left;

 edits = addLocationsAndCheckControl(edits).sort(elPos);
 nonEdits = addLocationsAndCheckControl(nonEdits).sort(elPos);
 return getNextFormItems({
                          allEdits: edits,
                          editsRemaining: edits,
                          nonEditsRemaining: nonEdits,
                          result: {},
                          data: {},
                          dataType: {},
                          sumTypes: {},
                        });
}

function typeDeclaration(types, typeName): string {
  return `export type ${typeName} = \n\t${types.map(s => `'${s}'`).join('\n\t| ')};`
}

function typeLines(dataType: {[string]: string}): string {
  let lines = _.map(dataType, (v, n) => '\t\t' + n + ': ' + v);
  return lines.join(',\n');
}

function formParamLines(result: {[string]: string}): string {
  let lines = _.map(result, (v, n) => '\t\t' + n + ': ' + v);
  return lines.join(',\n');
}

function dataLines(data: {[string]: mixed}, dataType: {[string]: string}) {
  function valShow(name, typeName) {
    let val = show(data[name]);
    return typeName == 'boolean' || typeName == 'number' ? val : "'" + val + "'";
  }

  let lines = _.map(dataType, (v, n) => '\t\t' + n + ': ' + valShow(n,v));
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
  clipBoardy.write(result);
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
export function setForm(parentElementorSelector: SelectorOrElement, valMap: {[string]: SetterValue | ValueWithFinderSetter}, setter: SetterFunc = set, finder?: FinderFunc): void {

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
        trueVal: SetterValue = cast(isCustomObj ? ensureHasVal(cast(val).value, 'setform custom object must have value property defined') : val),
        customSetter: ?SetterFunc = isCustomObj ? cast(val).setter : undefined,
        finder: FinderFunc = cast(isCustomObj && val.finder != null ? val.finder : findElement),
        target: ?Element = finder(key, edits, nonEdits);

    if (target == null) {
      accum.failedMappings.push(`Could not find matching input element for: ${key} is setForm: {${key}: ${show(trueVal)}, ...}`);
    }
    else {
      accum.customSetters[key] = customSetter;
      accum.trueVals[key] = trueVal;
      accum.elementMap[key] = target;
    }

    return accum;
  }

  let infoSeed = {
                    elementMap: {},
                    customSetters: {},
                    trueVals: {},
                    failedMappings: cast([])
                  },
      elementInfo = _.reduce(valMap, deconstructFindElement, infoSeed),
      safeSetter = handledSet(setter, elementInfo.customSetters),
      trueVals = elementInfo.trueVals;

  _.each(elementInfo.elementMap, (e, k) => safeSetter(e, k, trueVals[k]));

  let fails = elementInfo.failedMappings;
  ensure(fails.length === 0, `setForm failures:\n ${fails.join('\n')}`);
}


function forLabelsMapFromArray(labelLike: ElementWithForAndText[], idedEdits: {[string]: Element}): {} {

  function addLabelLike(accum: {}, label: ElementWithForAndText): {} {
    let lblTxt = label.text;
    if (lblTxt != null){
      accum[lblTxt] = idedEdits[label.for];
    }
    return accum;
  }
  return labelLike.reduce(addLabelLike, {});
}


type ElementWithForAndText =  Element & {for: string, text: string};
type ClassifiedLabels = {
                          forLbls: Array<ElementWithForAndText>,
                          nonForLbls: Array<Element>
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
  return allModifiers.includes(modifier) ? [cast(modifier), str.slice(2) ]: ['*', str];
}

function partitionAddFor(nonEdits: Array<Element>): ClassifiedLabels {

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
function addPlaceHolders(edits: Array<Element>) : Array<ElementWithPlaceHolder>  {

  function addIfPlaceHolder(accum, elm) : Array<ElementWithPlaceHolder> {
    let ph = elm.getAttribute('placeholder');
    if (ph != null){
      cast(elm).placeholder = ph;
      accum.push(elm);
    }
    return cast(accum);
  }

  let unsorted: Array<ElementWithPlaceHolder> = edits.reduce(cast(addIfPlaceHolder), []);
  return _.sortBy(unsorted, e => e.placeholder.length);
}

type ElementPlusLoc = $Subtype<Element> & {
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

type ElementPlusLocIsCheckControl = $Subtype<ElementPlusLoc> & {
                                            isCheckControl: boolean
                                          }

function addLocation(el:$Subtype<Element>): ElementPlusLoc {
  let loc = el.getLocation(),
      size = el.getElementSize();

  el.x = loc.x,
  el.y = loc.y;
  el.left = loc.x;
  el.right = loc.x + size.width;
  el.top = loc.y;
  el.bottom = loc.y + size.height;
  el.width = size.width;
  el.height = size.height;
  el.verticalCentre = loc.y + size.height/2;
  el.horizontalCentre = loc.x + size.width/2;
  return el;
}

function addLocationsAndCheckControl(locs: Element[]): ElementPlusLocIsCheckControl[] {
  return locs.
            map(addLocation).
            map(el => {
                        el.isCheckControl = isCheckable(el);
                        return el;
                      });
}

function addLocations(locs: Array<Element>): Array<ElementPlusLoc> {
  return locs.map(addLocation);
}

type ElementPlusLocPlusText = $Subtype<Element> & {x: number, y: number, text: string}
function addLocationsAndText(locs: Array<Element>): Array<ElementPlusLocPlusText> {
  return _.sortBy(addLocations(locs).map(e => {
                                      e.text = e.getText();
                                      return e;
                                    }),
                                    e => e.text.length
                                  );
}

function pointsOverlap(lowerBound1, upperBound1, lowerBound2, upperBound2){

  function liesWithin(target, lowerBound, upperBound){
    return (target >= lowerBound && target <= upperBound);
  }

  return  liesWithin(lowerBound1, lowerBound2, upperBound2) ||
          liesWithin(upperBound1, lowerBound2, upperBound2) ||
          liesWithin(lowerBound2, lowerBound1, upperBound1) ||
          liesWithin(upperBound2, lowerBound1, upperBound1);
}

function centrePassesThroughTarget(candidate: ElementPlusDistance, targetLabel: ElementPlusLocPlusText, directionModifier: LabelSearchDirectionModifier): boolean {

  let horizonallyAligned = targetLabel.horizontalCentre < candidate.right && targetLabel.horizontalCentre > candidate.left,
      verticallyAligned = targetLabel.verticalCentre > candidate.top && targetLabel.verticalCentre < candidate.bottom;

  return (directionModifier === 'A' || directionModifier === 'B') ?  horizonallyAligned :
         (directionModifier === 'R' || directionModifier === 'L') ?  verticallyAligned  :
         horizonallyAligned || verticallyAligned;
}

function distanceLabelToDataObject(candidate, targetLabel, directionModifier: LabelSearchDirectionModifier){
  function veritcalOverlap(targetLabel, candidate){
    return pointsOverlap(candidate.top, candidate.bottom, targetLabel.top, targetLabel.bottom);
  }

  function editPixToRight(candidate, targetLabel){
    let result = targetLabel.right <= candidate.left && veritcalOverlap(targetLabel, candidate) ?
           candidate.left - targetLabel.right: null;
    return result;
  }

  function editPixToLeft(candidate, targetLabel){
    let result = targetLabel.left >= candidate.left /* using .left not .right because some labels envelop their control esp clickable controls */ && veritcalOverlap(targetLabel, candidate) ?
                  Math.max(targetLabel.left - candidate.right, 0) : null;
    return result;
  }

  function horizontalOverlap(targetLabel, candidate){
    return pointsOverlap(candidate.left, candidate.right, targetLabel.left, targetLabel.right);
  }

  function editPixAbove(candidate, targetLabel){
    return targetLabel.top >= candidate.bottom  && horizontalOverlap(targetLabel, candidate) ?
          targetLabel.top - candidate.bottom: null;
  }

  function editPixBelow(candidate, targetLabel){
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
      if (candidate.isCheckControl){
        var pixLeft = editPixToLeft(candidate, targetLabel); // candidate to left of lbl
        if (pixLeft != null && (distanceFromTarget == null || pixLeft < distanceFromTarget) ){
          distanceFromTarget = pixLeft;
        }
      }
      return distanceFromTarget;
  }
}

type ElementPlusDistance = $Subtype<Element> & {distanceFromTarget: ?number, labelCentred: boolean}

function nearestObject(targetLabel: ElementPlusLocPlusText, directionModifier: LabelSearchDirectionModifier, candidate: ElementPlusDistance, bestSoFar: ElementPlusDistance | null){
  let distanceFromTarget = distanceLabelToDataObject(candidate, targetLabel, directionModifier);

  const distanceFromTargetCloser = () => {
    return distanceFromTarget == null || bestSoFar == null ? false :
              distanceFromTarget < bestSoFar.distanceFromTarget ||
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

function closestObject(targetLabel: ElementPlusLocPlusText, edts: Array<ElementPlusLocIsCheckControl>, directionModifier: LabelSearchDirectionModifier): Element | null {
  function chooseBestObject(bestSoFar, candidate){
    return nearestObject(targetLabel, directionModifier, candidate, bestSoFar);
  }
  return edts.reduce(chooseBestObject, null);
}

function nearestEdit(key: string, edts: Array<ElementPlusLoc>, labels: Array<ElementPlusLocPlusText>,
                      wildcard: boolean, lblModifier: LabelSearchDirectionModifier): Element | null {
  // Note labels previously sorted by text length so will pick the match
  //with the shortest label
  let pred : ElementPlusLocPlusText => boolean = wildcard ? e => wildCardMatch(e.text, key) : e => e.text === key,
      targetLabel = _.find(labels, pred);

  return targetLabel == null ? null : closestObject(targetLabel, edts, lblModifier);
}

type ElementWithType = Element & {type: string};
function addType(elements: Element[]): ElementWithType[] {
  function addEl(accum: ElementWithType[], e: Element) {
    let type = e.getAttribute('type');
    if (type != null){
      cast(e).type = type;
      accum.push(cast(e));
    }
    return accum;
  }
  return elements.reduce(addEl, []);
}

function addId(accum: {[string]: Element}, element: Element): {[string]: Element} {
   let id = idAttribute(element);
   if (id != null){
     accum[id] = element;
   }
   return accum;
}

export type SetterFunc = (Element, string | number | boolean) => void;
export type FinderFunc = (key: string, editable: Array<Element>, nonEditable: ?Array<Element>) => ?Element;
export type SetterValue = string | number | boolean;
export type ValueWithFinderSetter = {
  value: SetterValue,
  finder?: FinderFunc,
  setter?: SetterFunc
}

export function predicateToFinder(pred: (key: string, element: Element) => bool): FinderFunc {
  return function finder(key: string, editable: Array<Element>, nonEditable: ?Array<Element>): ?Element {
    return editable.find(element => pred(key, element));
  }
}

export function withSetter(value: SetterValue | ValueWithFinderSetter, setter: SetterFunc): ValueWithFinderSetter {
  return _.isObject(value) ?
                    {
                      value: ensureHasVal(cast(value).value, 'withSetter value object value property is null or undefined'),
                      finder: cast(value).finder,
                      setter: setter
                    } :
                    {
                      value: cast(value),
                      setter: setter
                    };

}

export function withFinder(value: SetterValue | ValueWithFinderSetter, finder: FinderFunc): ValueWithFinderSetter {
  return _.isObject(value) ?
                    {
                      value: ensureHasVal(cast(value).value, 'withFinder value object value property is null or undefined'),
                      finder: finder,
                      setter: cast(value).setter
                    } :
                    {
                      value: cast(value),
                      finder: finder
                    };
}

export function withPredicate(value: SetterValue | ValueWithFinderSetter, predicate: (key: string, element: Element) => bool): ValueWithFinderSetter {
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

function defaultFinder(parentElementorSelector: SelectorOrElement, idedEdits: () => {[string]: Element}, edits: Array<Element>, nonEdits: Array<Element>) {

  const partitionAddForNonEdits = () => partitionAddFor(nonEdits),
        forLblMapFunc: () => {[string]: ElementWithForAndText} = () => forLabelsMapFromArray(forLabels(), idedEdits());

  let editsWithPlaceHolders = _.memoize(addPlaceHolders),
      addCoords = _.memoize(addLocations),
      addCoordsCheckable = _.memoize(addLocationsAndCheckControl),
      addCoordsTxt = _.memoize(addLocationsAndText),
      elementsWithType = _.memoize(addType),
      partitionedForLabels = _.memoize(partitionAddForNonEdits),
      forLblMap = _.memoize(forLblMapFunc),
      sortedForTexts = _.memoize(sortedForTextsFunc);

  function forLabels(): Array<ElementWithForAndText> {
    return partitionedForLabels().forLbls;
  }

  function nonForLabels(): Array<Element> {
    return partitionedForLabels().nonForLbls;
  }



  function sortedForTextsFunc(): string[] {
    return _.chain(forLabels())
                              .map('text')
                              .sortBy(t => t.length)
                              .value();
  }

  return function defaultFinder(keyWithLabelDirectionModifier: string, edits: Array<Element>, nonEditable: Array<Element>): ?Element {
    // Ided fields and search modifiers (e.g. A~Female ~ female label above)
    let [lblModifier, key] = sliceSearchModifier(keyWithLabelDirectionModifier),
        result = idedEdits()[key],
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

      let lblText = sortedForTexts().find(t => wildCardMatch(t, key));
      result = lblText == null ? null : forLblMap()[lblText];
    }

    // Placeholders
    if (result == null){
      let pred : ElementWithPlaceHolder => boolean = wildcard ? e => wildCardMatch(e.placeholder, key) : e => e.placeholder === key;
      result = editsWithPlaceHolders(edits).find(pred);
    }

    // Proximal labels - non for
    if (result == null){
      //let labels = addCoordsTxt(DEBUG_ALL_LABELS);
      let labels = addCoordsTxt(nonForLabels()),
          edts = addCoordsCheckable(edits);
      result = nearestEdit(key, edts, labels, wildcard, lblModifier);
    }

    return result;
  }

}

function handledSet(setter: SetterFunc, customSetters: {[string]: SetterFunc}) {
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

function findNamedRadioGroup(searchTerm: string, edits: Array<ElementWithType>, wildCard: boolean) : Element | null {
  // string could be group name
  let atrPred = wildCard ?
                s => s != null && wildCardMatch(s, searchTerm) :
                s => s === searchTerm,
      namedRadios = edits.filter(e => e.type === 'radio' && atrPred(nameAttribute(e)));
  return namedRadios.length > 0 ? commonParent(namedRadios) : null;
}

function commonParent(radios: $Subtype<Element>[]) : Element | null {
  let radiosLength = radios.length;
  if (radiosLength === 0) {
    return null;
  }

  let fst = radios[0],
      name = nameAttribute(fst);

  function parentOfAll(chld) {
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

function canEditTypeAttr(typeAttr: ?string) {
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

export const nameAttribute: Element => string | null = e => e.getAttribute('name');
export const idAttribute: Element => string | null = e => e.getAttribute('id');

export function setSelect(elementOrSelector: SelectorOrElement, visText: string): void {
  let el = S(elementOrSelector),
      isSet = false;

  try {
    el.selectByVisibleText(visText);
    isSet = true;
  } catch (e) {
    if (!hasText(e.message,'An element could not be located')){
      fail(e);
    }
  }

  if (!isSet){
    try {
      el.selectByValue(visText);
    } catch (e) {
      if (hasText(e.message,'An element could not be located')){
        e.message = 'Element could not be located either by visible text or by value.' + newLine() +
                    e.message;
      }
      fail('Element could not be located either by visible text or by value.', e);
    }
  }

}

function radioElements(containerElementOrSelector: SelectorOrElement, groupName: string | null = null, wantUniqueNameCheck: boolean = true): Array<Element> {
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

function radioLabels(containerElementOrSelector: SelectorOrElement, candidateRadioElements: Array<Element>) {

  let el = S(containerElementOrSelector),
      labels = el.$$("[for]"),
      radioIds = candidateRadioElements.reduce(addId, {});

 function idExists(lbl) {
   let forAttr = lbl.getAttribute('for');
   return forAttr != null && radioIds[forAttr];
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


export function radioItemVals(containerElementOrSelector: SelectorOrElement, groupName: string | null = null) : Array<string> {
  // type checker wants to handle nulls as well which are not realistic
  return cast(radioElements(containerElementOrSelector, groupName).map(e => e.getAttribute('value')));
}


export function isElement(candidate: mixed): boolean {
  return candidate != null &&
        _.isObject(candidate) &&
        !_.isArray(candidate) && (
          !_.isUndefined(cast(candidate).ELEMENT) ||
          !_.isUndefined(cast(candidate).hCode)
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

export function setInput(elementOrSelector: SelectorOrElement, value: string | number) {
  let el = S(elementOrSelector);
  el.setValue(value);
}

/*
WebElement parent = we.findElement(By.xpath(""));

 */

export function parent(elementOrSelector: SelectorOrElement): Element | null {

  let el = S(elementOrSelector),
      result = null;

  try {
    result = el.$('..');
  } catch (e) {
     let eTxt = e.toString(),
         known = hasText(eTxt, 'attached to the DOM', true) ||
                  hasText(eTxt, 'element could not be located', true);

     if (known){
       result = null;
     }
     else {
       fail('parent function failed', e);
     }
  }

  return result;
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
  let el =  S(elementOrSelector),
      checkable = isCheckable(el),
      bool = _.isBoolean(value);

  const isIsNot = b => `is${b ? '' : ' not'}`;
  if (checkable !== bool){
    fail(`set - type mismatch - value type ${isIsNot(bool)} boolean but element ${isIsNot(checkable)} a radio button or checkbox.`);
  }

  return checkable ?
    setChecked(el, cast(value)):

     elementIs('select')(el) ?
       setSelect(el, cast(value)) :

     // !isCheckable is redundant but here
     // to prevent introducng bugs if statements are reordered
     elementIs('input')(el) && !checkable ?
        setInput(el, cast(value)) :

     isRadioGroup(el) ?
        setRadioGroup(el, cast(value)):

     fail('read - unhandled element type', el);
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

function elementType(el: Element) {
  return def(el.getAttribute('type'), '');
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
      type = def(el.getAttribute('type'), ''),
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

export const clickLink = (displayTextOrFunc: string | string => boolean) => linkByText(displayTextOrFunc).click();

export function linkByText(displayTextOrFunc: string | string => boolean): Element {
  let pred : string => boolean = typeof displayTextOrFunc == 'string' ? elText => wildCardMatch(elText, cast(displayTextOrFunc)) : displayTextOrFunc,
      result = links().find(l => pred(l.getText()));

  if (result == null){
    fail(
          'linkByText Failed',
          'could not find a link with display text matching: ' + show(displayTextOrFunc)
        );
    // just to keep flow hapy will never return
    return cast({});
  }
  else {
    return result;
  }
}

export function links() {
  return SS('[href]');
}

export function url(url: string) {
  browser.url(url);
}

export function click(elementSelector: string) {
  browser.click(elementSelector);
}

/***********************************************************************************************
******************************************** LOADING *******************************************
************************************************************************************************/

function signature(beforeFuncOrUrl: (() => void) | string | null = null, func: ?(...any) => any) {
  return {
    before: _.isFunction(beforeFuncOrUrl) ? functionNameFromFunction(beforeFuncOrUrl) : show(beforeFuncOrUrl),
    target: functionNameFromFunction(func)
  }
}

const webDriverIOParamsSignatureFileName = 'webioParams.yaml';

function saveSignature(sig) {
  toTemp(sig, webDriverIOParamsSignatureFileName, false, false);
}

function signatureChanged(sig) {
  return tempFileExists(webDriverIOParamsSignatureFileName) ? !areEqual(fromTemp(webDriverIOParamsSignatureFileName, false), sig) : true;
}

export function rerun<T>(beforeFuncOrUrl: (() => void) | string | null = null, func: ?(...any) => T, ...params: Array<any>): T {
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

export function browserEx(func: (...any) => any, ...params: Array<any>): mixed {
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

function firstTestModuleInStack(): string {
  let fullStack = callstackStrings(),
      line = fullStack.find(s => TEST_SUFFIXES.some(suffix => hasText(s, suffix)));

  return filePathFromCallStackLine(
      ensureHasVal(line, `Could not find test module in callstack the calling function can only be executed from a test module: ${fullStack.join(newLine())}`)
  );
}

function launchSession<T>(before: (() => void) | null | string, func: (...any) => T, ...params: Array<any>): T {
   try {
     let caller = firstTestModuleInStack(),
     {
       funcName,
       beforeFuncInfo,
       sourcePath
     } = extractNamesAndSource(before, caller, func);
     launchWdioServerDetached(sourcePath, beforeFuncInfo, funcName, true);
     ensure(waitConnected(30000), 'Timed out waiting on interactor');
     return cast(interact(...params));
   }
  catch (e) {
    return fail('launchSession - fail', e)
   }
}

function rerunLoaded<T>(...params: Array<any>): T {
   try {
     return interact(...params);
   }
  catch (e) {
    return fail('rerunLoaded - fail', e)
   }
}


function extractNamesAndSource(before: (() => void) | string | null, caller: string, func: (...any) => any) {
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

function browserExBase(before: (() => void) | null | string, caller: string, func: (...any) => any, ...params: Array<any>): mixed {
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
  function srcFile(fileName) {
    return combine(projectDir(), 'src', 'lib', fileName);
  }

  let candidatePaths = [srcFile(sourceFileName), testCaseFile(sourceFileName)],
    sourcePath = candidatePaths.find(pathExists);

  sourcePath = ensureHasVal(sourcePath, trimLines(`webUtilsTestLoad - target source file consistent with calling test file: ${callerPath} not found.
                                                   tried: ${candidatePaths.join(', ')}`));
  return sourcePath;
}
