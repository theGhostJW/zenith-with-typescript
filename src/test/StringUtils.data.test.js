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
