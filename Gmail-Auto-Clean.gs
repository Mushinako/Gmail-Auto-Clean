// Compiled using ts2gas 3.6.3 (TypeScript 3.9.7)
// Url of the sheet
var sheetUrl = "https://docs.google.com/spreadsheets/d/14dva-9d6e6Iiut_JGd-SVL_8druhAMerQXEqRqb1Iuk/edit?usp=sharing";
// Sheet names for each removal and archiving
var removalSheetName = "Removal";
var archiveSheetName = "Archive";
// Auto exclude the emails you sent. Note that this DOES NOT exclude the whole thread
var exclude = [Session.getEffectiveUser().getEmail()];
// Domains should be put on column D
var domainColIndex = 4; // 1-based

function processSheet(sheet) {
    var rules = {};
    var list = sheet.getDataRange().getValues();
    // Get email, days; calculate domain
    var domains = [];
    for (var i = 0; i < list.length; i++) {
        var rule = list[i];
        var email = rule[0];
        var domain = email.split("@")[1];
        domains.push([domain]);
        var days = rule[1];
        rules[email] = days;
    }
    // Put back all the domains as a block
    sheet.getRange(1, domainColIndex, domains.length).setValues(domains).setShowHyperlink(false);
    return rules;
}
function getRules() {
    var file = SpreadsheetApp.openByUrl(sheetUrl);
    var removalRules = processSheet(file.getSheetByName(removalSheetName));
    var archiveRules = processSheet(file.getSheetByName(archiveSheetName));
    return [removalRules, archiveRules];
}
function getDiffDays(dateEarly, dateLate) {
    var diffMs = dateLate.getTime() - dateEarly.getTime();
    var diffDays = diffMs / 86400000;
    return diffDays;
}
function getLastEmail(emails, exclude) {
    var email;
    for (var _i = 0, _a = emails.reverse(); _i < _a.length; _i++) {
        email = _a[_i];
        var from = email.getFrom().replace(/^.+<([^>]+)>.*$/, "$1");
        if (!exclude.includes(from))
            return email;
    }
    return null;
}
function hasLabel(thread, labelName) {
    var labelNames = thread.getLabels().map(function (label) { return label.getName(); });
    var isLabeled = labelNames.includes(labelName);
    return isLabeled;
}
function gmailAutoClean() {
    var _a, _b;
    var _c = getRules(), removalRules = _c[0], archiveRules = _c[1];
    var removedNum = 0;
    var archivedNum = 0;
    var autoRemovedLabelName = "Autoremoved";
    var autoArchivedLabelName = "Autoarchived";
    var autoRemovedLabel = (_a = GmailApp.getUserLabelByName(autoRemovedLabelName)) !== null && _a !== void 0 ? _a : GmailApp.createLabel(autoRemovedLabelName);
    var autoArchivedLabel = (_b = GmailApp.getUserLabelByName(autoArchivedLabelName)) !== null && _b !== void 0 ? _b : GmailApp.createLabel(autoArchivedLabelName);
    var currDate = new Date();
    var threads = GmailApp.getInboxThreads();
    for (var _i = 0, threads_1 = threads; _i < threads_1.length; _i++) {
        var thread = threads_1[_i];
        if (thread.isImportant())
            continue;
        var emails = thread.getMessages();
        var isArchiveLabeled = hasLabel(thread, autoArchivedLabelName);
        var lastEmail = getLastEmail(emails, exclude);
        if (lastEmail !== null) {
            var lastFrom = lastEmail.getFrom().replace(/^.+<([^>]+)>.*$/, "$1");
            if (archiveRules.hasOwnProperty(lastFrom)) {
                var lastDate = lastEmail.getDate();
                var diffDays = getDiffDays(lastDate, currDate);
                if (diffDays < archiveRules[lastFrom])
                    continue;
                if (!isArchiveLabeled) {
                    thread.addLabel(autoArchivedLabel);
                    isArchiveLabeled = true;
                }
                thread.moveToArchive();
                var newThread = thread.refresh();
                Logger.log("", lastFrom, "archived", diffDays, hasLabel(newThread, autoArchivedLabelName));
                archivedNum++;
                continue;
            }
        }
        var isRemoveLabeled = hasLabel(thread, autoRemovedLabelName);
        for (var _d = 0, emails_1 = emails; _d < emails_1.length; _d++) {
            var email = emails_1[_d];
            if (email.isStarred())
                continue;
            var from = email.getFrom().replace(/^.+<([^>]+)>.*$/, "$1");
            if (!removalRules.hasOwnProperty(from))
                continue;
            var date = email.getDate();
            var diffDays = getDiffDays(date, currDate);
            if (diffDays < removalRules[from])
                continue;
            if (!isRemoveLabeled) {
                thread.addLabel(autoRemovedLabel);
                isRemoveLabeled = true;
            }
            email.moveToTrash();
            var newThread = thread.refresh();
            var newEmail = email.refresh();
            Logger.log("", from, "removed", diffDays, hasLabel(newThread, autoRemovedLabelName), newEmail.isInTrash());
            removedNum++;
            continue;
        }
    }
    Logger.log("", "Archived: " + archivedNum, "Removed: " + removedNum);
}
