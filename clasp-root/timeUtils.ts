/**
 * Calculate date difference
 * 
 * @param {GoogleAppsScript.Base.Date} emailDate - Date of the email
 * @param {Date} currentDate - Date of script run
 * @returns {number} - Date difference in days
 */
function dayDiff(emailDate: GoogleAppsScript.Base.Date, currentDate: Date): number {
    const diffMilliseconds = currentDate.getTime() - emailDate.getTime();
    return diffMilliseconds / 86400000;
}
