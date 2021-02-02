# Gmail Auto Clean

Google Apps Script that automatically removes/archives old emails according to your rules.

## Use

1. Create a new Google Sheets workbook
2. Make sure that you have 2 sheets in the workbook. One for removals, and one for archiving
3. Add your rules to the workbook. The first column contains the email addresses; the second column contains the number of days before which the email should be deleted. Example [here](https://docs.google.com/spreadsheets/d/14dva-9d6e6Iiut_JGd-SVL_8druhAMerQXEqRqb1Iuk/edit?usp=sharing)
4. Put the urls and sheet names into the top of `Gmail-Auto-Clean.gs`
5. Start a new project on [Google Apps Script](https://script.google.com/home)
6. Copy all the code in `Gmail-Auto-Clean.gs` into the new project
7. Run `gmailAutoClean` function in this `Gmail-Auto-Clean.gs`
8. You can automation execution using [Triggers](https://script.google.com/home/triggers)

## View Archived/Removed Emails

* Archived: search for `label:autoarchived`
* Removed: search for `label:autoremoved in:trash`

## Note

* You'll have to grant the script necessary permissions to edit Google Sheets and edit your emails.
* This script does **not** check and modify threads marked as "important".
