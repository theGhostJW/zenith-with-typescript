import * as _ from 'lodash';
import { register, RunConfig, TestCase, TestConfig, Validators, AllCountries  } from './ProjectConfig';
import { baseData, DataItem } from './PlanIT_Demo2.web.data';
import { checkEqual} from '../src/lib/CheckUtils';
import { S, url, getUrl, setForm, getForm, SS, clickLink } from '../src/lib/WebUtils';
import { waitRetry, debug } from '../src/lib/SysUtils';
import { errorShotFile } from '../src/lib/FileUtils';


const homePage : string = 'http://jupiter.cloud.planittesting.com';

export function goHome(){
  url(homePage);
}

export function goContacts(){
 S('[href*="contact"]').click();
}

export const validContactDetails =  {
      name: 'john',
      surname: 'walker',
      email: 'a@b.com',
      phone: '1234567',
      message: 'hi'
  }

// Complete Form Input Type
export interface CompleteFormInput 
	{
		name?: string,
		surname?: string,
		email?: string,
    phone?: string,
    message?: string
	}

// Form Input
export type FormInput = Partial<CompleteFormInput>;

// Default Data
const formDefaults = () => {
 return {
  name: '',
  surname: '',
  email: '',
  phone: '',
  message: ''
	}
}

export const clearContactForm = () => setContactForm({});

export function setContactForm(params: FormInput) {
  const {name,
          surname,
          email,
          phone,
          message} = _.defaults(params, formDefaults());
          
  const formParams = {
                    forename: name,
                    surname: surname,
                    email: email,
                    telephone: phone
                  };
  setForm('form', formParams);
  S("#message").setValue(message);
}

export function clickSubmit(){
  S(".btn-contact").click();
}

export function getErrors(){
 // $$('.help-inline')
}
