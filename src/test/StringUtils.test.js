// @flow

import {chk, chkEq, chkEqJson, chkException, chkExceptionText, chkFalse, chkHasText} from '../lib/AssertionUtils';
import {datePlus, now, strToMoment, timeToSQLDateTimeSec, today} from '../lib/DateTimeUtils';
import { toTemp, toTempString } from '../lib/FileUtils';
import {appendDelim, arrayToString, bisect, capFirst, convertXmlToSimpleTemplate, createGuid, createGuidTruncated, endsWith, hasText,
  loadSectionedTemplate, loadTemplate, loadTemplatePositional, lowerCase, lowerFirst, newLine, parseCsv, propsObjectStringFromXml,
  removeSection, replace, sameText, standardiseLineEndings, startsWith, stringToArray, stringToGroupedTable,
  stringToGroupedTableLooseTyped, stringToGroupedTableLooseTypedDefinedTabSize, stringToGroupedTableMap, stringToTable,
  stringToTableLooseTyped, stringToTableMap, subStrAfter, subStrBefore, subStrBetween, templateSectionParts, toString,
  trim, trimChars, trimLines, upperCase, upperFirst, wildCardMatch, DEFAULT_CSV_PARSE_OPTIONS} from '../lib/StringUtils';
import {areEqual, debug, deepMapValues, def, flattenObj, forceArray} from '../lib/SysUtils';
import { GROUPED_TABLES, SAMPLE_TEMPLATE, SAMPLE_XML, SECTIONED_TABLE, SIMPLE_TABLE, SIMPLE_TABLE_BIG_TABS, TABLES } from '../test/StringUtils.data.test';
import * as _ from 'lodash'

describe('propsObjectStringFromXml', () => {

  it('converts xml to valid object', () => {
    let result = propsObjectStringFromXml(SAMPLE_XML);
    console.log(result);
    chkHasText(result, 'formattedNameType: null,')
  });

});

describe('convertXmlToSimpleTemplate', () => {

  it('simple', () => {
    let result = convertXmlToSimpleTemplate(SAMPLE_XML);
    toTempString(result)
  });

});

describe('loadSectionedTemplate', () => {

  const DEMO_DATA = {
              batch: {
                batchId: createGuidTruncated(20),
                extractDateTime: timeToSQLDateTimeSec(now()),
                providerReference: createGuidTruncated(20),
                notificationEmail: 'test@rrrr.com',
                version: 2.02,
                mode: 'T',
                batchType: 'I',
                providerName: createGuidTruncated(20),
                industryType: 'F',
                signatoryId: createGuidTruncated(20),
                signatorySubId: createGuidTruncated(20),
                contactName: createGuidTruncated(20),
                contactEmail: 'mainContactEmail@myServer.com',
                contactPhone: '98288888'
              },
              accounts: {
                            recordId: 1,
                            correctionFlag: 'N',
                            accountNumber: createGuidTruncated(20),
                            accountSubId: 'ACCS14082015',
                            status: 'A',
                            statusDate: timeToSQLDateTimeSec(today()),
                            creditPurpose: 'R',
                            accountHolderCount: 1,
                            accountType: 'AL',
                            openDate: timeToSQLDateTimeSec(datePlus(today(), -(20*30))),
                            closedDate: '',
                            paymentType: 'P',
                            creditType: 'F',
                            termOfLoan: 640,
                            loanPaymentMethod: 'C',
                            unlimitedCredit: 'N',
                            termType: 'M',
                            securedCredit: 'S',
                            paymentFrequency: 'M',
                            maximumAmountOfCreditAvailable: 100000,

                            creditLimit: 300000,
                            accountName: createGuidTruncated(20),
                            customerCount: 1,
                            customer: {
                              customerId: 244324,
                              startDate: timeToSQLDateTimeSec(datePlus(today(), -(20*30))),
                              formattedName: {
                                  formattedNameType: 'P',
                                  family: createGuidTruncated(20),
                                  first: createGuidTruncated(20),
                                  middle: createGuidTruncated(20),
                                  title: 'Mr'
                                },
                                relationship: "1",
                                seriousCreditInfringement: false,
                                birthDate: "2070-01-01",
                                deceased: 'N',
                                driversLicence: '',
                                driversLicenceVersion: '',
                                gender: 'M',
                                employerName: 'Test Emp',
                                previousEmployerName: "Fidel's Fish and Chippery",
                                occupation: 'Revolutionary',
                                /*
                                unformattedAddress: {
                                  unformattedAddressType: 'C',
                                  unformattedAddress: '1 Watson Street Akaroa 7520'
                                },
                                */
                                unformattedAddressType: undefined,
                                unformattedAddress: undefined,
                                formattedAddress: {
                                 formattedAddressType: 'C',
                                 property: undefined,
                                 unitNumber: '',
                                 streetNumber: 123,
                                 streetName: createGuidTruncated(20),
                                 streetType: "Street",
                                 town: createGuidTruncated(20),
                                 suburbTown: createGuidTruncated(20),
                                 state: '',
                                 postcode: 3625,
                                 country: "NZ"
                                }
                            },
                            payment: {
                              period: '2016-09-01',
                              paymentStatus: 'X'
                            }
                        }
          };

    function accountsTransformer(xmlTemplate, accountsObj){
      let arrAccounts = forceArray(accountsObj),
          accountTemplate = templateSectionParts(xmlTemplate, 'account').section,
          sectionToRemove = accountsObj.unformattedAddress == null ?
                                                                    'unformattedAddress' :
                                                                    'formattedAddress';

      accountTemplate = removeSection(accountTemplate, sectionToRemove);

      function transformAccount(accountObj){
        var flattened = flattenObj(accountObj)
        return loadTemplate(accountTemplate, flattened);
      }

      var allAccounts = _.map(arrAccounts, transformAccount)
      return allAccounts.join();
    }

  it('large template load', () => {
    let data = DEMO_DATA,
        template = SAMPLE_TEMPLATE,
        transformers =  {
                        batch: loadTemplate,
                        accounts: accountsTransformer
                      },
        result = loadSectionedTemplate(template, transformers, data);

     chkFalse(hasText(result, '{{'));
  });

});


