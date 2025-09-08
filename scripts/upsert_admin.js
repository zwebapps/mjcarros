const { PrismaClient, Role } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL || 'admin@mjcarros.com';
  const name = process.env.ADMIN_NAME || 'Administrator';
  const password = process.env.ADMIN_PASSWORD || 'Admin@12345';

  const passwordHash = await bcrypt.hash(password, 10);

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    const updated = await prisma.user.update({
      where: { email },
      data: { name, role: Role.ADMIN, password: passwordHash },
    });
    console.log(JSON.stringify({ status: 'updated', id: updated.id, email: updated.email, role: updated.role }, null, 2));
  } else {
    const created = await prisma.user.create({
      data: { email, name, role: Role.ADMIN, password: passwordHash },
    });
    console.log(JSON.stringify({ status: 'created', id: created.id, email: created.email, role: created.role }, null, 2));
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });


