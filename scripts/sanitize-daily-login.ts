import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function main() {
  const { default: clientPromise } = await import('../src/lib/mongodb-client');
  const client = await clientPromise;
  const db = client.db();

  console.log('Sanitizing DailyLogin collection...');

  const result = await db.collection('DailyLogin').updateMany(
    {},
    {
      $unset: {
        studentId: '',
        userName: '',
        userEmail: '',
        date: '',
        timestamp: '',
        firstLoginAt: '',
        loginStreak: '',
        rewardClaimed: '',
        loginMethod: '',
        deviceInfo: '',
        status: '',
        flaggedByAdmin: '',
        flagReason: '',
        cycleDay: '',
        claimedAt: '',
      },
    }
  );

  console.log(`Successfully sanitized ${result.modifiedCount} DailyLogin documents.`);
  const docs = await db.collection('DailyLogin').find({}).toArray();
  console.log('Current clean sample document:');
  console.log(JSON.stringify(docs[0], null, 2));
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
