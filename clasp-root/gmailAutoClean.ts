// Labels for auto archived/removed emails
const autoRemovedLabelName = "Autoremoved";
const autoArchivedLabelName = "Autoarchived";

/**
 * Main function
 */
async function gmailAutoClean(): Promise<void> {
    // Get rules
    const [removalRules, archiveRules] = parseWorkbook();

    // Get label objects
    const autoRemovedLabel = GmailApp.getUserLabelByName(autoRemovedLabelName) ?? GmailApp.createLabel(autoRemovedLabelName);
    const autoArchivedLabel = GmailApp.getUserLabelByName(autoArchivedLabelName) ?? GmailApp.createLabel(autoArchivedLabelName);

    // Modification counter
    let removedThreadCount = 0;
    let removedEmailCount = 0;
    let archivedThreadCount = 0;
    let archivedEmailCount = 0;

    // Current datetime for comparison
    const currentDate = new Date();

    // Logs
    const logs: string[] = [];

    /**
     * Check if a thread is archivable and/or removable
     * 
     * @async
     * @param {GoogleAppsScript.Gmail.GmailThread} thread - Thread object
     * @param {GoogleAppsScript.Gmail.GmailMessage[]} emails - List of emails in the thread, passed because `.getMessages()` is quite expensive
     * @param {GoogleAppsScript.Gmail.GmailLabel} autoArchivedLabel - Archive label object, to check whether the thread is archived already
     * @param {Date} currentDate - Script run time, for checking threads that are too old
     * @returns {boolean} - Whether the thread is archivable
     * @returns {boolean} - Whether the thread is removable
     */
    async function checkThread(thread: GoogleAppsScript.Gmail.GmailThread, emails: GoogleAppsScript.Gmail.GmailMessage[]): Promise<[boolean, boolean]> {
        let archivable = true;
        let removable = true;

        // Already archived
        if (thread.getLabels().includes(autoArchivedLabel)) {
            archivable = false;
        }

        /**
         * Check whether the thread has an email that's send by the user
         * 
         * @async
         * @returns {boolean} - Whether the thread is archivable by this test
         * @returns {boolean} - Whether the thread is removable by this test
         */
        async function checkThreadHasUser(): Promise<[boolean, boolean]> {
            if (touchMyThreadsArchive && touchMyThreadsRemove) return [true, true];

            for (const email of emails) {
                if (getFromAddress(email) === currentUserEmail) {
                    return [touchMyThreadsArchive, touchMyThreadsRemove];
                }
            }

            return [true, true];
        }

        /**
         * Check whether the thread has old email
         *
         * @async
         * @returns {boolean} - Whether the thread is archivable by this test
         * @returns {boolean} - Whether the thread is removable by this test
         */
        async function checkThreadOldStrict(): Promise<[boolean, boolean]> {
            let allOldThread = true;
            let anyOldThread = false;
            for (const email of emails) {
                if (dayDiff(email.getDate(), currentDate) <= oldThreadsDateDiffLimit) {
                    allOldThread = false;
                } else {
                    anyOldThread = true;
                }
                // Both conditions reached
                if (!allOldThread && anyOldThread) break;
            }

            return [oldThreadsArchiveStrict ? !anyOldThread : !allOldThread, oldThreadsRemoveStrict ? !anyOldThread : !allOldThread]
        }

        const testResults = await Promise.all([checkThreadHasUser(), checkThreadOldStrict()]);

        for (const [archivableTest, removableTest] of testResults) {
            archivable &&= archivableTest;
            removable &&= removableTest;
        }

        return [archivable, removable];
    }

    /**
     * Check if thread should be archived. If so, archive it
     * 
     * @param {GoogleAppsScript.Gmail.GmailThread} thread - Thread object
     * @param {GoogleAppsScript.Gmail.GmailMessage[]} emails - List of emails in the thread, passed because `.getMessages()` is quite expensive
     */
    function threadCheckArchive(thread: GoogleAppsScript.Gmail.GmailThread, emails: GoogleAppsScript.Gmail.GmailMessage[]): number {
        // Ignore threads in trash
        if (thread.isInTrash()) return 0;

        const badFroms: [string, number][] = [];

        let shouldBeArchived = false;
        for (const email of emails) {
            // Ignore starred and in-trash emails
            if (email.isStarred() || email.isInTrash()) return 0;

            // Check if thread should be archived; that is, whether the sender has a corresponding rule and the email is out of date
            const from = getFromAddress(email);
            if (archiveRules.hasOwnProperty(from)) {
                const diff = dayDiff(email.getDate(), currentDate);
                if (diff >= archiveRules[from]) {
                    badFroms.push([from, diff]);
                    shouldBeArchived = true;
                }
            }
            // When strict mode and sender not in rules, exit immediately
            else if (threadArchiveStrict && !removalRules.hasOwnProperty(from)) {
                return 0;
            }
        }

        if (shouldBeArchived) {
            thread.addLabel(autoArchivedLabel);
            thread.moveToArchive();
            logs.push(`Thread "${thread.getFirstMessageSubject()}" archived (${badFroms})`)
            return thread.getMessageCount();
        }
    }

    /**
     * Check if each email in thread should be deleted. If so, delete it
     *
     * @param {GoogleAppsScript.Gmail.GmailThread} thread - Thread object
     * @param {GoogleAppsScript.Gmail.GmailMessage[]} emails - List of emails in the thread, passed because `.getMessages()` is quite expensive
     */
    function threadCheckRemove(thread: GoogleAppsScript.Gmail.GmailThread, emails: GoogleAppsScript.Gmail.GmailMessage[]): number {
        // Ignore threads in trash
        if (thread.isInTrash()) return 0;

        if (threadRemoveStrict) {
            const badFroms: [string, number][] = [];

            for (const email of emails) {
                // Ignore starred and in-trash emails
                if (email.isStarred() || email.isInTrash()) return 0;

                // Check if thread should be deleted; that is, whether all the sender has a corresponding rule and the emails are out of date
                // If one of the emails do not need to be deleted, exit immediately due to strict
                const from = getFromAddress(email);
                if (!removalRules.hasOwnProperty(from)) return 0;
                const diff = dayDiff(email.getDate(), currentDate);
                if (diff < removalRules[from]) return 0;

                badFroms.push([from, diff]);
            }

            thread.addLabel(autoRemovedLabel);
            thread.moveToTrash();
            logs.push(`Thread "${thread.getFirstMessageSubject()}" removed (${badFroms})`)
            return thread.getMessageCount();
        } else {
            let removedCount = 0;

            for (const email of emails) {
                // Ignore starred and in-trash emails
                if (email.isStarred() || email.isInTrash()) return 0;

                // Check if email should be deleted; that is, whether its the sender has a corresponding rule and the email is out of date
                const from = getFromAddress(email);
                if (removalRules.hasOwnProperty(from)) {
                    const diff = dayDiff(email.getDate(), currentDate);
                    if (diff >= removalRules[from]) {
                        removedCount++;
                        email.moveToTrash();
                        logs.push(`Email "${email.getSubject()}" removed ${[from, diff]}`);
                    }
                }
            }

            if (removedCount) {
                thread.addLabel(autoRemovedLabel);
            }
            return removedCount;
        }
    }

    for (const thread of GmailApp.getInboxThreads()) {
        // Ignore important threads
        if (thread.isImportant()) continue;

        const emails = thread.getMessages();

        const [archivable, removable] = await checkThread(thread, emails);

        if (archivable) {
            const count = threadCheckArchive(thread, emails);
            if (count) {
                archivedThreadCount++;
                archivedEmailCount += count;
            }
        }
        if (removable) {
            const count = threadCheckRemove(thread, emails);
            if (count) {
                removedThreadCount++;
                removedEmailCount += count;
            }
        }
    }

    Logger.log(`Archived ${archivedEmailCount} emails from ${archivedThreadCount} threads\nRemoved ${removedEmailCount} emails from ${removedThreadCount} threads`);

    for (const log of logs) {
        Logger.log(log);
    }
}
