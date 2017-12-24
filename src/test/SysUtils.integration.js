// @flow




import {datePlus, now, today} from '../lib/DateTimeUtils';
import {chk, chkEq, chkExceptionText, chkFalse, chkWithMessage} from '../lib/AssertionUtils';
import {createGuidTruncated, hasText} from '../lib/StringUtils';
import { fromTestDataString } from '../lib/FileUtils';
import {cast, waitRetry, debug, executeFile,
      executeRunTimeFile, killTask, listProcesses,
      xmlToObj } from '../lib/SysUtils';
import * as _ from 'lodash';

describe.only('sectionedTemplate', () => {


  it('loadSectionedTemplate', () => {

  });


  function defaultData() {
    return  {
            batch: {
                batchId: createGuidTruncated(20),
                extractDateTime: now(),
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
                          correctionFlag: false,
                          accountNumber: createGuidTruncated(20),
                          accountSubId: 'ACCS14082015',
                          status: 'A',
                          statusDate: today(),
                          creditPurpose: 'R',
                          accountHolderCount: 1,
                          accountType: 'AL',
                          openDate: datePlus(today(), -(20*30)),
                          closedDate: '',
                          paymentType: 'P',
                          creditType: 'F',
                          termOfLoan: 640,
                          loanPaymentMethod: 'C',
                          unlimitedCredit: false,
                          termType: 'M',
                          securedCredit: 'S',
                          paymentFrequency: 'M',
                          maximumAmountOfCreditAvailable: 100000,

                          creditLimit: 300000,
                          accountName: createGuidTruncated(20),
                          customerCount: 1,
                          customer: {
                            customerId: 244324,
                            startDate: datePlus(today(), -(20*30)),
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
                               streetNumber:  _.random(1, 100),
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
              }

          };

});

describe('xmlToObj', () => {

  it('parse demo file', () => {

    let xml = fromTestDataString('books.xml'),
        obj = cast(xmlToObj(xml)),
        recCount = obj.catalog.book.length;

     chkEq(12, recCount);
  });
});


describe('executeFileRunTimeFile', () => {

  it('non-existant', () => {
    chkExceptionText(() => executeRunTimeFile('Blahh'), 'does not exist');
  });

  it('exists', () => {
    executeRunTimeFile('emptybat.bat');
  });

});

describe.skip('executeFile', () => {

  const TARGET_PATH = '"C:\\Program Files\\Notepad++\\notepad++.exe"';
  it('async', () => {
    executeFile(TARGET_PATH);
  });

  it('sync', () => {
    executeFile(TARGET_PATH, false);
  });
});

describe.skip('killTask', () => {

  // it('success firefox - firefox must be running', () => {
  //   let result = killTask((t) => hasText(t.imageName, 'firefox'));
  //   chk(result);
  // });

  it('failure non existant process ', () => {
    let result = killTask((t) => hasText(t.imageName, 'dcfsjkfksdhfsdklfsdhfjkl'));
    chkFalse(result);
  });


});

describe('listProcesses', function() {

  this.timeout(5000);

  it('simple', () => {
   let actual = listProcesses();
   chk(actual.length > 20);
 });

});

describe('waitRetry', () => {

  it('failure 2 secs 1 sec retry', function() {
    this.timeout(30000);
    let actual = waitRetry(() => false, 2000, () => {}, 1000);
    chkFalse(actual);
  });

});
