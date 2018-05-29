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
  PATH_SEPARATOR,
} from './FileUtils';

import { log, logError, logWarning } from './Logging';

import { hasText, newLine, sameText, show, subStrAfter, subStrBetween,
         trimChars, trimLines, wildCardMatch, replaceAll } from './StringUtils';
import {
        areEqual, callstackStrings, cast, debug, def, delay, ensure,
         ensureHasVal, ensureReturn, fail,
        filePathFromCallStackLine, functionNameFromFunction, isSerialisable,
        waitRetry, TEST_SUFFIXES
      } from './SysUtils';
import { disconnectClient, interact,
          isConnected,  launchWdioServerDetached, launchWebInteractor,
          runClient, sendClientDone, stopSession, waitConnected } from './WebLauncher';
import * as _ from 'lodash';

//$FlowFixMe
import sp from 'step-profiler';



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

export function SSNested(parentSelectorOrElement: SelectorOrElement, manySelector: string): Array<Element> {
    let el = S(parentSelectorOrElement);
    return el.$$(manySelector);
}

function forLabelsMapFromArray(labelLike: Array<ElementWithForAndText>, idedEdits: {}): {} {

  function addLabelLike(accum: {}, label: ElementWithForAndText) {
    let txt = label.text;
    if (txt != null){
      accum[txt] = idedEdits[label.for];
    }
  }
  return _.transform(labelLike, addLabelLike, {} );
}


type ElementWithForAndText =  Element & {for: string, text: string};
type ClassifiedLabels = {
                          forLbls: Array<ElementWithForAndText>,
                          otherLbls: Array<Element>
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
    forTxt == null ?
        accum.otherLbls.push(label) :
        accum.forLbls.push(_.extend(label, {
                                            for: forTxt,
                                            text: label.getText()}));
  }

  return _.transform(nonEdits, clasifyElement,  {
                            forLbls: [],
                            otherLbls: []
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

function addLocationsAndCheckControl(locs: Array<Element>): Array<ElementPlusLocIsCheckControl> {
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

//TODO: refactior
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



function splitEditsNonEdits(accum: [Array<Element>, Array<Element>], element: Element) {
  let tag = element.getTagName(),
      isEditableElement = canEditTag(tag) && canEditTypeAttr(element.getAttribute('type'));

   if (isEditableElement){
    accum[0].push(element);
   }
   else if (isLabelLikeTag(tag)) {
     accum[1].push(element);
   }

  return accum;
}

function defaultFinder(parentElementorSelector: SelectorOrElement, idedEdits: () => {[string]: Element}, edits: Array<Element>, nonEdits: Array<Element>) {

  let editsWithPlaceHolders = _.memoize(addPlaceHolders),
      addCoords = _.memoize(addLocations),
      addCoordsCheckable = _.memoize(addLocationsAndCheckControl),
      addCoordsTxt = _.memoize(addLocationsAndText),
      elementsWithType = _.memoize(addType),
      partitionedForLabelSingleton: ?ClassifiedLabels = null;

  function partitionedForLabels(): ClassifiedLabels {
    partitionedForLabelSingleton = partitionedForLabelSingleton == null ? partitionAddFor(nonEdits) : partitionedForLabelSingleton;
    return partitionedForLabelSingleton;
  }

  function forLabels(): Array<ElementWithForAndText> {
    return partitionedForLabels().forLbls;
  }

  function nonForLabels(): Array<Element> {
    return partitionedForLabels().otherLbls;
  }

  function forLblMap(): {[string]: ElementWithForAndText} {
    return forLabelsMapFromArray(forLabels(), idedEdits);
  }

  let sortedForLabelTextSingleton: ?Array<string> = null;
  function sortedForTexts(): Array<string> {
    sortedForLabelTextSingleton = def(sortedForLabelTextSingleton,
                                                _.chain(forLabels())
                                                  .map('text')
                                                  .sortBy(t => t.length)
                                                  .value());
    return sortedForLabelTextSingleton;
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

export function setForm(
                          parentElementorSelector: SelectorOrElement,
                          valMap: {[string]: SetterValue | ValueWithFinderSetter},
                          setter: SetterFunc = set,
                          finder?: FinderFunc
                        ): void {

  type ElementInfo = {
                     elementMap: {},
                     customSetters: {},
                     trueVals: {},
                     failedMappings: string[]
                   };

  let elements = SSNested(parentElementorSelector, '*'),
      [edits, nonEdits] = _.reduce(elements, splitEditsNonEdits, [[], []]),
      idedEdits = _.memoize(() => finder == null ? _.reduce(edits, addId, {}) : {}),
      findElement = finder == null ? defaultFinder(parentElementorSelector, idedEdits, edits, nonEdits) : finder;


  function deconstructFindElement(accum: ElementInfo, val: SetterValue | ValueWithFinderSetter, key: string): ElementInfo {

    let isCustomObj = _.isObject(val),
        trueVal: SetterValue = cast(isCustomObj ? ensureHasVal(cast(val).value, 'setform custom object must have value property defined') : val),
        customSetter: ?SetterFunc = isCustomObj ? cast(val).setter : undefined,
        finder: FinderFunc = cast(isCustomObj && val.finder != null ? val.finder : findElement),
        target: ?Element = finder(key, edits, nonEdits);

    if (target == null) {
      accum.failedMappings.push(`Could not find matching input element for: ${key}. Looking for element to set to: ${show(trueVal)}`);
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

  function addId(accum: {}, element: Element): {} {
    let id = element.getAttribute('id');
    if (id != null){
      accum[id] = true;
    }
    return accum;
  }

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
export function read(elementOrSelector: SelectorOrElement): boolean | string | null {
  let el = S(elementOrSelector),
      checkable = isCheckable(el);

  return checkable ?
       el.isSelected() :

     elementIs('select')(el) ?
       readSelect(el) :

     // !isCheckable is redundant but here
     // to prevent introducng bugs if statements are reordered
     elementIs('input')(el) && !checkable ?
        el.getValue() :

     isRadioGroup(el) ?
        readRadioGroup(el) :

     fail('read - unhandled element type', el);
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

export function rerun(beforeFuncOrUrl: (() => void) | string | null = null, func: ?(...any) => any, ...params: Array<any>): mixed {
  let result;
  try {
    runClient();
    // Closing - if already closed will do nothing
    if (func == null){
      stopSession();
      return null;
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

function launchSession(before: (() => void) | null | string, func: (...any) => any, ...params: Array<any>) {
   try {
     let caller = firstTestModuleInStack(),
     {
       funcName,
       beforeFuncInfo,
       sourcePath
     } = extractNamesAndSource(before, caller, func);
     launchWdioServerDetached(sourcePath, beforeFuncInfo, funcName, true);
     ensure(waitConnected(30000), 'Timed out waiting on interactor');
     return interact(...params);
   }
  catch (e) {
    fail('launchSession - fail', e)
   }
}

function rerunLoaded(...params: Array<any>) {
   try {
     return interact(...params);
   }
  catch (e) {
    fail('rerunLoaded - fail', e)
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
