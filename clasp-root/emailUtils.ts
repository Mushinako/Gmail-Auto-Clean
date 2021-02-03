const currentUserEmail = Session.getEffectiveUser().getEmail();

/**
 * Get the email address of the sender
 * 
 * @param {GoogleAppsScript.Gmail.GmailMessage} email - Email object to be parsed
 * @returns {string} - Sender email address
 */
function getFromAddress(email: GoogleAppsScript.Gmail.GmailMessage): string {
    return email.getFrom().replace(/^.+<([^<>]+)>.*$/, "$1");
}

/**
 * Whether a thread has a specific label name
 * 
 * @param {GoogleAppsScript.Gmail.GmailThread} thread - The thread of emails
 * @param {GoogleAppsScript.Gmail.GmailLabel} label - The label to be checked
 * @returns {boolean}: Whether the label is present
 */
function hasLabel(thread: GoogleAppsScript.Gmail.GmailThread, label: GoogleAppsScript.Gmail.GmailLabel): boolean {
    return thread.getLabels().includes(label);
}
