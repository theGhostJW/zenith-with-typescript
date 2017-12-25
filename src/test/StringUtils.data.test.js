// @flow

export const SIMPLE_TABLE : string = `

simple table

id						name							dob				 drivers						address					outcome				flip/repeat
------------------------------------------------------------------------------------------------------------------------------------------------------------------
10						exact							Y				   N								   N						   Y						Y
11						exact							N				   Y								   N						   Y						Y
12						exact							N				   N								   Y						   Y						Y

13						concatFM					Y				   N								   N						   Y						Y
14						concatML					N				   Y								   N						   Y						Y
15						concatFM					N				   N								   Y						   Y						Y

16						exact							Y				   Y								   Y						   Y						N

`;

export const SECTIONED_TABLE : string = `

sectioned table

id						name							dob				 drivers						address					outcome				flip/repeat
------------------------------------------------------------------------------------------------------------------------------------------------------------------
10						exact							Y				   N								   N						   Y						Y
11						exact							N				   Y								   N						   Y						Y
12						exact							N				   N								   Y						   Y						Y

--------------------------------
13						concatFM					Y				   N								   N						   Y						Y
14						concatML					N				   Y								   N						   Y						Y
15						concatFM					N				   N								   Y						   Y						Y

-------------------------------
16						exact							Y				   Y								   Y						   Y						N

`;

export const SIMPLE_TABLE_BIG_TABS : string = `

simple table with large tab size

id						  name							 dob				   drivers						 address					   outcome				 flip/repeat
------------------------------------------------------------------------------------------------------------------------------------------------------------------
10						   exact							Y				      N								   N						       Y  Y						 Y
11						   exact							N				      Y								   N						       Y  Y						 Y
12						   exact							N				      N								   Y						       Y  Y						 Y

13						   concatFM					  Y				      N								   N						       Y  Y						 Y
14						   concatML					  N				      Y								   N						       Y  Y						 Y
15						   concatFM					  N				      N								   Y						       Y  Y						 Y

16						   exact							Y				      Y								   Y						       Y  Y						 N

`;


export const GROUPED_TABLES : string = `


=== Secondary Matching Grouped ===

rec1::

id					name								dob						drivers					  	address							outcome				flip/repeat
----------------------------------------------------------------------------------------------------------------
18					none 								N							N										N									N								N
 .					> 80%								N							N										N									Y								N
 .					first								Y							N										N									Y								Y
 .					first								N							Y										N									Y								Y

---------------------------------------------------------------------------------------------------------
19					last								N							Y										N									Y								Y
 .					first & last				N							N										N									Y								Y
10					first								N							N										N									N								N
 .					last								N							N										N									N								N


=== Second Record ===

rec2::

id					name								dob						drivers					  	address							outcome				flip/repeat
----------------------------------------------------------------------------------------------------------------
28					none 								N							N										N									N								N
 .					> 80%								N							N										N									Y								N
10					first								Y							N										N									Y								Y
 .					first								N							Y										N									Y								Y

---------------------------------------------------------------------------------------------------------
29					last								N							Y										N									Y								Y
 .					first & last				N							N										N									Y								Y
 .					first								N							N										N									N								N
 .					last								N							N										N									N								N


rec3::

=== Third Record ===

id					name								dob						drivers					  	address							outcome				flip/repeat
----------------------------------------------------------------------------------------------------------------
38					none 								N							N										N									N								N
 .					> 80%								N							N										N									Y								N
 .					first								Y							N										N									Y								Y
 .					first								N							Y										N									Y								Y

---------------------------------------------------------------------------------------------------------
39					last								N							Y										N									Y								Y
 .					first & last				N							N										N									Y								Y
 .					first								N							N										N									N								N
 .					last								N							N										N									N								N

`;


export const TABLES : string = `
2 requests same account no / sub no

=== Direct Hit Matching ===

directHitCases::
id					name	   			 		dob				 drivers			 address							outcome				flip/repeat
------------------------------------------------------------------------------------------------------------------------------------------------------------------
10					exact							Y					 N							N										2001-01-15							Y
11					exact							N					 Y							N										2001-01-07							Y
12					exact							N					 N							Y										2001-01-15							Y
13					concatFM					Y					 N							N										2001-01-11							Y
14					concatML					N					 Y							N										2001-01-15							Y
15					concatFM					N					 N							Y										2001-01-15							Y
16					exact							Y					 Y							Y										2001-01-10							N


=== Secondary Matching ===

secondaryMatch::
id					name								dob						drivers					  	address							outcome				flip/repeat
-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
20					none 								N					 		N											N									N							N
21					> 80%								N					 		N											N									Y							N
22					first								Y					 		N											N									Y							Y

23					first								N					 		Y											N									Y							Y
24					last								N					 		Y											N									Y							Y
25					first & last				N					 		N											N									Y							Y

26					first								N					 		N											N									N							N
27					last								N					 		N											N									N							N

`;

