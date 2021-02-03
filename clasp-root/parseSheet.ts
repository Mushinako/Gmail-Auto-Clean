type ruleDict = Record<string, number>;

/**
 * Parse a rule sheet, returning a rule object that maps senders to number of days
 * 
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - A sheet object containing the rules
 * @returns {Record<string, number>} - Rules parsed from the sheet
 */
function parseSheet(sheet: GoogleAppsScript.Spreadsheet.Sheet): ruleDict {
    const rules: ruleDict = {};
    const data = sheet.getDataRange().getValues();

    for (const row of data) {
        const senderEmail: string = row[0];
        const days: number = row[1];
        if (senderEmail && days) {
            rules[senderEmail] = days;
        }
    }

    return rules;
}

/**
 * Parse rule workbook, returning 2 rule objects that maps senders to number of days
 * 
 * @returns {Record<string, number>} - Removal rules object
 * @returns {Record<string, number>} - Archive rules object
 */
function parseWorkbook(): [ruleDict, ruleDict] {
    const workbook = SpreadsheetApp.openByUrl(sheetUrl);
    const removalRules = parseSheet(workbook.getSheetByName(removalSheetName));
    const archiveRules = parseSheet(workbook.getSheetByName(archiveSheetName));
    return [removalRules, archiveRules];
}
