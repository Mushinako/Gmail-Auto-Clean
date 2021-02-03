// Url of the sheet
const sheetUrl = "https://docs.google.com/spreadsheets/d/14dva-9d6e6Iiut_JGd-SVL_8druhAMerQXEqRqb1Iuk/edit?usp=sharing";
// Sheet names for each removal and archiving
const removalSheetName = "Removal";
const archiveSheetName = "Archive";

// If `true`, the script archives a thread if all email in the thread are in the archive/removal rules
// If `false`, the script archives a thread if any email in the thread is in the archive rule
const threadArchiveStrict = true;
// If `true`, the script won't remove emails from a thread if any email in the thread is not in the removal rules
// If `false`, the script checks and remove each email in the thread independently
const threadRemoveStrict = true;

// Whether the threads in which the user participates will be archived
const touchMyThreadsArchive = true;
// Whether any email in the threads in which the user participates will be deleted
const touchMyThreadsRemove = false;

// Whether the old threads will be touched
//   E.g., `365` means only touch threads <= 365 days old
//   Use `Infinity` to indicate no limit
const oldThreadsDateDiffLimit = Infinity;
// If `true`, the script won't archive a thread if any email in the thread is out of time range
// If `false`, the script won't archive a thread if all email in the thread is out of time range
const oldThreadsArchiveStrict = false;
// If `true`, the script won't delete an email if any email in the same thread is out of time range
// If `false`, the script only checks whether the email is within the time range and doesn't consult time of other emails in the same thread
const oldThreadsRemoveStrict = false;

// Gmail thread read limit
const threadLimit = 500;
// Gmail runtime limit in seconds
const timeLimit = 360;
// Which thread to start from. Useful when runtime limit is reached to continue from preiously stopped thread
const start = 0;
