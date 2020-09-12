const sheetUrl = "https://docs.google.com/spreadsheets/d/14dva-9d6e6Iiut_JGd-SVL_8druhAMerQXEqRqb1Iuk/edit?usp=sharing";    // URL to your spreadsheet
const removalSheetName = "Removal";     // Sheet name for removals
const archiveSheetName = "Archive";     // Sheet name for archives
const domainColIndex = 4;               // 1-based


function processSheet(sheet) {
    const rules = {};
    const list = sheet.getDataRange().getValues();
    const domains = [];
    for (let i = 0; i < list.length; i++) {
        const rule = list[i];
        const email = rule[0];
        const domain = email.split("@")[1];
        domains.push([domain]);

        const days = rule[1];
        rules[email] = days;
    }
    sheet.getRange(1, domainColIndex, domains.length).setValues(domains).setShowHyperlink(false);
    return rules;
}


function getRules() {
    const file = SpreadsheetApp.openByUrl(sheetUrl);
    const removalRules = processSheet(file.getSheetByName(removalSheetName));
    const archiveRules = processSheet(file.getSheetByName(archiveSheetName));
    return [removalRules, archiveRules];
}

function getDiffDays(dateEarly, dateLate) {
    const diffMs = dateLate - dateEarly;
    const diffDays = diffMs / 86400000;
    return diffDays;
}


function getLastEmail(emails, exclude) {
    let email;
    for (email of emails.reverse()) {
        const from = email.getFrom().replace(/^.+<([^>]+)>.*$/, "$1");
        if (!exclude.includes(from)) break;
    }
    return email;
}


function hasLabel(obj, labelName) {
    const labelNames = obj.getLabels().map((label) => label.getName());
    const isLabeled = labelNames.includes(labelName);
    return isLabeled;
}


function myFunction() {
    const [removalRules, archiveRules] = getRules();

    let removedNum = 0;
    let archivedNum = 0;

    const autoRemovedLabelName = "Autoremoved";
    const autoArchivedLabelName = "Autoarchived";
    let autoRemovedLabel = GmailApp.getUserLabelByName(autoRemovedLabelName);
    let autoArchivedLabel = GmailApp.getUserLabelByName(autoArchivedLabelName);
    if (autoRemovedLabel === null) autoRemovedLabel = GmailApp.createLabel(autoRemovedLabelName);
    if (autoArchivedLabel === null) autoArchivedLabel = GmailApp.createLabel(autoArchivedLabelName);

    const currDate = new Date();
    const msToDay = 1000 * 60 * 60 * 24;
    const exclude = [Session.getEffectiveUser().getEmail()];

    const threads = GmailApp.getInboxThreads();
    for (const thread of threads) {
        if (thread.isImportant()) continue;

        const emails = thread.getMessages();

        const isArchiveLabeled = hasLabel(thread, autoArchivedLabel);
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
            Logger.log(lastFrom, "archived", diffDays, hasLabel(newThread, autoArchivedLabel));
            archivedNum++;
            continue;
        }

        let isRemoveLabeled = hasLabel(thread, autoRemovedLabel);
        for (const email of emails) {
            if (email.isStarred()) continue;
            const from = email.getFrom().replace(/^.+<([^>]+)>.*$/, "$1");
            if (!removalRules.hasOwnProperty(from)) continue;
            // Logger.log(from, "matched", from);
            const date = email.getDate();
            const diffDays = getDiffDays(date, currDate);
            // Logger.log(from, "checked", diffDays);
            if (diffDays < removalRules[from]) continue;
            // Logger.log(from, "checked", email.isInTrash());
            if (!isRemoveLabeled) {
                thread.addLabel(autoRemovedLabel);
                isRemoveLabeled = true;
            }
            email.moveToTrash();
            const newThread = thread.refresh();
            const newEmail = email.refresh();
            Logger.log(from, "removed", diffDays, hasLabel(newThread, autoRemovedLabel), newEmail.isInTrash());
            removedNum++;
            continue;
        }
    }
    Logger.log(archivedNum, removedNum);
}
