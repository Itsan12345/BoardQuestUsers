import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function main() {
  const { default: clientPromise } = await import('../src/lib/mongodb-client');
  const client = await clientPromise;
  const db = client.db();

  const users = await db.collection('User').find({}).toArray();
  const validUserIds = new Set(users.map(u => u._id.toString()));

  const dailyLogins = await db.collection('DailyLogin').find({}).toArray();
  console.log(`Total DailyLogin records before cleanup: ${dailyLogins.length}`);

  let deletedCount = 0;
  for (const record of dailyLogins) {
    const recUserId = record.userId ? record.userId.toString() : '';

    if (!validUserIds.has(recUserId)) {
      console.log(`Deleting orphaned record: ${record._id} for old userId: ${recUserId}`);
      await db.collection('DailyLogin').deleteOne({ _id: record._id });
      deletedCount++;
    }
  }

  console.log(`Successfully deleted ${deletedCount} orphaned DailyLogin records.`);
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
