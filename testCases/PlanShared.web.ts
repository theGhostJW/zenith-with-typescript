import * as _ from 'lodash';
import { S, url, getUrl, setForm, SS, wdDebug} from '../src/lib/WebUtils';

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
export const emptyData =  {
  name: '',
  surname: '',
  email: '',
  phone: '',
  message: ''
}

export const clearContactForm = () => setContactForm({});

export function setContactForm(params: FormInput) {
  const {name,
          surname,
          email,
          phone,
          message} = _.defaults(params, emptyData);
          
  const formParams = {
                    forename: name,
                    surname: surname,
                    email: email,
                    telephone: phone,
                    message: message
                  };
  setForm('form', formParams);
}

export function clickSubmit(){
  S(".btn-contact").click();
}

it('clickSubmit', () => {
  wdDebug('http://jupiter.cloud.planittesting.com/#/contact', clickSubmit);
})

export function getErrors(): string[] {
 return SS('.help-inline').map(e => e.getText());
}

it('goContacts', () => {
  wdDebug(homePage, goContacts)
})