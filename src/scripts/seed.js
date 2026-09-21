require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/database');
const User = require('../models/User');
const Project = require('../models/Project');
const Task = require('../models/Task');
const Activity = require('../models/Activity');
const {
  initialUsers,
  initialProjects,
  initialTasks,
  initialActivityLogs,
} = require('../data/seedData');

async function seed() {
  console.log('🌱 Starting MongoDB database seeding...');
  await connectDB();

  try {
    // Clear existing collections
    await User.deleteMany({});
    await Project.deleteMany({});
    await Task.deleteMany({});
    await Activity.deleteMany({});
    console.log('🧹 Cleared existing database collections.');

    // 1. Insert Users with passwordHash
    const bcrypt = require('bcryptjs');
    const defaultPasswordHash = await bcrypt.hash('Password123!', 10);
    const usersToInsert = initialUsers.map((u) => ({
      ...u,
      passwordHash: defaultPasswordHash,
    }));
    const insertedUsers = await User.insertMany(usersToInsert);

    // 2. Insert Projects with ownerId assigned to primary seed user
    const primaryUserId = insertedUsers[0] ? insertedUsers[0]._id : null;
    const projectsToInsert = initialProjects.map((p) => ({
      ...p,
      ownerId: primaryUserId,
    }));
    const insertedProjects = await Project.insertMany(projectsToInsert);

    // Map public string id (e.g. 'proj-1') to Mongoose _id (ObjectId)
    const projectMap = {};
    for (const proj of insertedProjects) {
      projectMap[proj.id] = proj._id;
    }

    // 3. Insert Tasks referencing Project ObjectIds
    const tasksToInsert = initialTasks.map((t) => ({
      ...t,
      projectId: projectMap[t.projectId],
      projectPublicId: t.projectId,
    }));
    const insertedTasks = await Task.insertMany(tasksToInsert);

    // 4. Insert Activity Logs
    const insertedActivities = await Activity.insertMany(initialActivityLogs);

    console.log(`✅ Seeded ${insertedUsers.length} Users.`);
    console.log(`✅ Seeded ${insertedProjects.length} Projects.`);
    console.log(`✅ Seeded ${insertedTasks.length} Tasks.`);
    console.log(`✅ Seeded ${insertedActivities.length} Activity Logs.`);
    console.log('🎉 Database seeding completed successfully!');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seed();
