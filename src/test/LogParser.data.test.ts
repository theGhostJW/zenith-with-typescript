export const DEMO_ENTRY = `timestamp: '2017-10-01 13:46:27'
level: info
subType: FilterLog
popControl: NoAction
message: Filter Log
additionalInfo: |
  Another_Demo_Case.js: Accepted
  Demo_Case.js: Accepted`;


export const DEMO_LOG = `
timestamp: '2017-10-14 16:03:22'
level: info
subType: FilterLog
popControl: NoAction
message: Filter Log
additionalInfo: |
  Another_Demo_Case.js: Accepted
  Demo_Case.js: Accepted
-------------------------------
timestamp: '2017-10-14 16:03:22'
level: info
subType: RunStart
popControl: PushFolder
message: 'Test Run: Test Test Run'
additionalInfo: |
  name: Test Test Run
  mocked: false
  country: Australia
  environment: TST
  testCases: []
  depth: Regression
-------------------------------
timestamp: '2017-10-14 16:03:22'
level: info
subType: TestStart
popControl: PushFolder
message: 'Test: 2: Another_Demo_Case.js - When i test anther case then it still works'
additionalInfo: |
  id: 2
  when: i test anther case
  then: it still works
  owner: JW
  enabled: true
  countries:
    - Australia
  environments:
    - TST
  depth: Regression
-------------------------------
timestamp: '2017-10-14 16:03:22'
level: info
subType: Message
message: Loading Test Items
-------------------------------
timestamp: '2017-10-14 16:03:22'
level: info
subType: IterationStart
popControl: PushFolder
message: 'Iteration: 1: Another_Demo_Case.js - When I run a test then i get the result'
additionalInfo: |
  id: 1
  testName: Another_Demo_Case.js
  when: I run a test
  then: i get the result
-------------------------------
timestamp: '2017-10-14 16:03:22'
level: info
subType: InteractorStart
popControl: PushFolder
message: Start Interaction
-------------------------------
timestamp: '2017-10-14 16:03:22'
level: info
subType: Message
popControl: PopFolder
message: Pop Folder
-------------------------------
timestamp: '2017-10-14 16:03:22'
level: info
subType: ValidationStart
popControl: PushFolder
message: Start Validation
additionalInfo: |
  dState:
    when: I run a test
-------------------------------
timestamp: '2017-10-14 16:03:22'
level: info
subType: Message
popControl: PushFolder
message: check_has_another
-------------------------------
timestamp: '2017-10-14 16:03:22'
level: error
subType: CheckFail
popControl: NoAction
message: Check Text Contains
additionalInfo: |-
  Looking for: another
   in
  I run a test
callstack: |2-
      at Object.logWithlabel [as logError] (C:/ZWTF/src/lib/Logging.js:354:24)
      at logError (C:/ZWTF/src/lib/Logging.js:41:95)
      at logSpecial (C:/ZWTF/src/lib/Logging.js:128:5)
      at genericCheck (C:/ZWTF/src/lib/CheckUtils.js:90:3)
      at chkTextContains (C:/ZWTF/src/lib/CheckUtils.js:48:10)
      at check_has_another (C:/ZWTF/testCases/Another_Demo_Case.js:62:3)
      at validate (C:/ZWTF/src/lib/TestRunner.js:97:7)
      at Array.forEach (native)
      at runValidators (C:/ZWTF/src/lib/TestRunner.js:108:16)
      at runTestItem (C:/ZWTF/src/lib/TestRunner.js:133:5)
      at C:/ZWTF/src/lib/TestRunner.js:149:30
      at Array.forEach (native)
      at runTest (C:/ZWTF/src/lib/TestRunner.js:149:12)
      at runTestInstance (C:/ZWTF/src/lib/TestRunner.js:208:7)
      at Array.forEach (native)
      at testRun (C:/ZWTF/src/lib/TestRunner.js:212:14)
      at run (C:/ZWTF/testCases/ProjectConfig.js:111:3)
      at Context.<anonymous> (C:/ZWTF/src/test/ProjectConfig.integration.js:23:5)
      at callFn (C:\ZWTF\node_modules\mocha\lib\runnable.js:348:21)
      at Test.Runnable.run (C:\ZWTF\node_modules\mocha\lib\runnable.js:340:7)
      at Runner.runTest (C:\ZWTF\node_modules\mocha\lib\runner.js:443:10)
      at C:\ZWTF\node_modules\mocha\lib\runner.js:549:12
      at next (C:\ZWTF\node_modules\mocha\lib\runner.js:361:14)
      at C:\ZWTF\node_modules\mocha\lib\runner.js:371:7
      at next (C:\ZWTF\node_modules\mocha\lib\runner.js:295:14)
      at Immediate.<anonymous> (C:\ZWTF\node_modules\mocha\lib\runner.js:339:5)
      at runCallback (timers.js:800:20)
      at tryOnImmediate (timers.js:762:5)
      at processImmediate [as _immediateCallback] (timers.js:733:5)
-------------------------------
timestamp: '2017-10-14 16:03:22'
level: info
subType: Message
popControl: PopFolder
message: Pop Folder
-------------------------------
timestamp: '2017-10-14 16:03:22'
level: info
subType: Message
popControl: PopFolder
message: Pop Folder
-------------------------------
timestamp: '2017-10-14 16:03:22'
level: info
subType: Summary
popControl: NoAction
message: Summary not implemented
-------------------------------
timestamp: '2017-10-14 16:03:22'
level: info
subType: IterationEnd
popControl: PopFolder
message: End Iteration 1
additionalInfo: |
  id: 1
-------------------------------
timestamp: '2017-10-14 16:03:22'
level: info
subType: IterationStart
popControl: PushFolder
message: >-
  Iteration: 2: Another_Demo_Case.js - When I run another test then i get
  another result
additionalInfo: |
  id: 2
  testName: Another_Demo_Case.js
  when: I run another test
  then: i get another result
-------------------------------
timestamp: '2017-10-14 16:03:22'
level: info
subType: InteractorStart
popControl: PushFolder
message: Start Interaction
-------------------------------
timestamp: '2017-10-14 16:03:22'
level: info
subType: Message
popControl: PopFolder
message: Pop Folder
-------------------------------
timestamp: '2017-10-14 16:03:22'
level: info
subType: ValidationStart
popControl: PushFolder
message: Start Validation
additionalInfo: |
  dState:
    when: I run another test
-------------------------------
timestamp: '2017-10-14 16:03:22'
level: info
subType: Message
popControl: PushFolder
message: check_has_another
-------------------------------
timestamp: '2017-10-14 16:03:22'
level: info
subType: CheckPass
popControl: NoAction
message: Check Text Contains
additionalInfo: |-
  Looking for: another
   in
  I run another test
-------------------------------
timestamp: '2017-10-14 16:03:22'
level: info
subType: Message
popControl: PopFolder
message: Pop Folder
-------------------------------
timestamp: '2017-10-14 16:03:22'
level: info
subType: Message
popControl: PopFolder
message: Pop Folder
-------------------------------
timestamp: '2017-10-14 16:03:22'
level: info
subType: Summary
popControl: NoAction
message: Summary not implemented
-------------------------------
timestamp: '2017-10-14 16:03:22'
level: info
subType: IterationEnd
popControl: PopFolder
message: End Iteration 2
additionalInfo: |
  id: 2
-------------------------------
timestamp: '2017-10-14 16:03:22'
level: info
subType: TestEnd
popControl: PopFolder
message: 'End Test 2 : Another_Demo_Case.js'
additionalInfo: |
  id: 2
  testName: Another_Demo_Case.js
-------------------------------
timestamp: '2017-10-14 16:03:22'
level: info
subType: TestStart
popControl: PushFolder
message: 'Test: 1: Demo_Case.js - When  then '
additionalInfo: |
  id: 1
  when: ''
  then: ''
  owner: JW
  enabled: true
  countries:
    - New Zealand
    - Australia
  environments:
    - TST
  depth: Regression
-------------------------------
timestamp: '2017-10-14 16:03:22'
level: info
subType: Message
message: Loading Test Items
-------------------------------
timestamp: '2017-10-14 16:03:22'
level: info
subType: IterationStart
popControl: PushFolder
message: 'Iteration: 1: Demo_Case.js - When I run a test then i get the result'
additionalInfo: |
  id: 1
  testName: Demo_Case.js
  when: I run a test
  then: i get the result
-------------------------------
timestamp: '2017-10-14 16:03:22'
level: info
subType: InteractorStart
popControl: PushFolder
message: Start Interaction
-------------------------------
timestamp: '2017-10-14 16:03:22'
level: info
subType: Message
popControl: PopFolder
message: Pop Folder
-------------------------------
timestamp: '2017-10-14 16:03:22'
level: info
subType: ValidationStart
popControl: PushFolder
message: Start Validation
additionalInfo: |
  dState:
    id: 1
-------------------------------
timestamp: '2017-10-14 16:03:22'
level: info
subType: Message
popControl: PushFolder
message: check_less_than_2
-------------------------------
timestamp: '2017-10-14 16:03:22'
level: info
subType: StartDefect
popControl: NoAction
message: 'Defect Expected: should fail'
-------------------------------
timestamp: '2017-10-14 16:03:22'
level: info
subType: CheckPass
popControl: NoAction
message: 'Check: expect less than 2'
-------------------------------
timestamp: '2017-10-14 16:03:22'
level: info
subType: EndDefect
popControl: NoAction
message: End Defect
-------------------------------
timestamp: '2017-10-14 16:03:22'
level: info
subType: Message
popControl: PopFolder
message: Pop Folder
-------------------------------
timestamp: '2017-10-14 16:03:22'
level: info
subType: Message
popControl: PopFolder
message: Pop Folder
-------------------------------
timestamp: '2017-10-14 16:03:22'
level: info
subType: Summary
popControl: NoAction
message: Summary not implemented
-------------------------------
timestamp: '2017-10-14 16:03:22'
level: info
subType: IterationEnd
popControl: PopFolder
message: End Iteration 1
additionalInfo: |
  id: 1
-------------------------------
timestamp: '2017-10-14 16:03:22'
level: info
subType: IterationStart
popControl: PushFolder
message: 'Iteration: 2: Demo_Case.js - When I run another test then i get another result'
additionalInfo: |
  id: 2
  testName: Demo_Case.js
  when: I run another test
  then: i get another result
-------------------------------
timestamp: '2017-10-14 16:03:22'
level: info
subType: InteractorStart
popControl: PushFolder
message: Start Interaction
-------------------------------
timestamp: '2017-10-14 16:03:22'
level: info
subType: Message
popControl: PopFolder
message: Pop Folder
-------------------------------
timestamp: '2017-10-14 16:03:22'
level: info
subType: ValidationStart
popControl: PushFolder
message: Start Validation
additionalInfo: |
  dState:
    id: 2
-------------------------------
timestamp: '2017-10-14 16:03:22'
level: info
subType: Message
popControl: PushFolder
message: check_less_than_2
-------------------------------
timestamp: '2017-10-14 16:03:22'
level: info
subType: StartDefect
popControl: NoAction
message: 'Defect Expected: should fail'
-------------------------------
timestamp: '2017-10-14 16:03:22'
level: error
subType: CheckFail
popControl: NoAction
message: 'Check: expect less than 2'
callstack: |2-
      at Object.logWithlabel [as logError] (C:/ZWTF/src/lib/Logging.js:354:24)
      at logError (C:/ZWTF/src/lib/Logging.js:41:95)
      at logSpecial (C:/ZWTF/src/lib/Logging.js:128:5)
      at genericCheck (C:/ZWTF/src/lib/CheckUtils.js:90:3)
      at check (C:/ZWTF/src/lib/CheckUtils.js:10:88)
      at check_less_than_2 (C:/ZWTF/testCases/Demo_Case.js:67:3)
      at validate (C:/ZWTF/src/lib/TestRunner.js:97:7)
      at Array.forEach (native)
      at runValidators (C:/ZWTF/src/lib/TestRunner.js:108:16)
      at runTestItem (C:/ZWTF/src/lib/TestRunner.js:133:5)
      at C:/ZWTF/src/lib/TestRunner.js:149:30
      at Array.forEach (native)
      at runTest (C:/ZWTF/src/lib/TestRunner.js:149:12)
      at runTestInstance (C:/ZWTF/src/lib/TestRunner.js:208:7)
      at Array.forEach (native)
      at testRun (C:/ZWTF/src/lib/TestRunner.js:212:14)
      at run (C:/ZWTF/testCases/ProjectConfig.js:111:3)
      at Context.<anonymous> (C:/ZWTF/src/test/ProjectConfig.integration.js:23:5)
      at callFn (C:\ZWTF\node_modules\mocha\lib\runnable.js:348:21)
      at Test.Runnable.run (C:\ZWTF\node_modules\mocha\lib\runnable.js:340:7)
      at Runner.runTest (C:\ZWTF\node_modules\mocha\lib\runner.js:443:10)
      at C:\ZWTF\node_modules\mocha\lib\runner.js:549:12
      at next (C:\ZWTF\node_modules\mocha\lib\runner.js:361:14)
      at C:\ZWTF\node_modules\mocha\lib\runner.js:371:7
      at next (C:\ZWTF\node_modules\mocha\lib\runner.js:295:14)
      at Immediate.<anonymous> (C:\ZWTF\node_modules\mocha\lib\runner.js:339:5)
      at runCallback (timers.js:800:20)
      at tryOnImmediate (timers.js:762:5)
      at processImmediate [as _immediateCallback] (timers.js:733:5)
-------------------------------
timestamp: '2017-10-14 16:03:22'
level: info
subType: EndDefect
popControl: NoAction
message: End Defect
-------------------------------
timestamp: '2017-10-14 16:03:22'
level: info
subType: Message
popControl: PopFolder
message: Pop Folder
-------------------------------
timestamp: '2017-10-14 16:03:22'
level: info
subType: Message
popControl: PushFolder
message: check_less_than_3
-------------------------------
timestamp: '2017-10-14 16:03:22'
level: info
subType: CheckPass
popControl: NoAction
message: 'Check: expect less than 2'
-------------------------------
timestamp: '2017-10-14 16:03:22'
level: info
subType: Message
popControl: PopFolder
message: Pop Folder
-------------------------------
timestamp: '2017-10-14 16:03:22'
level: info
subType: Message
popControl: PopFolder
message: Pop Folder
-------------------------------
timestamp: '2017-10-14 16:03:22'
level: info
subType: Summary
popControl: NoAction
message: Summary not implemented
-------------------------------
timestamp: '2017-10-14 16:03:22'
level: info
subType: IterationEnd
popControl: PopFolder
message: End Iteration 2
additionalInfo: |
  id: 2
-------------------------------
timestamp: '2017-10-14 16:03:22'
level: info
subType: IterationStart
popControl: PushFolder
message: 'Iteration: 3: Demo_Case.js - When I run another test then i get another result'
additionalInfo: |
  id: 3
  testName: Demo_Case.js
  when: I run another test
  then: i get another result
-------------------------------
timestamp: '2017-10-14 16:03:22'
level: info
subType: InteractorStart
popControl: PushFolder
message: Start Interaction
-------------------------------
timestamp: '2017-10-14 16:03:22'
level: info
subType: Message
popControl: PopFolder
message: Pop Folder
-------------------------------
timestamp: '2017-10-14 16:03:22'
level: info
subType: ValidationStart
popControl: PushFolder
message: Start Validation
additionalInfo: |
  dState:
    id: 3
-------------------------------
timestamp: '2017-10-14 16:03:22'
level: info
subType: Message
popControl: PushFolder
message: check_bad_validator
-------------------------------
timestamp: '2017-10-14 16:03:22'
level: error
subType: Exception
popControl: NoAction
message: 'Exception thrown in validator: check_bad_validator'
additionalInfo: ARGGGHHHHHH!!!
callstack: |2-
      at Object.logWithlabel [as logError] (C:/ZWTF/src/lib/Logging.js:354:24)
      at logError (C:/ZWTF/src/lib/Logging.js:41:95)
      at logException (C:/ZWTF/src/lib/Logging.js:64:67)
      at validate (C:/ZWTF/src/lib/TestRunner.js:99:7)
      at Array.forEach (native)
      at runValidators (C:/ZWTF/src/lib/TestRunner.js:108:16)
      at runTestItem (C:/ZWTF/src/lib/TestRunner.js:133:5)
      at C:/ZWTF/src/lib/TestRunner.js:149:30
      at Array.forEach (native)
      at runTest (C:/ZWTF/src/lib/TestRunner.js:149:12)
      at runTestInstance (C:/ZWTF/src/lib/TestRunner.js:208:7)
      at Array.forEach (native)
      at testRun (C:/ZWTF/src/lib/TestRunner.js:212:14)
      at run (C:/ZWTF/testCases/ProjectConfig.js:111:3)
      at Context.<anonymous> (C:/ZWTF/src/test/ProjectConfig.integration.js:23:5)
      at callFn (C:\ZWTF\node_modules\mocha\lib\runnable.js:348:21)
      at Test.Runnable.run (C:\ZWTF\node_modules\mocha\lib\runnable.js:340:7)
      at Runner.runTest (C:\ZWTF\node_modules\mocha\lib\runner.js:443:10)
      at C:\ZWTF\node_modules\mocha\lib\runner.js:549:12
      at next (C:\ZWTF\node_modules\mocha\lib\runner.js:361:14)
      at C:\ZWTF\node_modules\mocha\lib\runner.js:371:7
      at next (C:\ZWTF\node_modules\mocha\lib\runner.js:295:14)
      at Immediate.<anonymous> (C:\ZWTF\node_modules\mocha\lib\runner.js:339:5)
      at runCallback (timers.js:800:20)
      at tryOnImmediate (timers.js:762:5)
      at processImmediate [as _immediateCallback] (timers.js:733:5)
-------------------------------
timestamp: '2017-10-14 16:03:22'
level: info
subType: Message
popControl: PopFolder
message: Pop Folder
-------------------------------
timestamp: '2017-10-14 16:03:22'
level: info
subType: Message
popControl: PopFolder
message: Pop Folder
-------------------------------
timestamp: '2017-10-14 16:03:22'
level: error
subType: Exception
popControl: NoAction
message: Exception Thrown Executing Validators
additionalInfo: ARGGGHHHHHH!!!
callstack: |2-
      at Object.logWithlabel [as logError] (C:/ZWTF/src/lib/Logging.js:354:24)
      at logError (C:/ZWTF/src/lib/Logging.js:41:95)
      at logException (C:/ZWTF/src/lib/Logging.js:64:67)
      at runTestItem (C:/ZWTF/src/lib/TestRunner.js:140:5)
      at C:/ZWTF/src/lib/TestRunner.js:149:30
      at Array.forEach (native)
      at runTest (C:/ZWTF/src/lib/TestRunner.js:149:12)
      at runTestInstance (C:/ZWTF/src/lib/TestRunner.js:208:7)
      at Array.forEach (native)
      at testRun (C:/ZWTF/src/lib/TestRunner.js:212:14)
      at run (C:/ZWTF/testCases/ProjectConfig.js:111:3)
      at Context.<anonymous> (C:/ZWTF/src/test/ProjectConfig.integration.js:23:5)
      at callFn (C:\ZWTF\node_modules\mocha\lib\runnable.js:348:21)
      at Test.Runnable.run (C:\ZWTF\node_modules\mocha\lib\runnable.js:340:7)
      at Runner.runTest (C:\ZWTF\node_modules\mocha\lib\runner.js:443:10)
      at C:\ZWTF\node_modules\mocha\lib\runner.js:549:12
      at next (C:\ZWTF\node_modules\mocha\lib\runner.js:361:14)
      at C:\ZWTF\node_modules\mocha\lib\runner.js:371:7
      at next (C:\ZWTF\node_modules\mocha\lib\runner.js:295:14)
      at Immediate.<anonymous> (C:\ZWTF\node_modules\mocha\lib\runner.js:339:5)
      at runCallback (timers.js:800:20)
      at tryOnImmediate (timers.js:762:5)
      at processImmediate [as _immediateCallback] (timers.js:733:5)
-------------------------------
timestamp: '2017-10-14 16:03:22'
level: info
subType: IterationEnd
popControl: PopFolder
message: End Iteration 3
additionalInfo: |
  id: 3
-------------------------------
timestamp: '2017-10-14 16:03:22'
level: info
subType: IterationStart
popControl: PushFolder
message: 'Iteration: 4: Demo_Case.js - When I run another test then i get another result'
additionalInfo: |
  id: 4
  testName: Demo_Case.js
  when: I run another test
  then: i get another result
-------------------------------
timestamp: '2017-10-14 16:03:22'
level: info
subType: InteractorStart
popControl: PushFolder
message: Start Interaction
-------------------------------
timestamp: '2017-10-14 16:03:22'
level: error
subType: Exception
popControl: NoAction
message: I do not like 4
additionalInfo: ''
callstack: |2-
      at Object.logWithlabel [as logError] (C:/ZWTF/src/lib/Logging.js:354:24)
      at logError (C:/ZWTF/src/lib/Logging.js:41:95)
      at logException (C:/ZWTF/src/lib/Logging.js:64:67)
      at fail (C:/ZWTF/src/lib/SysUtils.js:449:3)
      at Object.interactor (C:/ZWTF/testCases/Demo_Case.js:26:5)
      at runTestItem (C:/ZWTF/src/lib/TestRunner.js:124:26)
      at C:/ZWTF/src/lib/TestRunner.js:149:30
      at Array.forEach (native)
      at runTest (C:/ZWTF/src/lib/TestRunner.js:149:12)
      at runTestInstance (C:/ZWTF/src/lib/TestRunner.js:208:7)
      at Array.forEach (native)
      at testRun (C:/ZWTF/src/lib/TestRunner.js:212:14)
      at run (C:/ZWTF/testCases/ProjectConfig.js:111:3)
      at Context.<anonymous> (C:/ZWTF/src/test/ProjectConfig.integration.js:23:5)
      at callFn (C:\ZWTF\node_modules\mocha\lib\runnable.js:348:21)
      at Test.Runnable.run (C:\ZWTF\node_modules\mocha\lib\runnable.js:340:7)
      at Runner.runTest (C:\ZWTF\node_modules\mocha\lib\runner.js:443:10)
      at C:\ZWTF\node_modules\mocha\lib\runner.js:549:12
      at next (C:\ZWTF\node_modules\mocha\lib\runner.js:361:14)
      at C:\ZWTF\node_modules\mocha\lib\runner.js:371:7
      at next (C:\ZWTF\node_modules\mocha\lib\runner.js:295:14)
      at Immediate.<anonymous> (C:\ZWTF\node_modules\mocha\lib\runner.js:339:5)
      at runCallback (timers.js:800:20)
      at tryOnImmediate (timers.js:762:5)
      at processImmediate [as _immediateCallback] (timers.js:733:5)
-------------------------------
timestamp: '2017-10-14 16:03:22'
level: info
subType: Message
popControl: PopFolder
message: Pop Folder
-------------------------------
timestamp: '2017-10-14 16:03:22'
level: error
subType: Exception
popControl: NoAction
message: Exception Thrown Executing Interactor
additionalInfo: ''
callstack: |2-
      at Object.logWithlabel [as logError] (C:/ZWTF/src/lib/Logging.js:354:24)
      at logError (C:/ZWTF/src/lib/Logging.js:41:95)
      at logException (C:/ZWTF/src/lib/Logging.js:64:67)
      at runTestItem (C:/ZWTF/src/lib/TestRunner.js:140:5)
      at C:/ZWTF/src/lib/TestRunner.js:149:30
      at Array.forEach (native)
      at runTest (C:/ZWTF/src/lib/TestRunner.js:149:12)
      at runTestInstance (C:/ZWTF/src/lib/TestRunner.js:208:7)
      at Array.forEach (native)
      at testRun (C:/ZWTF/src/lib/TestRunner.js:212:14)
      at run (C:/ZWTF/testCases/ProjectConfig.js:111:3)
      at Context.<anonymous> (C:/ZWTF/src/test/ProjectConfig.integration.js:23:5)
      at callFn (C:\ZWTF\node_modules\mocha\lib\runnable.js:348:21)
      at Test.Runnable.run (C:\ZWTF\node_modules\mocha\lib\runnable.js:340:7)
      at Runner.runTest (C:\ZWTF\node_modules\mocha\lib\runner.js:443:10)
      at C:\ZWTF\node_modules\mocha\lib\runner.js:549:12
      at next (C:\ZWTF\node_modules\mocha\lib\runner.js:361:14)
      at C:\ZWTF\node_modules\mocha\lib\runner.js:371:7
      at next (C:\ZWTF\node_modules\mocha\lib\runner.js:295:14)
      at Immediate.<anonymous> (C:\ZWTF\node_modules\mocha\lib\runner.js:339:5)
      at runCallback (timers.js:800:20)
      at tryOnImmediate (timers.js:762:5)
      at processImmediate [as _immediateCallback] (timers.js:733:5)
-------------------------------
timestamp: '2017-10-14 16:03:22'
level: info
subType: IterationEnd
popControl: PopFolder
message: End Iteration 4
additionalInfo: |
  id: 4
-------------------------------
timestamp: '2017-10-14 16:03:22'
level: info
subType: TestEnd
popControl: PopFolder
message: 'End Test 1 : Demo_Case.js'
additionalInfo: |
  id: 1
  testName: Demo_Case.js
-------------------------------
timestamp: '2017-10-14 16:03:22'
level: info
subType: RunEnd
popControl: PopFolder
message: 'End Run: Test Test Run'
-------------------------------
`
