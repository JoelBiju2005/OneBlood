const { MongoMemoryServer } = require('mongodb-memory-server');

async function start() {
  console.log('⏳ Downloading/Starting MongoDB Memory Server on 127.0.0.1:27017...');
  const mongod = await MongoMemoryServer.create({
    instance: {
      port: 27017,
      dbName: 'oneblood',
      ip: '127.0.0.1'
    }
  });

  const uri = mongod.getUri();
  console.log(`🟢 MongoDB Memory Server started successfully at: ${uri}`);
  console.log('Keep this process running to keep the database alive.');

  // Handle termination
  process.on('SIGINT', async () => {
    console.log('Stopping MongoDB Memory Server...');
    await mongod.stop();
    process.exit(0);
  });
  
  process.on('SIGTERM', async () => {
    console.log('Stopping MongoDB Memory Server...');
    await mongod.stop();
    process.exit(0);
  });
}

start().catch(err => {
  console.error('Failed to start MongoDB Memory Server:', err);
  process.exit(1);
});
