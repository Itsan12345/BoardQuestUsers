import 'dotenv/config';
import clientPromise from '../src/lib/mongodb-client';
import { ObjectId } from 'mongodb';
import { buildGuidanceNotifications } from '../src/lib/notifications';

async function testGuidanceFlow() {
  const client = await clientPromise;
  const db = client.db();

  console.log('--- Testing Guidance Notification Flow ---');

  // 1. Fetch all guidances
  const assignments = await db.collection('GuidanceAssignment').find({}).toArray();
  console.log(`Found ${assignments.length} guidance records in MongoDB.`);

  for (const doc of assignments) {
    const advisorDoc = await db.collection('AdminUser').findOne({
      $or: [
        { _id: doc.advisorId },
        ...(ObjectId.isValid(String(doc.advisorId)) ? [{ _id: new ObjectId(String(doc.advisorId)) }] : [])
      ]
    });

    const formatted = {
      id: doc._id.toString(),
      studentId: doc.studentId?.toString(),
      advisorId: doc.advisorId?.toString(),
      status: doc.status || 'IN_PROGRESS',
      subjectCategory: doc.subjectCategory,
      reason: doc.reason,
      guidanceNotes: doc.guidanceNotes,
      createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : new Date().toISOString(),
      advisor: {
        id: doc.advisorId?.toString(),
        name: advisorDoc?.name || 'Faculty Academic Advisor',
        email: advisorDoc?.email || '',
        role: advisorDoc?.role || 'TEACHER'
      }
    };

    console.log('\nEnriched Guidance Record:');
    console.log({
      id: formatted.id,
      status: formatted.status,
      subject: formatted.subjectCategory,
      advisorName: formatted.advisor.name,
      advisorRole: formatted.advisor.role,
      advisorEmail: formatted.advisor.email,
      reason: formatted.reason,
      notes: formatted.guidanceNotes
    });

    // 2. Test notification generation
    const notifs = buildGuidanceNotifications([formatted]);
    console.log('Generated Notification Object:', JSON.stringify(notifs, null, 2));
  }

  console.log('\n✅ All tests completed successfully.');
}

testGuidanceFlow().then(() => process.exit(0)).catch(console.error);
