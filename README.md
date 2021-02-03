# Gmail Auto Clean

Google Apps Script that automatically removes/archives old emails based on sender.

## How to Use?

### Making a Copy of Google Apps Script Project

(Easier for one-time deployment)

1. Create a new Google Sheets workbook
2. Make sure that you have 2 sheets in the workbook. One for removals, and one for archiving
3. Add your rules to the workbook. The first column contains the email addresses; the second column contains the number of days before which the email should be deleted. Example [here][1]
4. Head to [the example project page][2]
5. On the left side, click **Overview**
6. On the top-right side, click the copy icon to **Make a copy**
7. Put the urls and sheet names into the top of `config.gs`
8. Edit `config.gs` to your liking
9. Navigate to `gmailAutoClean.gs`, and click `Run`
10. Setup **Triggers** (on the left) if you want to

### Deploying from This Source

(Easier for TypeScript source modification and future updates)

1. Clone this project
2. Run `npm install` to install all the dependencies listed in `package.json`
   * `@google/clasp`: For pushing code to Google Apps Script platform
   * `@types/google-apps-script`: For TypeScript type checking
3. Start a new project on [Google Apps Script][3]
4. On the left side, click **Project Settings**
5. Copy the **Script ID**, and replace the `scriptId` in `.clasp.json`
6. Create a new Google Sheets workbook
7. Make sure that you have 2 sheets in the workbook. One for removals, and one for archiving
8. Add your rules to the workbook. The first column contains the email addresses; the second column contains the number of days before which the email should be deleted. Example [here][1]
9. Put the urls and sheet names into the top of `clasp-root/config.ts`
10. Edit `clasp-root/config.ts` to your liking
11. Locate the `clasp` binary installed via `npm`, which is usually located in `./node_modules/.bin/`
12. Run `./node_modules/.bin/clasp login` with appropriate path. Log into Google
13. Run `./node_modules/.bin/clasp push`, or `./node_modules/.bin/clasp push --watch` if you intend to edit the code and have it update in real time
14. Go back to the project webpage and refresh
15. Navigate to `gmailAutoClean.gs`, and click `Run`
16. Setup **Triggers** (on the left) if you want to

## View Archived/Removed Emails

* Archived: search for `label:autoarchived`
* Removed: search for `label:autoremoved in:trash`

## Note

* You'll have to grant the script necessary permissions to edit your emails.
* This script does **not** check or modify threads marked as "important" or emails that are starred.

[1]: https://docs.google.com/spreadsheets/d/14dva-9d6e6Iiut_JGd-SVL_8druhAMerQXEqRqb1Iuk/edit?usp=sharing
[2]: https://script.google.com/d/1TjZtqsOSdqY9NLSpTdn3NXqZgkBELAUJmPoXbkHpIoHpvxdnNW1V4yRJ/edit?usp=sharing
[3]: https://script.google.com/home