describe('loadTemplate / loadTemplatePositional', () => {

  it('loadTemplate ~ basic template load', () => {
    const TEMPLATE = `given: {{given}},
                    last: {{last}},
                    gender: {{gender}},`;

    const EXPECTED = `given: John,
                      last: Doe,
                      gender: Male,`;

    const DATA = {
                   given: 'John',
                   last: 'Doe',
                   gender: 'Male'
                  };

    chkEq(trimLines(EXPECTED), trimLines(loadTemplate(TEMPLATE, DATA)));
  });

  it('loadTemplate ~ missing prop', () => {
    const TEMPLATE = `given: {{given}},
                    last: {{last}},
                    gender: {{gender}},`;

    const DATA = {
                   given: 'John',
                   last: 'Doe'
                  };

    chkException(() => loadTemplate(TEMPLATE, DATA), e => true,
                                    () => 'checking for any exception the way the template works is weird');
  });

  it('loadTemplatePositional ~ basic template load', () => {
    const TEMPLATE = `given: {{0}},
                    last: {{1}},
                    gender: {{2}},`;

    const EXPECTED = `given: John,
                      last: Doe,
                      gender: Male,`;

    chkEq(trimLines(EXPECTED), trimLines(loadTemplatePositional(TEMPLATE, 'John', 'Doe', 'Male')));
  });

});


describe('trimLines', () => {

  it('empty', () => {
    chkEq('', trimLines(''))
  });

  it('lines', () => {
    let
      targ = `
              blahhh \r\n

              de blaaa
              hi there
            `,
      expected = '\nblahhh\n\n\nde blaaa\nhi there\n';

    chkEq(expected, trimLines(targ))
  });

});

type RecType = {
  id: number,
  name: string,
  dob: string,
  drivers: boolean,
  address: boolean,
  outcome: string,
  'flip/repeat': boolean
}

describe('sameText', () => {

  it('empty', () => {
    chk(sameText('', ''))
  });

  it('case insensitive', () => {
    chk(sameText('aaa', 'AAa'))
  });

  it('case sensitive', () => {
    chkFalse(sameText('aaa', 'AAa', true))
  });

});

