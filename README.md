# Gmail Auto Clean

Google Apps Script that automatically removes/archives old emails according to your rules.

## Use

1. Create a new Google Sheets workbook
2. Make sure that you have 2 sheets in the workbook. One for removals, and one for archiving
3. Add your rules to the workbook. The first column contains the email addresses; the second column contains the number of days before which the email should be deleted. Example [here](https://docs.google.com/spreadsheets/d/14dva-9d6e6Iiut_JGd-SVL_8druhAMerQXEqRqb1Iuk/edit?usp=sharing)
4. Put the urls and sheet names in the script at the top
5. Run this script

## View Archived/Removed Emails

* Archived: search for `label:autoarchived`
* Removed: search for `label:autoremoved in:trash`

## Note

You'll have to grant the script necessary permissions to edit Google Sheets and edit your emails
