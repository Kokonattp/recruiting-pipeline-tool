import { makeStubSource } from "./_stub.js";

/**
 * JOBBKK — stubbed.
 *
 * JobBKK's resume/candidate search ("ค้นหาผู้สมัคร") is behind an employer login;
 * only the job-board side is public. To keep this service login-free and avoid
 * fragile auth, JobBKK is stubbed for now. Returns [] and logs. (A future
 * version could scrape the public job board like JobsDB/JobThai do.)
 */
export const jobbkkSource = makeStubSource(
  "JOBBKK",
  "candidate search requires employer login"
);