describe('substrBetween', () => {
  const chkSubStr = (base: string, sDelim: string, eDelim: string, trim: boolean, expected: string) => chkEq(expected, subStrBetween(base, sDelim, eDelim, trim));
  const chkSubStrDefDefault = (base: string, sDelim: string, eDelim: string, expected: string) => chkEq(expected, subStrBetween(base, sDelim, eDelim));

  it('basic with trim default', () => {
    chkSubStrDefDefault('automation is great fun', 'is', 'fun', 'great');
  });

  it('basic ii', () => {
    chkSubStrDefDefault('[Hi]', '[', ']', 'Hi');
  });

  it('basic trim explicit', () => {
    chkSubStr('[Hi' + newLine() + ']', '[', ']', true, 'Hi');
  });

  it('basic no trim ', () => {
    chkSubStr('[Hi' + newLine() + ']', '[', ']', false, 'Hi' + newLine());
  });

  it('empty', () => {
    chkSubStrDefDefault('[]', '[', ']', '');
  });

  it('missing trailing delim', () => {
    chkSubStr('[Hi' + newLine(), '[', ']', false, '');
  });

  it('missing leading delim', () => {
    chkSubStr('Hi' + newLine() + ']', '[', ']', false, '');
  });

  it('missing delims', () => {
    chkSubStr('Hi' + newLine(), '[', ']', false, '');
  });

});

describe('trimChars', () => {

  it('basic array', () => {
    let trimAr = ['a','b','}'],
        target = 'aabcccdf}b',
        actual = trimChars(target, trimAr);

    chkEq('cccdf', actual);
  });

  it('throws exception on empty', () => {
    chkExceptionText(
                () => {
                        trimChars('target', ['a', '']);
                      },
                'Empty string passed in to trimChars char array'
              );
  });

  it('empty trim chars array', () => {
    let trimAr = [],
        target = 'aabcccdf}b',
        actual = trimChars(target, trimAr);

    chkEq(target, actual);
  });

});

describe('parseCsv', () => {

  const CSV =
  ` todo,done,total,% done
    231,57,288,19.8%
    225,65,290,22.4%
    209,74,283,26.1%
    162,96,258,37.2%
    161,97,258,37.6%
    150,108,258,41.9%
    141,115,256,44.9%
    129,127,256,49.6%
    123,133,256,52.0%
    120,135,255,52.9%
    116,139,255,54.5%
    ,,0,#DIV/0!
    `;

  it('simple', () => {
    let actual = parseCsv(CSV);
    chkEq(12, actual.length);
    chkEq('161', actual[4].todo);
  });

  it('check autotyped', () => {
    let actual = parseCsv(CSV);
    chkEq(0, actual[11].total);
  });

  it('autotyping off', () => {
    let actual = parseCsv(CSV, DEFAULT_CSV_PARSE_OPTIONS, false);
    chkEq('0', actual[11].total);
  });


});

describe('stringToArray / arrayToString', () => {

  it('empty round trip', () => {
    // have to suck this up
    chkEq([''], stringToArray(arrayToString([])));
  });

  it('empty round trip ii', () => {
    // have to suck this up
    chkEq([''], stringToArray(arrayToString([''])));
  });

  it('non empty round trip ii', () => {
    // have to suck this up
    let src = ['a', 'b', 'c']
    chkEq(src, stringToArray(arrayToString(src)));
  });

});

describe('capFirst', () => {

  it('simple', () => {
    chkEq('Simple', capFirst('simple'))
  });

  it('empty', () => {
    chkEq('', capFirst(''))
  });

});

function rowTransformer(untyped): RecType {
  untyped.dob = untyped.dob ? 'OLD' : 'YOUNG';
  return ((untyped: any): RecType);
}

const fieldTransformer = (val: mixed, key) => key == 'address' ? val ? 'SUCCESS' : 'FAIL' : val;

describe('stringToTableMap', () => {

  it('simple', () => {
    let actual = stringToTableMap(TABLES, rowTransformer, fieldTransformer);
    chkEq('YOUNG', actual.secondaryMatch[1].dob);
  });
});

describe('stringToGroupedTableMap', () => {

  it('simple', () => {
    let actual = stringToGroupedTableMap(GROUPED_TABLES, rowTransformer, fieldTransformer);
    chkEq('YOUNG', actual.rec3[1][0].dob);
  });

});

