import 'reflect-metadata';
import * as mongoose from 'mongoose';
import * as bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI =
  process.env['MONGODB_URI'] || 'mongodb://localhost:27017/attendance_management';

const UserSchema = new mongoose.Schema(
  {
    name: String,
    email: { type: String, unique: true, lowercase: true },
    password: String,
    role: { type: String, enum: ['admin', 'staff'], default: 'staff' },
    department: String,
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

const AttendanceSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    checkInTime: Date,
    checkOutTime: Date,
    status: { type: String, enum: ['present', 'late', 'absent'], default: 'present' },
    date: String,
  },
  { timestamps: true },
);

const NotificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    message: String,
    status: { type: String, enum: ['read', 'unread'], default: 'unread' },
    type: { type: String, default: 'system' },
  },
  { timestamps: true },
);

const UserModel = mongoose.model('User', UserSchema);
const AttendanceModel = mongoose.model('Attendance', AttendanceSchema);
const NotificationModel = mongoose.model('Notification', NotificationSchema);

const departments = ['Engineering', 'Marketing', 'HR', 'Finance', 'Operations'];

async function seed() {
  console.log('🌱 Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI, { dbName: 'attendance_management' });
  console.log('✅ Connected to MongoDB');

  // Clean existing data
  await UserModel.deleteMany({});
  await AttendanceModel.deleteMany({});
  await NotificationModel.deleteMany({});
  console.log('🧹 Cleared existing data');

  // Create admin
  const adminPassword = await bcrypt.hash(process.env['ADMIN_PASSWORD'] || 'Admin@123', 10);
  const admin = await UserModel.create({
    name: 'System Admin',
    email: process.env['ADMIN_EMAIL'] || 'admin@company.com',
    password: adminPassword,
    role: 'admin',
    department: 'Management',
    isActive: true,
  });
  console.log(`👤 Admin created: ${admin.email}`);

  // Create 5 staff members
  const staffData = [
    { name: 'Alice Johnson', email: 'alice@company.com', department: 'Engineering' },
    { name: 'Bob Williams', email: 'bob@company.com', department: 'Marketing' },
    { name: 'Carol Martinez', email: 'carol@company.com', department: 'HR' },
    { name: 'David Lee', email: 'david@company.com', department: 'Finance' },
    { name: 'Eva Brown', email: 'eva@company.com', department: 'Operations' },
  ];

  const staffPassword = await bcrypt.hash('Staff@123', 10);
  const staffMembers = await UserModel.insertMany(
    staffData.map((s) => ({ ...s, password: staffPassword, role: 'staff', isActive: true })),
  );
  console.log(`👥 Created ${staffMembers.length} staff members`);

  // Create attendance records for the past 7 days
  const today = new Date();
  const attendanceRecords: any[] = [];

  for (let dayOffset = 6; dayOffset >= 0; dayOffset--) {
    const date = new Date(today);
    date.setDate(date.getDate() - dayOffset);
    const dateStr = date.toISOString().split('T')[0];

    for (const staff of staffMembers) {
      const checkInHour = Math.random() > 0.3 ? 8 + Math.floor(Math.random() * 2) : 10;
      const checkInMinute = Math.floor(Math.random() * 60);
      const checkIn = new Date(date);
      checkIn.setHours(checkInHour, checkInMinute, 0, 0);

      const checkOut = new Date(checkIn);
      checkOut.setHours(checkInHour + 8, Math.floor(Math.random() * 60), 0, 0);

      const isLate = checkInHour > 9 || (checkInHour === 9 && checkInMinute > 30);
      const status = isLate ? 'late' : 'present';

      attendanceRecords.push({
        userId: staff._id,
        checkInTime: checkIn,
        checkOutTime: checkOut,
        status,
        date: dateStr,
      });
    }
  }

  await AttendanceModel.insertMany(attendanceRecords);
  console.log(`📅 Created ${attendanceRecords.length} attendance records`);

  // Create notifications
  const notificationMessages = [
    'Your attendance for today has been recorded.',
    'Please remember to check out before leaving.',
    'Monthly attendance report is now available.',
    'System maintenance scheduled for this weekend.',
    'Your leave request has been approved.',
    'New company policy update: please review the handbook.',
  ];

  const notifications: any[] = [];
  for (const staff of staffMembers) {
    const count = 2 + Math.floor(Math.random() * 3);
    for (let i = 0; i < count; i++) {
      notifications.push({
        userId: staff._id,
        message: notificationMessages[Math.floor(Math.random() * notificationMessages.length)],
        status: Math.random() > 0.5 ? 'read' : 'unread',
        type: 'system',
      });
    }
  }

  await NotificationModel.insertMany(notifications);
  console.log(`🔔 Created ${notifications.length} notifications`);

  await mongoose.disconnect();

  console.log('\n✅ Seed completed successfully!');
  console.log('─────────────────────────────────────');
  console.log('Admin credentials:');
  console.log(`  Email:    ${process.env['ADMIN_EMAIL'] || 'admin@company.com'}`);
  console.log(`  Password: ${process.env['ADMIN_PASSWORD'] || 'Admin@123'}`);
  console.log('Staff credentials (all same password):');
  console.log('  Password: Staff@123');
  staffData.forEach((s) => console.log(`  Email: ${s.email}`));
  console.log('─────────────────────────────────────');
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
