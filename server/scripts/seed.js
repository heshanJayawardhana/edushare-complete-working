require('dotenv').config();
const { connectDatabase } = require('../utils/db');
const User = require('../models/User');
const Resource = require('../models/Resource');
const Rating = require('../models/Rating');
const Comment = require('../models/Comment');
const Inquiry = require('../models/Inquiry');
const Notification = require('../models/Notification');
const Order = require('../models/Order');
const Connection = require('../models/Connection');

async function seed() {
  await connectDatabase();

  await Promise.all([
    User.deleteMany({}),
    Resource.deleteMany({}),
    Rating.deleteMany({}),
    Comment.deleteMany({}),
    Inquiry.deleteMany({}),
    Notification.deleteMany({}),
    Order.deleteMany({}),
    Connection.deleteMany({})
  ]);

  const admin = await User.create({
    name: 'EduShare Admin',
    email: 'admin@edushare.com',
    password: 'Admin123',
    role: 'admin',
    badge: 'Gold'
  });

  const studentA = await User.create({
    name: 'Nimali Perera',
    email: 'nimali@example.com',
    password: 'Student123',
    role: 'student'
  });

  const studentB = await User.create({
    name: 'Kasun Silva',
    email: 'kasun@example.com',
    password: 'Student123',
    role: 'student'
  });

  const resources = await Resource.insertMany([
    {
      title: 'Database Systems Revision Notes',
      description: 'Clean summary notes covering ER diagrams, normalization, SQL joins, and transactions.',
      fileUrl: 'https://example.com/files/db-revision-notes.pdf',
      fileName: 'db-revision-notes.pdf',
      fileSize: 420000,
      fileType: 'pdf',
      category: 'Computer Science',
      faculty: 'Science',
      academicYear: '2024',
      price: 0,
      tags: ['database', 'sql', 'revision'],
      uploaderId: studentA._id,
      downloads: 8
    },
    {
      title: 'Network Design Assignment Guide',
      description: 'Step-by-step guide for subnetting, VLAN design, routing, and switch configuration.',
      fileUrl: 'https://example.com/files/network-assignment-guide.pdf',
      fileName: 'network-assignment-guide.pdf',
      fileSize: 610000,
      fileType: 'pdf',
      category: 'Engineering',
      faculty: 'Engineering',
      academicYear: '2024',
      price: 750,
      tags: ['network', 'assignment', 'routing'],
      uploaderId: studentB._id,
      downloads: 3
    },
    {
      title: 'Project Management Presentation',
      description: 'Slides for WBS, Gantt charts, risk matrices, and stakeholder communication planning.',
      fileUrl: 'https://example.com/files/project-management-presentation.pptx',
      fileName: 'project-management-presentation.pptx',
      fileSize: 980000,
      fileType: 'pptx',
      category: 'Business',
      faculty: 'Business',
      academicYear: '2025',
      price: 500,
      tags: ['project', 'management', 'presentation'],
      uploaderId: admin._id,
      downloads: 2
    }
  ]);

  studentA.uploadCount = 1;
  studentA.updateBadge();
  studentB.uploadCount = 1;
  studentB.updateBadge();
  admin.uploadCount = 1;
  admin.updateBadge();
  await Promise.all([studentA.save(), studentB.save(), admin.save()]);

  await Rating.create([
    { resourceId: resources[0]._id, userId: studentB._id, rating: 5 },
    { resourceId: resources[1]._id, userId: studentA._id, rating: 4 }
  ]);

  await Comment.create([
    { resourceId: resources[0]._id, userId: studentB._id, content: 'Very useful for last-minute revision.' },
    { resourceId: resources[1]._id, userId: studentA._id, content: 'Good explanation of subnetting and routing.' }
  ]);

  await Inquiry.create({
    resourceId: resources[1]._id,
    userId: studentA._id,
    name: studentA.name,
    email: studentA.email,
    subject: 'Does this include Cisco Packet Tracer files?',
    message: 'I need the topology file as well. Is it included?',
    status: 'Pending'
  });

  console.log('✅ Seed complete');
  console.log('Admin login: admin@edushare.com / Admin123');
  console.log('Student login: nimali@example.com / Student123');
  process.exit(0);
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
