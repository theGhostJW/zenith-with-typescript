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
