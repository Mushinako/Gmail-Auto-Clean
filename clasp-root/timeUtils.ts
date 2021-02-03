/**
 * Calculate date difference
 * 
 * @param {GoogleAppsScript.Base.Date} emailDate - Date of the email
 * @param {number} currentTime - Time of script run, got from `.getTime()`
 * @returns {number} - Date difference in days
 */
function dayDiff(emailDate: GoogleAppsScript.Base.Date, currentTime: number): number {
    const diffMilliseconds = currentTime - emailDate.getTime();
    return diffMilliseconds / 86400000;
}
