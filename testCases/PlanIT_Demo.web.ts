import * as _ from 'lodash';
import { register, RunConfig, TestCase, TestConfig, Validators, AllCountries  } from './ProjectConfig';
import { chkProp} from '../src/lib/CheckUtils';
import { S } from '../src/lib/WebUtils';
import { validContactDetails, FormInput, goHome, goContacts, setContactForm, clickSubmit, getErrors, emptyData } from './PlanShared.web'

const config: TestConfig = {
  title: 'planIT demo',
  owner: 'JW',
  enabled: true,
  countries: AllCountries
}

export interface Item {
  id: number,
  when: string,
  then: string,
  initalFormData: FormInput,
  secondTryFormData: FormInput,
  validators: Validators<DState>
}

export interface ApState {
  finalMessage: string | null,
  initialErrors: string[],
  secondTryErrors: string[] | null
}

// trivial test no transformation needed
type DState = ApState

const check_final_message = chkProp<DState>("finalMessage")
const check_retry_errors = chkProp<DState>("secondTryErrors")

function prepState(a: ApState, i: Item, rc: RunConfig): DState {
  return a;
}

function setFormReturnErrors(data: FormInput) {
  setContactForm(data);
  clickSubmit();
  return getErrors();
}

function readMessage(): string | null {
  const messageSelector = "[class*=alert-success]";
  S(messageSelector).waitForDisplayed(5000);
  return S(messageSelector).getText();
}

export function interactor(item: Item, runConfig: RunConfig): ApState {
  goHome();
  goContacts();

  const initialErrors = setFormReturnErrors(item.initalFormData),
        secondTryErrors = item.secondTryFormData == null 
                              ? null 
                              : setFormReturnErrors(item.secondTryFormData),
        finalMessage = readMessage();
        
  return {
    finalMessage: finalMessage,
    initialErrors: initialErrors,
    secondTryErrors: secondTryErrors
  }
}

function  testItems(runConfig: RunConfig): Item[] {
  return [
    {
      id: 100,
      when: "no data is entered",
      then: "errors are expected",
      initalFormData: emptyData,
      secondTryFormData: validContactDetails,
      validators: [
                    chkProp("initialErrors")([
                      'Forename is required',
                      'Email is required',
                      'Message is required'
                    ]),
                    check_retry_errors([]) ,
                    check_final_message("Thanks john, we appreciate your feedback.")
                ]
    }
  ] 
}

export const testCase: TestCase<Item, ApState, DState>  = {
  testConfig: config,
  interactor: interactor,
  prepState: prepState,
  testItems: testItems
}

register(testCase)
