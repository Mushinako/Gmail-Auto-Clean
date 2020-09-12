const sheetUrl = "https://docs.google.com/spreadsheets/d/14dva-9d6e6Iiut_JGd-SVL_8druhAMerQXEqRqb1Iuk/edit?usp=sharing";
const removalSheetName = "Removal";
const archiveSheetName = "Archive";
const exclude = [Session.getEffectiveUser().getEmail()];

const domainColIndex = 4;   // 1-based


function processSheet(sheet: GoogleAppsScript.Spreadsheet.Sheet): Record<string, number> {
  const rules: Record<string, number> = {};
  const list = sheet.getDataRange().getValues();
  const domains: string[][] = [];
  for (let i = 0; i < list.length; i++) {
    const rule = list[i];
    const email: string = rule[0];
    const domain = email.split("@")[1];
    domains.push([domain]);

    const days: number = rule[1];
    rules[email] = days;
  }
  sheet.getRange(1, domainColIndex, domains.length).setValues(domains).setShowHyperlink(false);
  return rules;
}


function getRules(): [Record<string, number>, Record<string, number>] {
  const file = SpreadsheetApp.openByUrl(sheetUrl);
  const removalRules = processSheet(file.getSheetByName(removalSheetName));
  const archiveRules = processSheet(file.getSheetByName(archiveSheetName));
  return [removalRules, archiveRules];
}

function getDiffDays(dateEarly: GoogleAppsScript.Base.Date, dateLate: Date): number {
  const diffMs = dateLate.getTime() - dateEarly.getTime();
  const diffDays = diffMs / 86400000;
  return diffDays;
}


function getLastEmail(emails: GoogleAppsScript.Gmail.GmailMessage[], exclude: string[]): GoogleAppsScript.Gmail.GmailMessage {
  let email: GoogleAppsScript.Gmail.GmailMessage;
  for (email of emails.reverse()) {
    const from = email.getFrom().replace(/^.+<([^>]+)>.*$/, "$1");
    if (!exclude.includes(from)) break;
  }
  return email;
}


function hasLabel(thread: GoogleAppsScript.Gmail.GmailThread, labelName: string): boolean {
  const labelNames = thread.getLabels().map((label) => label.getName());
  const isLabeled = labelNames.includes(labelName);
  return isLabeled;
}


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
    if (thread.isImportant()) continue;

    const emails = thread.getMessages();

    let isArchiveLabeled = hasLabel(thread, autoArchivedLabelName);
    const lastEmail = getLastEmail(emails, exclude);
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

    let isRemoveLabeled = hasLabel(thread, autoRemovedLabelName);
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
