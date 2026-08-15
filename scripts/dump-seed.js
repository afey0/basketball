const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function run() {
  console.log('Reading local database...');
  const clubs = await prisma.club.findMany();
  const settings = await prisma.clubSettings.findMany();
  const users = await prisma.user.findMany();
  const groups = await prisma.trainingGroup.findMany();
  const plans = await prisma.paymentPlan.findMany();
  const schedules = await prisma.schedule.findMany();
  const students = await prisma.student.findMany();
  const payments = await prisma.payment.findMany();
  const attendances = await prisma.attendance.findMany();

  let sql = 'PRAGMA defer_foreign_keys = ON;\n';

  function escapeVal(v) {
    if (v === null || v === undefined) return 'NULL';
    if (typeof v === 'string') return `'${v.replaceAll("'", "''")}'`;
    if (v instanceof Date) return `'${v.toISOString()}'`;
    if (typeof v === 'boolean') return v ? '1' : '0';
    return String(v);
  }

  function makeInsert(table, rows) {
    if (!rows.length) return '';
    const keys = Object.keys(rows[0]);
    let query = '';
    rows.forEach(row => {
      const vals = keys.map(k => escapeVal(row[k])).join(', ');
      query += `INSERT INTO "${table}" (${keys.map(k => `"${k}"`).join(', ')}) VALUES (${vals});\n`;
    });
    return query;
  }

  sql += makeInsert('Club', clubs);
  sql += makeInsert('ClubSettings', settings);
  sql += makeInsert('User', users);
  sql += makeInsert('TrainingGroup', groups);
  sql += makeInsert('PaymentPlan', plans);
  sql += makeInsert('Schedule', schedules);
  sql += makeInsert('Student', students);
  sql += makeInsert('Payment', payments);
  sql += makeInsert('Attendance', attendances);

  fs.writeFileSync('prisma/seed.sql', sql);
  console.log('✅ Generated prisma/seed.sql successfully!');
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
