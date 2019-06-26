import * as _ from 'lodash';

import { allItems } from '../src/lib/TestRunner';
import { testCase } from './Demo_Case.web';
import { testCaseEndPoint } from './ProjectConfig';
import { stringToGroupedTableLooseTyped, stringToGroupedTableMap, stringToTableMap } from '../src/lib/StringUtils';

export interface BaseData {
  id : number,
  when: string,
  then: string,
  password: string,
  username: string
}

export interface DataItem {
  id: number,
  when: string,
  then: string,
  dataTarget: string,
  username: string,
  password: string,             
  errorFragment: string | null
}


const transformRow: (m:{[key:string]: any}) => DataItem = (raw) => {
  return <DataItem>{
    id: raw.id,
    when: raw.when,
    then: raw.errorFragment == null ? "log in is successful" : "log in fails with error message: " + raw.errorFragment,
    username: raw.username,
    password: raw.password,             
    errorFragment: raw.errorFragment
  }
}

export function baseData() {
  return stringToTableMap(data, transformRow);
}


const 
  validPassword = "valid",
  validUserName = "valid",
  invalidMessage = "user name or password is incorrect";

const data =
`
validCreds::
id      username               password              errorFragment         when
----------------------------------------------------------------------------------
100     ${validUserName}       ${validPassword}      .                     credentials are valid


missingCreds::
id      username                  password               errorFragment                  when
----------------------------------------------------------------------------------------------------
200     .                         .                    user name required              user name and password is empty
300     ${validUserName}          .                    password required               password is empty
400     .                         ${validPassword}      user name required             user name is empty


incorrectCreds::
id      username                password              errorFragment                  when
----------------------------------------------------------------------------------------------------
400     ${validUserName}x       ${validPassword}x     ${invalidMessage}              user name and password are invalid
500     ${validUserName}x       ${validPassword}      ${invalidMessage}              user name is invalid
600     ${validUserName}        ${validPassword}x     ${invalidMessage}              user name is empty
`


