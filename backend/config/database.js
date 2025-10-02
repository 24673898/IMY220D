const { MongoClient } = require('mongodb');

// connection string
const uri = process.env.MONGODB_URI || "mongodb+srv://frankyliu1996_db_user:yXLc2y1ybFbKee7W@imy220projectcluster.w35t9gj.mongodb.net/?retryWrites=true&w=majority&appName=IMY220ProjectCluster" ;

let db;
let client;

async function connectDB() {
    try {
        client = new MongoClient(uri);
        await client.connect();
        db = client.db('imy220_project');
        console.log('✅ Connected to MongoDB Atlas successfully');
        console.log('📊 Database: imy220_project');
        return db;
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        throw error;
    }
}

function getDB() {
    if (!db) {
        throw new Error('Database not initialized. Call connectDB first.');
    }
    return db;
}

async function closeDB() {
    if (client) {
        await client.close();
        console.log('MongoDB connection closed');
    }
}

module.exports = { connectDB, getDB, closeDB };