describe('stringToGroupedTable', () => {

  it('simple', () => {
    let actual = stringToGroupedTable(SIMPLE_TABLE, rowTransformer, fieldTransformer);
    chkEq('OLD', actual[0][0].dob);
    chkEq('SUCCESS', actual[0][6].address);
  });

});

describe('stringToTable', () => {

  it('simple', () => {
    let actual = stringToTable(SIMPLE_TABLE, rowTransformer, fieldTransformer);
    chkEq('OLD', actual[0].dob);
    chkEq('SUCCESS', actual[6].address);
  });

});

describe('stringToGroupedTableLooseTypedDefinedTabSize', () => {

  it('simple', () => {
    let actual = stringToGroupedTableLooseTypedDefinedTabSize(SIMPLE_TABLE_BIG_TABS, 4);
    chkEq('Y  Y', actual[0][0].outcome);
  });

});

describe('stringToTableLooseTyped', () => {

  describe('simple', () => {

    let actual: Array<{[string]: any}> = [];

    before(() => {
      actual = stringToTableLooseTyped(SIMPLE_TABLE);
     });

     it('correct no of records', () => {
       chkEq(7, actual.length);
     });

     it('is autoTyped', () => {
       let rec1 = actual[1];
       chk(rec1.drivers);
     });

  });

  describe('with field transformer', () => {

    let trans1 = (val, key, obj) => val && key === 'address' ? 'YO ADDRESS' : val,
        trans2 = (val, key, obj) => val && key === 'drivers' ? 'YO DRIVER' : val;

     it('single transformer', () => {
       let actual = stringToTableLooseTyped(SIMPLE_TABLE, trans1);
       chkEq('YO ADDRESS', actual[2].address);
     });

     it('multiple transformers', () => {
       let actual = stringToTableLooseTyped(SIMPLE_TABLE, trans1, trans2);
       chkEq('YO ADDRESS', actual[2].address);
       chkEq('YO DRIVER', actual[1].drivers);
     });

  });

  describe('sectioned should cause exception', () => {

     it('throws expected exception', () => {
       chkExceptionText(() => stringToTableLooseTyped(SECTIONED_TABLE),  'stringToGroupedTable');
     });

  });

});

describe('stringToGroupedTableLooseTyped', () => {


  describe('simple', () => {

    let actual: Array<Array<{[string]: any}>> = [];

    before(() => {
      actual = stringToGroupedTableLooseTyped(SIMPLE_TABLE);
     });

     it('correct no of records', () => {
       chkEq(1, actual.length);
     });

     it('correct no of inner records', () => {
       chkEq(7, actual[0].length);
       let rec1 = actual[0][1];
       chk(rec1.drivers);
     });

     it('is autoTyped', () => {
       let rec1 = actual[0][1];
       chk(rec1.drivers);
     });

  });

  describe('truly sectioned', () => {

    let actual: Array<Array<{[string]: any}>> = [];

    before(() => {
      actual = stringToGroupedTableLooseTyped(SECTIONED_TABLE);
     });

     it('correct no of records', () => {
       chkEq(3, actual.length);
     });

     it('correct no of inner records', () => {
       chkEq(3, actual[1].length);
       let rec1 = actual[0][1];
       chk(rec1.drivers);
     });

     it('is autoTyped', () => {
       let rec1 = actual[1][2];
       chk(rec1.outcome);
     });

  });

});


describe('bisect', () => {

  function bisectTest(src: string, delim: string, preExpected: string, sufExpected: string) {
    let actual = bisect(src, delim);
    chkEq(preExpected, actual[0]);
    chkEq(sufExpected, actual[1]);
  }

  it('no delim', () => {
    bisectTest('Hello Cool World', ',', 'Hello Cool World', '');
  });

  it('simple delim', () => {
    bisectTest('The quick e brown fox jumps', 'e', 'Th', ' quick e brown fox jumps');
  });

  it('trailing delim', () => {
    bisectTest('The quick e brown fox jumps', 's', 'The quick e brown fox jump', '');
  });

  it('leading delim', () => {
    bisectTest('The quick e brown fox jumps', 'T', '', 'he quick e brown fox jumps');
  });

  it('multi-line trailing delim', () => {
    bisectTest('The quick brown fox jumpsz', 'sz', 'The quick brown fox jump', '');
  });

  it('empty delim', () => {
    bisectTest('The quick brown fox jumps', '', '', 'The quick brown fox jumps');
  });

  it('empty delim and target', () => {
    bisectTest('', '', '', '');
  });

  it('file paths - defect', () => {
    bisectTest('<Prp name="relpath" type="S" value="..\\..\\Utils\\FileUtils.sj"/>', 'value="', '<Prp name="relpath" type="S" ', '..\\..\\Utils\\FileUtils.sj"/>');
  });
});

