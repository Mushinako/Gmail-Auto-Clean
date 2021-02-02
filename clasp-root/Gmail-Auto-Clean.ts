// Url of the sheet
const sheetUrl = "https://docs.google.com/spreadsheets/d/14dva-9d6e6Iiut_JGd-SVL_8druhAMerQXEqRqb1Iuk/edit?usp=sharing";
// Sheet names for each removal and archiving
const removalSheetName = "Removal";
const archiveSheetName = "Archive";

// Auto exclude the emails you sent. Note that this DOES NOT exclude the whole thread
const exclude = [Session.getEffectiveUser().getEmail()];

/**
 * Get data from sheet and put the domains back
 * 
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet: The sheet object in question
 * @returns {Record<string, number>}: The object containing email addresses and days
 */
function processSheet(sheet: GoogleAppsScript.Spreadsheet.Sheet): Record<string, number> {
  const rules: Record<string, number> = {};
  const list = sheet.getDataRange().getValues();
  // Get email, days
  for (let i = 0; i < list.length; i++) {
    const rule = list[i];
    const email: string = rule[0];
    const days: number = rule[1];
    rules[email] = days;
  }
  return rules;
}

/**
 * Get removal and archiving rules separately.
 * 
 * @returns {[Record<string, number>, Record<string, number>]}: The objects for removal and archival rules
 */
function getRules(): [Record<string, number>, Record<string, number>] {
  const file = SpreadsheetApp.openByUrl(sheetUrl);
  const removalRules = processSheet(file.getSheetByName(removalSheetName));
  const archiveRules = processSheet(file.getSheetByName(archiveSheetName));
  return [removalRules, archiveRules];
}

/**
 * Calculate date differences
 * 
 * @param {Date} dateEarly: The date to be subtracted
 * @param {Date} dateLate: The date to subtract from
 * @returns {number}: Date difference in days
 */
function getDiffDays(dateEarly: GoogleAppsScript.Base.Date, dateLate: Date): number {
  const diffMs = dateLate.getTime() - dateEarly.getTime();
  const diffDays = diffMs / 86400000;
  return diffDays;
}

/**
 * Get last email in the list of emails that is not from an email address in `exclude`
 * 
 * @param {GoogleAppsScript.Gmail.GmailMessage[]} emails : Array of email objects
 * @param {string[]}                              exclude: List of email addresses to exclude
 * @returns {?GoogleAppsScript.Gmail.GmailMessage}: The last email object that satisfies the conditions. `null` if there is none
 */
function getLastEmail(emails: GoogleAppsScript.Gmail.GmailMessage[], exclude: string[]): GoogleAppsScript.Gmail.GmailMessage | null {
  let email: GoogleAppsScript.Gmail.GmailMessage;
  for (email of emails.reverse()) {
    const from = email.getFrom().replace(/^.+<([^>]+)>.*$/, "$1");
    if (!exclude.includes(from)) return email;
  }
  return null;
}

/**
 * Whether a thread has a specific label name
 * 
 * @param {GoogleAppsScript.Gmail.GmailThread} thread   : The thread of emails
 * @param {string}                             labelName: The name of the label to be checked
 * @returns {boolean}: Whether the label is present
 */
function hasLabel(thread: GoogleAppsScript.Gmail.GmailThread, labelName: string): boolean {
  const labelNames = thread.getLabels().map((label) => label.getName());
  const isLabeled = labelNames.includes(labelName);
  return isLabeled;
}

/**
 * Main function
 */
function gmailAutoClean(): void {
  const [removalRules, archiveRules] = getRules();

  let removedNum = 0;
  let archivedNum = 0;

  const autoRemovedLabelName = "Autoremoved";
  const autoArchivedLabelName = "Autoarchived";
  let autoRemovedLabel = GmailApp.getUserLabelByName(autoRemovedLabelName) ?? GmailApp.createLabel(autoRemovedLabelName);
  let autoArchivedLabel = GmailApp.getUserLabelByName(autoArchivedLabelName) ?? GmailApp.createLabel(autoArchivedLabelName);

  const currDate = new Date();

  const threads = GmailApp.getInboxThreads();
  for (const thread of threads) {
    // Ignore important threads
    if (thread.isImportant()) continue;

    const emails = thread.getMessages();

    let isArchiveLabeled = hasLabel(thread, autoArchivedLabelName);
    const lastEmail = getLastEmail(emails, exclude);
    // The whole thread is archived if the last email from a non-excluded sender matches
    //   the rules
    if (lastEmail !== null) {
      const lastFrom = lastEmail.getFrom().replace(/^.+<([^>]+)>.*$/, "$1");
      if (archiveRules.hasOwnProperty(lastFrom)) {
        const lastDate = lastEmail.getDate();
        const diffDays = getDiffDays(lastDate, currDate);
        if (diffDays < archiveRules[lastFrom]) continue;
        if (!isArchiveLabeled) {
          thread.addLabel(autoArchivedLabel);
          isArchiveLabeled = true;
        }
        thread.moveToArchive();
        const newThread = thread.refresh();
        Logger.log("", lastFrom, "archived", diffDays, hasLabel(newThread, autoArchivedLabelName));
        archivedNum++;
        continue;
      }
    }

    let isRemoveLabeled = hasLabel(thread, autoRemovedLabelName);
    // Each email is checked against the rule and deleted individually
    for (const email of emails) {
      if (email.isStarred()) continue;
      const from = email.getFrom().replace(/^.+<([^>]+)>.*$/, "$1");
      if (!removalRules.hasOwnProperty(from)) continue;
      const date = email.getDate();
      const diffDays = getDiffDays(date, currDate);
      if (diffDays < removalRules[from]) continue;
      if (!isRemoveLabeled) {
        thread.addLabel(autoRemovedLabel);
        isRemoveLabeled = true;
      }
      email.moveToTrash();
      const newThread = thread.refresh();
      const newEmail = email.refresh();
      Logger.log("", from, "removed", diffDays, hasLabel(newThread, autoRemovedLabelName), newEmail.isInTrash());
      removedNum++;
      continue;
    }
  }
  Logger.log("", `Archived: ${archivedNum}`, `Removed: ${removedNum}`);
}
