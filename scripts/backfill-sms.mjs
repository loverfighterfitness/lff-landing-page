/**
 * One-off backfill script: creates missing SMS #2 and #3 jobs for leads
 * who never received them due to the old setTimeout bug.
 * Run with: node scripts/backfill-sms.mjs
 */
import "dotenv/config";
import mysql from "mysql2/promise";

const conn = await mysql.createConnection(process.env.DATABASE_URL);

// Get all leads
const [leads] = await conn.execute(
  "SELECT id, name, phone, goal, tdee, protein, carbs, fats, sms1SentAt, sms2SentAt, sms3SentAt FROM calculator_leads ORDER BY createdAt ASC"
);

console.log(`Found ${leads.length} leads`);

// Check existing pending/sent jobs to avoid duplicates
const [existingJobs] = await conn.execute(
  "SELECT leadId, smsNumber, status FROM sms_jobs"
);

const existingSet = new Set(
  existingJobs.map((j) => `${j.leadId}-${j.smsNumber}`)
);

function formatSMS2(name) {
  return `${name}, Ruby went from 0 to comp-ready in 12 weeks 💪 She used personalized macros + my coaching. Want to know her secret? Reply CALL or visit www.loverfighterfitness.com`;
}

function formatSMS3(name) {
  return `Ready to transform your body? I have limited spots for personalized coaching this month. Let's chat about your goals. Book your free consultation: www.loverfighterfitness.com`;
}

let inserted = 0;
const now = new Date();

for (const lead of leads) {
  // Skip test leads
  if (lead.phone === "+61412345678" || lead.name === "Test User") {
    console.log(`Skipping test lead: ${lead.name}`);
    continue;
  }

  // SMS #2 — only if not already sent and no job exists
  if (!lead.sms2SentAt && !existingSet.has(`${lead.id}-2`)) {
    const message = formatSMS2(lead.name);
    await conn.execute(
      "INSERT INTO sms_jobs (leadId, phone, message, smsNumber, sendAt, status, createdAt) VALUES (?, ?, ?, ?, ?, 'pending', ?)",
      [lead.id, lead.phone, message, 2, now, now]
    );
    console.log(`✅ Queued SMS #2 for ${lead.name} (${lead.phone})`);
    inserted++;
  } else if (lead.sms2SentAt) {
    console.log(`⏭  SMS #2 already sent to ${lead.name}`);
  } else {
    console.log(`⏭  SMS #2 job already exists for ${lead.name}`);
  }

  // SMS #3 — only if not already sent and no job exists
  if (!lead.sms3SentAt && !existingSet.has(`${lead.id}-3`)) {
    const message = formatSMS3(lead.name);
    // Schedule SMS #3 5 minutes after SMS #2 to avoid spam
    const sendAt = new Date(now.getTime() + 5 * 60 * 1000);
    await conn.execute(
      "INSERT INTO sms_jobs (leadId, phone, message, smsNumber, sendAt, status, createdAt) VALUES (?, ?, ?, ?, ?, 'pending', ?)",
      [lead.id, lead.phone, message, 3, sendAt, now]
    );
    console.log(`✅ Queued SMS #3 for ${lead.name} (${lead.phone}) — sends in 5 min`);
    inserted++;
  } else if (lead.sms3SentAt) {
    console.log(`⏭  SMS #3 already sent to ${lead.name}`);
  } else {
    console.log(`⏭  SMS #3 job already exists for ${lead.name}`);
  }
}

await conn.end();
console.log(`\nDone. Inserted ${inserted} new SMS jobs.`);