describe('subStrBefore', () => {

  const test = (s: string, delim: string, ex: string) => chkEq(ex, subStrBefore(s, delim));

  it('empty target', () => {
   test('', ',', '');
  });

  it('leading delim', () => {
   test(",Gee wilikers me kent", "," , '');
  });

  it('trailing delim', () => {
   test("Gee wilikers me kent,", "," , "Gee wilikers me kent");
  });

  it('inline delim', () => {
   test("Gee wilikers, Mr Kent", "," , "Gee wilikers");
  });

  it('no delim', () => {
   test("[Hi", "]", "");
  });

});

describe('subStrAfter', () => {

  const test = (s: string, delim: string, ex: string) => chkEq(ex, subStrAfter(s, delim));

  it('empty target', () => {
   test('', ',', '');
  });

  it('leading delim', () => {
   test(",Gee wilikers me kent", "," , "Gee wilikers me kent");
  });

  it('trailing delim', () => {
   test("Gee wilikers me kent,", "," , "");
  });

  it('no delim', () => {
   test("[Hi", "]", "");
  });

});



describe('trim', () => {
  it('word', () => {
    chkEq('hi', trim(' hi '));
  });

});

describe('createGuid', () => {

  it('simple example', () => {
    let g1 = createGuid(),
        g2 = createGuid();

    chkFalse(areEqual(g1, g2));
  });

});

describe('createGuidTruncated', () => {

  it('simple example', () => {
    let g1 = createGuidTruncated(12),
        g2 = createGuidTruncated(12);

    chkFalse(areEqual(g1, g2));
    chkEq(12, g1.length);
  });

});

describe('standardiseLineEndings', () => {

  it('mixed line endings', () => {
    var base = '\r\n \n \r \r \n\r';
    var expected = '\n \n \n \n \n';
    var result = standardiseLineEndings(base);
    chkEq(expected, result);
  });

});

describe('newLine', () => {
  it('singular', () => {
    chkEq('\n', newLine());
  });

  it('many', () => {
    chkEq('\n\n\n\n\n', newLine(5));
  });
});

describe('lowerFirst', () => {

  it('non empty string', () => {
    chkEq('joHn', lowerFirst('JoHn'))
  });

  it('empty string', () => {
    chkEq('', lowerFirst(''))
  });

});

describe('upperFirst', () => {

  it('non empty string', () => {
    chkEq('JoHn', upperFirst('joHn'))
  });

  it('empty string', () => {
    chkEq('', upperFirst(''))
  });

});

describe('lowercase / uppercase', () => {

  it('lowerCase', () => {
    chkEq('john', lowerCase('joHn'))
  });

  it('upperCase', () => {
    chkEq('JOHN', upperCase('joHn'))
  });

});

describe('appendDelim', () => {

  it('full params', () => {
    chkEq(appendDelim("Hello", " ", "World"), "Hello World");
  });

  it('prefix null', () => {
    chkEq(appendDelim(null, " ", "World"), "World");
  });

  it('suffix null', () => {
    chkEq(appendDelim("Hello", " ", null), "Hello");
  });

  it('all null', () => {
    chkEq(appendDelim(null, " ", null), "");
  });

  it('prefix undefined', () => {
    chkEq(appendDelim(undefined, " ", "World"), "World");
  });

});

describe('replace', () => {
  it('case insensitive', () => {
    chkEq('the quick red fox jumps over the lazy red dog', replace('the quick brown fox jumps over the lazy Brown dog', 'brown', 'red'));
  });

  it('case sensitive', () => {
    chkEq('the quick red fox jumps over the lazy Brown dog', replace('the quick brown fox jumps over the lazy Brown dog', 'brown', 'red', true));
  });

});

