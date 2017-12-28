// @flow

import {ensure, hasValue} from '../lib/SysUtils';

// export function makeSQlServerConnectionString(server: string, catalog: string = ''){
//   return [
//           "Provider=SQLOLEDB;Data Source='",
//           server,
//           "'; Trusted_Connection=Yes;Initial Catalog='",
//           catalog,
//           "'"].join('');
// }
//
// export function makeSQLite3ConnectionString(dbPath: string){
//   return `DRIVER=SQLite3 ODBC Driver;Database=" + ${dbPath}  + ";LongNames=0;Timeout=1000;NoTXN=0;SyncPragma=NORMAL;StepAPI=0;version=3;`;
// }


/* ~ Defer until at D&B ~ engine
function runSQLQuery(params){
/*
 eg params = {
  server: 'SERVER_NAME',
  db: 'DB_NAME',
  sql: 'test.sql',
  timeout: 100000,
  rowFunction: function(recordSet){// Do something } Or null if non query like an update,
  connectionStringMakerFunction: params => String
 }
*/ /*
  function indicate(str){
    Indicator.PopText();
    Indicator.PushText(str);
  }

  function atRecord(recSet){
    return !(recSet.EOF || recSet.BOF);
  }

  var sqlFileName =  aqString.ToLower((params.sql));
  var isFile = endsWith(sqlFileName, '.sql');
  var sql = isFile ? testDataString(params.sql): params.sql;

  var adOpenStatic = 3;
  var adLockOptimistic = 3;
  var connection = Sys.OleObject("ADODB.Connection");

  if (hasValue(params.timeout)){
    connection.CommandTimeout = Math.round(params.timeout / 1000); // seconds
  }

  var recordSet = Sys.OleObject("ADODB.Recordset");

  var strConnection = params.connectionStringMakerFunction(params);

  log('Executing SQL (Connecting) - ' + strConnection, strConnection);
  Indicator.PushText('Executing SQL (Connecting) - ' + strConnection);
  connection.Open(strConnection);
  try {
    log('Executing SQL (Executing) - ' + params.sql, sql);
    Indicator.PushText('Executing SQL (Executing) - ' + params.sql);

    if (hasValue(params.rowFunction)){
      recordSet.Open(sql, connection, adOpenStatic, adLockOptimistic);
      try {
        if (!recordSet.EOF){
          recordSet.MoveFirst();
          indicate('Processing records');
          var counter = 0,
              interval = 0;

          while (atRecord(recordSet)) {
            params.rowFunction(recordSet);
            recordSet.MoveNext();
            interval++;
            counter++;
            if (interval == 100){
              indicate(counter + ' records processed');
              interval = 0;
            }
          }
        }
      }
      finally {
        Indicator.PopText();
        recordSet.Close();
      }
    }
    else {
      // if there is no row function - then assume this is a non query like an insert or delete
      connection.Execute(sql);
    }

  }
  finally {
    Indicator.PopText();
    connection.Close();
  }
}
*/
