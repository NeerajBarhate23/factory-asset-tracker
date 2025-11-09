import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Hash password
  const hashedPassword = await bcrypt.hash('password123', 10);

  // Create Admin User
  const admin = await prisma.user.upsert({
    where: { email: 'admin@factory.com' },
    update: {},
    create: {
      email: 'admin@factory.com',
      password: hashedPassword,
      name: 'System Administrator',
      role: 'ADMIN',
      department: 'IT & Administration',
    },
  });

  console.log('✅ Admin user created:', admin.email);

  // Create Shop Incharge
  const shopIncharge = await prisma.user.upsert({
    where: { email: 'shop@factory.com' },
    update: {},
    create: {
      email: 'shop@factory.com',
      password: hashedPassword,
      name: 'Shop Supervisor',
      role: 'SHOP_INCHARGE',
      department: 'Production',
    },
  });

  console.log('✅ Shop Incharge created:', shopIncharge.email);

  // Create Maintenance User
  const maintenance = await prisma.user.upsert({
    where: { email: 'maintenance@factory.com' },
    update: {},
    create: {
      email: 'maintenance@factory.com',
      password: hashedPassword,
      name: 'Maintenance Lead',
      role: 'MAINTENANCE',
      department: 'Maintenance',
    },
  });

  console.log('✅ Maintenance user created:', maintenance.email);

  // Create Operator
  const operator = await prisma.user.upsert({
    where: { email: 'operator@factory.com' },
    update: {},
    create: {
      email: 'operator@factory.com',
      password: hashedPassword,
      name: 'Machine Operator',
      role: 'OPERATOR',
      department: 'Production',
    },
  });

  console.log('✅ Operator user created:', operator.email);

  // Create sample assets
  const asset1 = await prisma.asset.create({
    data: {
      assetUid: 'SPM-001',
      name: 'Drilling SPM Unit A1',
      category: 'TOOL_ROOM_SPM',
      status: 'ACTIVE',
      location: 'Tool Room - Bay 1',
      criticality: 'HIGH',
      ownerDepartment: 'Tool Room',
      make: 'Makino',
      model: 'V55',
      serialNumber: 'MKN-2023-001',
      purchaseDate: new Date('2023-01-15'),
      warrantyExpiry: new Date('2026-01-15'),
      createdById: admin.id,
    },
  });

  const asset2 = await prisma.asset.create({
    data: {
      assetUid: 'CNC-001',
      name: 'CNC Milling Machine',
      category: 'CNC_MACHINE',
      status: 'ACTIVE',
      location: 'Production Floor - Section A',
      criticality: 'HIGH',
      ownerDepartment: 'Production',
      make: 'Haas',
      model: 'VF-2SS',
      serialNumber: 'HAAS-2022-045',
      purchaseDate: new Date('2022-06-20'),
      warrantyExpiry: new Date('2025-06-20'),
      assignedToId: operator.id,
      createdById: shopIncharge.id,
    },
  });

  const asset3 = await prisma.asset.create({
    data: {
      assetUid: 'WS-001',
      name: 'Assembly Workstation 1',
      category: 'WORKSTATION',
      status: 'ACTIVE',
      location: 'Assembly Line 1',
      criticality: 'MEDIUM',
      ownerDepartment: 'Assembly',
      make: 'Custom',
      model: 'WS-STD-01',
      serialNumber: 'WS-2023-001',
      createdById: shopIncharge.id,
    },
  });

  const asset4 = await prisma.asset.create({
    data: {
      assetUid: 'MH-001',
      name: 'Forklift Toyota 3T',
      category: 'MATERIAL_HANDLING',
      status: 'ACTIVE',
      location: 'Warehouse Zone A',
      criticality: 'MEDIUM',
      ownerDepartment: 'Logistics',
      make: 'Toyota',
      model: '8FG30',
      serialNumber: 'TY-2021-089',
      purchaseDate: new Date('2021-03-10'),
      createdById: admin.id,
    },
  });

  console.log('✅ Sample assets created:', [asset1.assetUid, asset2.assetUid, asset3.assetUid, asset4.assetUid]);

  // Create sample movement
  const movement = await prisma.movement.create({
    data: {
      assetId: asset2.id,
      fromLocation: 'Production Floor - Section A',
      toLocation: 'Production Floor - Section B',
      status: 'PENDING',
      reason: 'Relocating for new production line setup',
      slaHours: 24,
      requestedById: operator.id,
    },
  });

  console.log('✅ Sample movement created:', movement.id);

  // Create sample audit
  const audit = await prisma.audit.create({
    data: {
      location: 'Production Floor',
      category: 'CNC_MACHINE',
      scheduledDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      status: 'SCHEDULED',
      totalAssets: 5,
      auditorId: maintenance.id,
    },
  });

  console.log('✅ Sample audit created:', audit.id);

  // Create activity logs
  await prisma.activity.create({
    data: {
      userId: admin.id,
      action: 'SYSTEM_INITIALIZED',
      entityType: 'SYSTEM',
      details: 'Factory Asset Tracking System initialized with sample data',
    },
  });

  console.log('✅ Activity log created');

  console.log('\n🎉 Seeding completed successfully!');
  console.log('\n📧 Test User Credentials (all use password: password123):');
  console.log('   Admin: admin@factory.com');
  console.log('   Shop Incharge: shop@factory.com');
  console.log('   Maintenance: maintenance@factory.com');
  console.log('   Operator: operator@factory.com');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
