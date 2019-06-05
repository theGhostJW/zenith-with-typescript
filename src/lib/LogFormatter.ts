import { def, objToYaml, ensure, 
         seekInObj, forceArray, areEqual, reorderProps, AnySpecifier } from './SysUtils';
import { newLine, trimChars, show, replaceAll, sameText, hasText } from './StringUtils';
import { durationFormatted } from './DateTimeUtils';
import { fileOrFolderName } from './FileUtils';
import { EXECUTING_INTERACTOR_STR, hasIssues } from './LogParser';
import { StateStage, ErrorsWarningsDefects, RunSummary, FullSummaryInfo, Iteration, IssuesList } from '../lib/LogParserTypes';
const _ = require('lodash');

export const testPrivate = {
  headerLine: headerLine,
  summaryBlock: summaryBlock,
  padProps: padProps
}

export function filterLogText(summary: FullSummaryInfo): string {
  let fl = seekInObj(summary, 'filterLog');
  return majorHeaderBlock('Filter Log', false) + newLine(2) + objToYaml(fl);
}

export function script(iteration: Iteration): string | undefined {
  return show(seekInObj(iteration.testConfig, 'script'));
}


export function iteration(iteration: Iteration, fullSummary: FullSummaryInfo, lastScript?: string | null): string {
  let script = show(seekInObj(iteration.testConfig, 'script')),
      header = '';

  const summaryInfo = seekInObj(fullSummary, 'testSummaries', script),
        seekSumStr = (str: string) => show(seekInObj((<any>summaryInfo), str)),
        mocked = iteration.mocked;

  if (!sameText(script, def(lastScript, <string>''))){
    header = majorHeaderBlock(summaryInfo == null ? `NO SUMMARY INFO AVAILABLE FOR ${script}`:
                `${deUnderscore(script)} - ${durationFormatted(seekSumStr('startTime'), seekSumStr('endTime'))}`, false) +
             newLine(2) + 'stats:' + newLine() + padProps(def(seekInObj(summaryInfo, 'stats'), {}), false, '  ');
  }

  header = header + newLine(2) + minorHeaderBlock(`${script} -${mocked ? ' MOCKED -' : ''} Item ${iteration.item.id} - ${durationFormatted(iteration.startTime, iteration.endTime)}`, true);

  let issues = issueTypes(iteration.issues),
      notes = seekInObj(iteration, 'item', 'notes'),
      hasNotes = notes != null,
      itheader = {
                    when: seekInObj(iteration, 'item', 'when'),
                    then: seekInObj(iteration, 'item', 'then'),
                    notes: notes,
                    status: joinIssues(issues)
                  },
        itHeaderText = padProps(hasNotes ? itheader : _.omit(itheader, 'notes'), true, '', hasNotes);


  let lineX2 = newLine(2),
      subDivider =  lineX2 + SUB_DIVIDER + lineX2,
      dState = seekInObj(iteration, 'dState');

  function titledText(obj: any, title: string, nullText: string): string {
    return title + (mocked ? ' MOCKED' : '') + ':' + newLine() +
            (obj == null ? '  ' + nullText : padLines(show(obj), '  '));
  }

  return header + lineX2 +
                    itHeaderText +
                    lineX2 +
                    valText(iteration, mocked) +
                    lineX2 +
                    titledText(objToYaml(dState), "dState", 'Parse Error: dState not Found') +
                    subDivider +
                    titledText(issuesText(iteration.issues, dState), 'issues', 'No Issues') +
                    subDivider +
                    titledText(objToYaml(_.omit(seekInObj(iteration, 'item'), 'id', 'validators', 'when', 'then', 'notes')), 'item', 'Parse Error Item not Found') +
                    subDivider +
                    titledText(objToYaml(seekInObj(iteration, 'apState')), 'apState', 'Parse Error apState not Found');
}


function padLines(str: string | null | undefined, padding: string): string {
  return str != '' && str != null ? str.split(newLine()).map(l => padding + l).join(newLine()) : ''
}

const VALIDATION_STAGE: StateStage = StateStage.Validation;

function issuesText(issues: IssuesList, dState: any): string {

  function removeEmptyArrays(issue: ErrorsWarningsDefects) {
    let result = _.chain(issue)
                   .toPairs()
                   .filter((p: any) => !areEqual(p[1], []))
                   .fromPairs()
                   .value();

    if (result.infoType == VALIDATION_STAGE){
      result.dState = dState;
      result = reorderProps(result, 'name', 'infoType', 'dState');
    }

    return result;
  }

  let realIssues = issues.filter(i => hasIssues(i)).map(removeEmptyArrays),
      result = show(realIssues),
      lines = result.split(newLine());

  let nameEncountered = false,
      timestampEncountered = false;

  function pushLine(accum: string[], str: string) {
    if (str.includes('- name:')) {
      if (nameEncountered){
        accum.push('');
      }
      nameEncountered = true;
      timestampEncountered = false;
    }
    else if (str.includes('- timestamp:')) {
      if (timestampEncountered){
        accum.push('');
      }
      timestampEncountered = true;
    }
    accum.push(str);
  }

  lines = _.transform(lines, pushLine, []);
  return trimChars(lines.join(newLine()), [newLine()])
}

function valText(iteration: Iteration, mocked: boolean): string {

  function summarise(issue: ErrorsWarningsDefects) {
    return {
      name: issue.name,
      infoType:  issue.infoType,
      issues: issueTypes(issue)
    }
  }

  let issuesInfo = _.map(iteration.issues, summarise),
      isIntIssue = (issueSum: any) => issueSum.name === EXECUTING_INTERACTOR_STR,
      interactorIssues = issuesInfo.find(isIntIssue),
      result: {[k:string]: string} = {};

  if (interactorIssues != null && interactorIssues.issues !== 'passed'){
    result.interactor = joinIssues(interactorIssues.issues);
  }

  //Non interactor issues
  function addIssue(issue: any) {
    result[sameText(issue.infoType, 'validation') ? deUnderscore(issue.name) : issue.name] = joinIssues(issue.issues);
  }

  issuesInfo.filter((i: any) => !isIntIssue(i)).forEach(addIssue);

  let passedValidators = seekInObj(iteration, 'passedValidators');
  if (passedValidators != null){
    (<any>passedValidators).forEach((s: string) => result[deUnderscore(s)] = 'passed');
  }

  return `validation${mocked ? ' MOCKED' : ''}:` + newLine() + padProps(result, true, '  - ');
}

function joinIssues(issues: string[]) {
  return issues.length > 0 ? issues.join(', ') : 'passed';
}

type IssuesMap = {
                  errors: boolean,
                  type2Errors: boolean,
                  warnings: boolean,
                  knownDefects: boolean
                };

function issueTypes(issues: IssuesList | ErrorsWarningsDefects) {

  function updateMap(accum: IssuesMap, errInfo: ErrorsWarningsDefects): IssuesMap {
    function updatePresence(val: any, key: string): boolean {
      let issueType = (<any>errInfo)[key];
      return val || issueType != null && issueType.length > 0;
    }
    return _.mapValues(accum, updatePresence);
  }

  return _.chain(forceArray(issues))
                .reduce(updateMap, {errors: false, type2Errors: false, warnings: false, knownDefects: false})
                .toPairs()
                .filter((p: any) => p[1])
                .map((p: any) => p[0])
                .value();
}

function deUnderscore(str: string): string {
  return replaceAll(str, '_', ' ')
}

export function outOfTestError(outOfTest: { issues?: ErrorsWarningsDefects[] }): string {
  let issues = outOfTest.issues;

  if (issues == null){
    return 'UNEXPECTED FORMAT ENCOUNTETRED' + newLine() + objToYaml(outOfTest)
  }
  else {

    function nullEmptyAndNoArraysOmitUnwantedProps(val: any) {
      return _.isArray(val) && val.length > 0 ? _.map(val, (info: {}) => padProps(_.omit(info, 'level', 'subType', 'popControl'), true, '  ??? ')) : undefined;
    }

    let resultObj = issues.map(erd => _.mapValues(erd, nullEmptyAndNoArraysOmitUnwantedProps));

    function combineProps(obj: any) {
      function makeRec(key: string) {
        return key + ':' + newLine() + replaceAll(obj[key].join(newLine()).replace('???', '-'), '???', ' ');
      }

      let keys = _.keys(obj).filter((k: string) => obj[k] != null),
          recs = _.map(keys, makeRec);

      return recs.join(newLine(2));
    }

    let resultStr = resultObj.map(combineProps).join(newLine());
    return majorHeaderBlock('Out of Test Issues', true) + newLine(2) + resultStr;
  }
}

function toStringPairs(obj: any): [string, string][] {

  const toStr = (val: any) => typeof val == 'object' ? replaceAll(show(val), newLine(), '') : show(val);

  return _.chain(obj)
          .toPairs()
          .map((kv: [any, any]) => [toStr(kv[0]), toStr(kv[1])])
          .value()
}

