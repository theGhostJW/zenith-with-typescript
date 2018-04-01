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

import { log } from './Logging';

import { hasText, newLine, show, subStrAfter, subStrBetween, trimChars,
         trimLines, wildCardMatch, sameText } from './StringUtils';
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
export const S : SelectorOrElement => Element = s => _.isString(s) ? $(s) : ensureReturn(isElement(s), s, `${JSON.stringify(s)} is not a string or Element`);

//$FlowFixMe
export const SS: string => Array<Element>  = s => $$(s);

export type Element = {
  hcode: number,
  sessionId: any,
  getText: () => string,
  getAttribute: string => string | null,
  isSelected: () => boolean,
  click: () => void,
  setValue: (string | number | Array<string|number>) =>  void,
  $$: string => Array<Element>,
  $: string => Element
}

const nameAttribute: Element => string | null = e => e.getAttribute('name');

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

export type SelectorOrElement = string | Element;


// need date later
export function read(elementOrSelector: SelectorOrElement): boolean | string | null {
  let el = S(elementOrSelector);
  return isCheckable(el) ?
            el.isSelected() :
         isRadioGroup(el) ?
            readRadioGroup(el) :
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

export function set(elementSelector: string, value: string | number | Array<string|number>) {
  S(elementSelector).setValue(value);
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
