require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
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

    // Prepare documents with _id matching seed IDs
    const usersToInsert = initialUsers.map((u) => ({ ...u, _id: u.id }));
    const projectsToInsert = initialProjects.map((p) => ({ ...p, _id: p.id }));
    const tasksToInsert = initialTasks.map((t) => ({ ...t, _id: t.id }));
    const activitiesToInsert = initialActivityLogs.map((a) => ({ ...a, _id: a.id }));

    // Insert records
    const insertedUsers = await User.insertMany(usersToInsert);
    const insertedProjects = await Project.insertMany(projectsToInsert);
    const insertedTasks = await Task.insertMany(tasksToInsert);
    const insertedActivities = await Activity.insertMany(activitiesToInsert);

    console.log(`✅ Seeded ${insertedUsers.length} Users.`);
    console.log(`✅ Seeded ${insertedProjects.length} Projects.`);
    console.log(`✅ Seeded ${insertedTasks.length} Tasks.`);
    console.log(`✅ Seeded ${insertedActivities.length} Activity Logs.`);
    console.log('🎉 Database seeding completed successfully!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seed();