export const SAMPLE_TEMPLATE: string = `
<?xml version="1.0" encoding="utf-8"?>
<ARCAAccountReportBatch xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" mode="T" version="0100">
  <!-- batch -->
  <Header>
    <Batch>
      <BatchId>{{batchId}}</BatchId>
      <ProviderReference>{{providerReference}}</ProviderReference>
      <NotificationEmail>{{notificationEmail}}</NotificationEmail>
      <ExtractDateTime>{{extractDateTime}}</ExtractDateTime>
      <BatchType>{{batchType}}</BatchType>
      <ResponseDetail>F</ResponseDetail>
    </Batch>
    <Provider>
      <Licensee>N</Licensee>
      <Name>{{providerName}}</Name>
      <SignatoryId>{{signatoryId}}</SignatoryId>
      <SignatorySubId>{{signatorySubId}}</SignatorySubId>
      <IndustryType>{{industryType}}</IndustryType>
      <OtherIndustryTypeDescriptor />
    </Provider>
    <Contact>
      <Name>{{contactName}}</Name>
      <Email>{{contactEmail}}</Email>
      <Phone>{{contactPhone}}</Phone>
    </Contact>
  </Header>
  <!-- end batch -->
  <!-- accounts -->
  <Accounts>
    <!-- account -->
    <Account recordId="{{recordId}}">
      <Header>
        <AccountId>
          <AccountNumber>{{accountNumber}}</AccountNumber>
          <AccountSubId>{{accountSubId}}</AccountSubId>
        </AccountId>
        <CreditPurpose>{{creditPurpose}}</CreditPurpose>
        <AccountType>{{accountType}}</AccountType>
        <OtherAccountTypeDescriptor />
        <AccountHolderCount>{{accountHolderCount}}</AccountHolderCount>
        <OpenDate>{{openDate}}</OpenDate>
        <CloseDate />
      </Header>
      <ConsumerCreditLiability>
        <LoanPaymentMethod>{{loanPaymentMethod}}</LoanPaymentMethod>
        <TermType>{{termType}}</TermType>
        <SecuredCredit>{{securedCredit}}</SecuredCredit>
        <TermOfLoan>{{termOfLoan}}</TermOfLoan>
        <MaximumAmountOfCreditAvailable>{{maximumAmountOfCreditAvailable}}</MaximumAmountOfCreditAvailable>
        <UnlimitedCredit>{{unlimitedCredit}}</UnlimitedCredit>
      </ConsumerCreditLiability>
      <!-- accountHolders -->
      <AccountHolders>
        <!-- accountHolder -->
        <AccountHolder>
          <StartDate>{{startDate}}</StartDate>
          <Relationship>1</Relationship>
          <DefaultAssociationStartDate />
          <DefaultAssociationCeaseDate />
          <SeriousCreditInfringement>{{seriousCreditInfringement}}</SeriousCreditInfringement>
          <PrimaryName>
            <Formatted>
              <Family>{{family}}</Family>
              <First>{{first}}</First>
              <Middle>{{middle}}</Middle>
              <Title>{{title}}</Title>
            </Formatted>
          </PrimaryName>
          <BirthDate>{{birthDate}}</BirthDate>
          <Gender>{{gender}}</Gender>
          <Deceased>{{deceased}}</Deceased>
          <DriversLicence>{{driversLicence}}</DriversLicence>

          <!-- currentAddress -->
          <CurrentAddress>
            <!-- formattedAddress -->
            <Formatted>
              <Property>{{property}}</Property>
              <UnitNumber>{{unitNumber}}</UnitNumber>
              <StreetNumber>{{streetNumber}}</StreetNumber>
              <StreetName>{{streetName}}</StreetName>
              <StreetType>{{streetType}}</StreetType>
              <SuburbTown>{{suburbTown}}</SuburbTown>
              <State>{{state}}</State>
              <Postcode>{{postcode}}</Postcode>
              <Country>{{country}}</Country>
            </Formatted>
            <!-- end formattedAddress -->
          <!-- unformattedAddress -->
          <Unformatted>
            <Address>{{unformattedAddress}}</Address>
          </Unformatted>
          <!-- end unformattedAddress -->
          </CurrentAddress>
          <!-- end currentAddress -->

          <!-- previousAddress -->
          <PreviousAddress>
            <!-- formattedAddress -->
            <Formatted>
              <Property>{{property}}</Property>
              <UnitNumber>{{unitNumber}}</UnitNumber>
              <StreetNumber>{{streetNumber}}</StreetNumber>
              <StreetName>{{streetName}}</StreetName>
              <StreetType>{{streetType}}</StreetType>
              <SuburbTown>{{suburbTown}}</SuburbTown>
              <State>{{state}}</State>
              <Postcode>{{postcode}}</Postcode>
              <Country>{{country}}</Country>
            </Formatted>
          <!-- unformattedAddress -->
          <Unformatted>
            <Address>{{unformattedAddress}}</Address>
          </Unformatted>
          <!-- end unformattedAddress -->
          </PreviousAddress>
          <!-- end previousAddress -->

          <!-- mailingAddress -->
          <MailingAddress>
            <!-- formattedAddress -->
            <Formatted>
              <Property>{{property}}</Property>
              <UnitNumber>{{unitNumber}}</UnitNumber>
              <StreetNumber>{{streetNumber}}</StreetNumber>
              <StreetName>{{streetName}}</StreetName>
              <StreetType>{{streetType}}</StreetType>
              <SuburbTown>{{suburbTown}}</SuburbTown>
              <State>{{state}}</State>
              <Postcode>{{postcode}}</Postcode>
              <Country>{{country}}</Country>
            </Formatted>
          <!-- unformattedAddress -->
          <Unformatted>
            <Address>{{unformattedAddress}}</Address>
          </Unformatted>
          <!-- end unformattedAddress -->
          </MailingAddress>
          <!-- end mailingAddress -->

        </AccountHolder>
        <!-- end accountHolder -->
      </AccountHolders>
      <!-- end accountHolders -->
    </Account>
    <!-- end account -->
  </Accounts>
  <!-- end accounts -->
</ARCAAccountReportBatch>
`;