describe('toString', () => {

  it('object', () => {
    chkEq('hi: 1\n', toString({hi: 1}));
  });

  it('moment', () => {
    let mmt = strToMoment('2017-11-04')
    chkEq('2017-11-04 00:00:00', toString(mmt));
  });

  it('number', () => {
    chkEq('123', toString(123));
  });

  it('string', () => {
    chkEq('hi', toString('hi'));
  });

  it('array', () => {
    chkEq('- 1\n- 2\n- 3\n', toString([1, 2, 3]));
  });

  it('function', () => {

    let expected = `function blahh() {
      return 'Hi';
    }`

    function blahh() {
      return 'Hi';
    }
    chkEq(expected, toString(blahh));
  });

  it('null', () => {
    chkEq('null', toString(null));
  });

  it('undefined', () => {
    chkEq('undefined', toString(undefined));
  });

});

describe('wildcardMatch', () => {

  it('wildcard surround', () => {
    chk(wildCardMatch("demo_Array_Data_Driven_Test", "*Array*"));
  });

  it('complex nested - case insensitive', () => {
    chk(wildCardMatch("The quick brown fox jumps over the lazy dog", "Th*icK*b*ox*over the*dog", false));
  });

  it('complex nested - case sensitive', () => {
    chkFalse(wildCardMatch("The quick brown fox jumps over the lazy dog", "Th*icK*b*ox*over the*dog", true));
  });

  it('complex nested - case sensitive ii', () => {
    chk(wildCardMatch("The quick brown fox jumps over the lazy dog", "*fox*dog", true));
  });

  it('complex nested - negative case', () => {
    chkFalse(wildCardMatch("The quick brown fox jumps over the lazy dog", "*fox*brown"));
  });

  it('complex nested - trailing negative', () => {
    chkFalse(wildCardMatch("The quick brown fox jumps over the lazy dog", "*fox*Lazy", true));
  });

  it('same string', () => {
    chk(wildCardMatch("The quick brown fox jumps over the lazy dog", "The quick brown fox jumps over the lazy dog", true));
  });

  it('multi wild cards', () => {
    chk(wildCardMatch('J. R. R. Tolkien', '*Tol*'));
  });

});

describe('hasText', () => {

  it('null hayStack', () => {
    chkFalse(hasText(null, 'blahh'))
  });

  it('undefined hayStack', () => {
    chkFalse(hasText(undefined, 'blahh'));
  });

  it('case sensitivity override - not found', () => {
    chkFalse(hasText('i am johnie', 'John', true));
  });

  it('case sensitivity override - found', () => {
    chk(hasText('i am Johnie', 'John', true));
  });

  it('case sensitivity default false - found', () => {
    chk(hasText('i am johnie', 'John'));
  });

  it('empty string - found', () => {
    chk(hasText('i am johnie', ''));
  });

  it('empty string - in null', () => {
    chkFalse(hasText(null, ''));
  });

  it('same test with wildcard', () => {
    let actual = 'setInObj matching property not found for specification: st*, toys, will not work';
    chk(hasText(actual, actual));
  });

});

describe('startsWith', () => {

  it('happy path true', () => {
    chk(startsWith('abcde', 'ab'));
  });

  it('happy path false', () => {
    chkFalse(startsWith('abcde', 'ac'));
  });

  it('null', () => {
    chkFalse(startsWith(null, 'dd'));
  });

  it('undefined', () => {
    chkFalse(startsWith(undefined, 'dd'));
  });

  it('case sensitive', () => {
    chkFalse(startsWith('abcde', 'aB'));
  });

  it('undefined', () => {
    chkFalse(startsWith(undefined, 'dE'));
  });

  it('exact', () => {
    chk(startsWith('dE', 'dE'));
  });

});

describe('endsWith', () => {

  it('happy path true', () => {
    chk(endsWith('abcde', 'de'));
  });

  it('happy path false', () => {
    chkFalse(endsWith('abcde', 'dd'));
  });

  it('null', () => {
    chkFalse(endsWith(null, 'dd'));
  });

  it('undefined', () => {
    chkFalse(endsWith(undefined, 'dd'));
  });

  it('case sensitive', () => {
    chkFalse(endsWith('abcde', 'dE'));
  });

  it('undefined', () => {
    chkFalse(endsWith(undefined, 'dE'));
  });

  it('exact', () => {
    chk(endsWith('dE', 'dE'));
  });

});