function padProps(obj: {}, leftJustify: boolean = true, prefix: string = '', handleMultiLine: boolean = false): string {
  function maxlenOfIdx(idx: 0 | 1) {
    return (accum: any, kv: [any, any]) => Math.max(kv[idx].length, accum)
  }

  let pairs = toStringPairs(obj),
      padding = {};

  function multLineRule(val: string){
    return handleMultiLine && hasText(val, newLine(), true);
  }

  if (leftJustify){

    function totalKVLenPlus1Map(maxLen: number) {
      return function totalKeyLenPlus1(accum: {}, kv: [string, string]) {
        let [k, v] = kv;

        if (multLineRule(v)){
          return accum;
        }

        (<any>accum)[k] = maxLen + 1 - k.length;
        return accum;
      }
    }

    let maxLen = _.reduce(pairs, maxlenOfIdx(0) , 0);
    padding = _.reduce(pairs, totalKVLenPlus1Map(maxLen), {});
  }
  else {

    function totalKVLenPlus1Map(maxLen: number) {
      return function totalKVLenPlus1(accum: {}, kv: [string, string]) {
        let [k, v] = kv;

        if (multLineRule(v)){
          return accum;
        }


        (<any>accum)[k] = maxLen + 1 - k.length - v.length;
        return accum;
      }
    }

    let maxLen = _.reduce(pairs, maxlenOfIdx(0) , 0) + _.reduce(pairs, maxlenOfIdx(1) , 0);
    padding = _.reduce(pairs, totalKVLenPlus1Map(maxLen), {});
  }

  function padValStringify(kv: [string, any]) {
    let [k, v] = kv;

    if (multLineRule(v)){
      v = newLine() + padLines(v, prefix + '  ')
      return prefix + k + ':' + v;
    }
    else {
      let pad = ' '.repeat((<any>padding)[k]);
      return prefix + k + ':' + pad + v;
    }
  }

  return _.map(pairs, padValStringify).join(newLine());
}

function headerBlock(headerFunc: (s:string, b:boolean) => string) {
  return function headerBlock(txt: string, wntPcnt: boolean) {
    return headerFunc('', false) + newLine() +
              headerFunc(txt, wntPcnt) + newLine() +
              headerFunc('', false);
  }
}

export function summaryBlock(summary: FullSummaryInfo): string {
  let runSummary = (<RunSummary>seekInObj(summary, 'runSummary'));
  if (runSummary == null){
    return '';
  }
  else {
    let {
        startTime,
        endTime,
        runConfig,
        stats
      } = runSummary,
      name = def(runConfig['name'], <string>'Unnamed Test Run'),
      headerLine = `Summary - ${name}`,
      heading = majorHeaderBlock(headerLine, false);

  let basic = {
        start: startTime,
        end: endTime,
        duration: durationFormatted(startTime, endTime),
        raw: '.\\' + fileOrFolderName(summary.rawFile)
      };

  return heading + newLine(2) +
          padProps(basic) + newLine(2) +
          'runConfig:' + newLine() +
          padProps(_.omit(runConfig, 'name'), true, '  ') + newLine(2) +
          'stats:' + newLine() +
          padProps(stats, false, '  ').replace('  iterations:', '\n  iterations:').replace('  outOfTestErrors:', '\n  outOfTestErrors:');

  }

}

const SUB_DIVIDER = '#' + headerLine('', '-', false, 79);
const majorHeader = (header: string, wantPrcntChar: boolean): string => standardHeader(header, '#', wantPrcntChar);
const minorHeader = (header: string, wantPrcntChar: boolean): string => (wantPrcntChar ? '#%' : '#' ) + headerLine(header, '-', false, wantPrcntChar ? 78 : 79);
const standardHeader = (header: string, padder: string, wantPrcntChar: boolean): string => headerLine(header, padder, wantPrcntChar, 80);

const majorHeaderBlock = headerBlock(majorHeader);
const minorHeaderBlock = headerBlock(minorHeader);

function headerLine(header: string, padder: string, wantPrcntChar: boolean, len: number): string {
  ensure(padder.length === 1, 'Padder length must be 1');

  let result = '';
  if (header.length === 0) {
    result = padder.repeat(len) ;
  }
  else {
    let pHeadLen = header.length + 2,
        pLen = Math.ceil((len - pHeadLen) / 2),
        suffix = padder.repeat(pLen),
        prefix = (suffix + ' ' + header +  ' ' + suffix).length > len ? suffix.slice(0, -1) : suffix;

    result = prefix + ' ' + header +  ' ' + suffix;
  }

  return wantPrcntChar ? result.replace(padder + padder, padder + '%'): result;
}