export const SAMPLE_XML: string = `
<?xml version="1.0" encoding="utf-8"?>
                              <CRAReportBatch xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
                                <Batch>
                                  <BatchID>1</BatchID>
                                  <ExtractDate></ExtractDate>
                                  <ExtractTime></ExtractTime>
                                  <ProviderReference></ProviderReference>
                                  <NotificationEmail></NotificationEmail>
                                  <Version></Version>
                                  <Mode></Mode>
                                  <BatchType></BatchType>
                                  <NameOfTheProvider></NameOfTheProvider>
                                  <IndustryType></IndustryType>
                                  <SignatoryID></SignatoryID>
                                  <SignatorySubID></SignatorySubID>
                                  <MainContactName></MainContactName>
                                  <MainContactEmail></MainContactEmail>
                                  <MainContactPhone></MainContactPhone>
                                  <OptionalContactName></OptionalContactName>
                                  <OptionalContactEmail></OptionalContactEmail>
                                  <OptionalContactPhone></OptionalContactPhone>
                                </Batch>
                                <Accounts>
                                  <Account>
                                    <AccountHeader>
                                      <RecordID></RecordID>
                                      <CorrectionFlag></CorrectionFlag>
                                      <AccountID>
                                        <AccountNumber></AccountNumber>
                                        <AccountSubID></AccountSubID>
                                      </AccountID>
                                      <Status></Status>
                                      <StatusDate></StatusDate>
                                      <CreditPurpose></CreditPurpose>
                                      <TypeOfAccount></TypeOfAccount>
                                    </AccountHeader>
                                    <AccountDetail>
                                      <OpenDate></OpenDate>
                                      <ClosedDate></ClosedDate>
                                      <PaymentType></PaymentType>
                                      <CreditType></CreditType>
                                      <SecuredCredit></SecuredCredit>
                                      <TermOfLoan></TermOfLoan>
                                      <PaymentFrequency></PaymentFrequency>
                                      <CreditLimit></CreditLimit>
                                      <AccountName></AccountName>
                                    </AccountDetail>
                                    <CustomerCount></CustomerCount>
                                    <Customer>
                                      <CustomerID></CustomerID>
                                      <StartDate></StartDate>
                                      <CeaseDate />
                                      <CustomerDetail>
                                        <FormattedName>
                                          <FormattedNameType></FormattedNameType>
                                          <Family></Family>
                                          <First></First>
                                          <Middle></Middle>
                                          <Title></Title>
                                        </FormattedName>
                                        <Relationship></Relationship>
                                        <BirthDate></BirthDate>
                                        <Gender></Gender>
                                        <Deceased></Deceased>
                                        <DriversLicence>
                                        <DriversLicenceNumber></DriversLicenceNumber>
                                        <DriversLicenceVersion></DriversLicenceVersion>
                                        </DriversLicence>
                                        <EmployerName></EmployerName>
                                        <PreviousEmployerName></PreviousEmployerName>
                                        <Occupation></Occupation>
                                        <FormattedAddress>
                                          <FormattedAddressType></FormattedAddressType>
                                          <Property></Property>
                                          <UnitNumber></UnitNumber>
                                          <StreetNumber></StreetNumber>
                                          <StreetName></StreetName>
                                          <StreetType></StreetType>
                                          <Town></Town>
                                          <Suburb></Suburb>
                                          <State></State>
                                          <Postcode></Postcode>
                                          <Country></Country>
                                        </FormattedAddress>
                                        <UnformattedAddress>
                                          <UnformattedAddressType></UnformattedAddressType>
                                          <UnformattedAddress></UnformattedAddress>
                                        </UnformattedAddress>
                                      </CustomerDetail>
                                    </Customer>
                                    <Payment>
                                      <Period></Period>
                                      <PaymentStatus></PaymentStatus>
                                    </Payment>
                                  </Account>
                                </Accounts>
                              </CRAReportBatch>
`;
