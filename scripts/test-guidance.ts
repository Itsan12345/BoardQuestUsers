import 'dotenv/config';
import clientPromise from '../src/lib/mongodb-client';
import { ObjectId } from 'mongodb';

async function test() {
  const client = await clientPromise;
  const db = client.db();
  const guidances = await db.collection('GuidanceAssignment').find({}).toArray();
  console.log('Guidances count:', guidances.length);

  for (const g of guidances) {
    const sObjId = ObjectId.isValid(g.studentId) ? new ObjectId(g.studentId) : null;
    const aObjId = ObjectId.isValid(g.advisorId) ? new ObjectId(g.advisorId) : null;

    const student = await db.collection('User').findOne({
      $or: [
        { _id: g.studentId },
        ...(sObjId ? [{ _id: sObjId }] : [])
      ]
    });

    const advisor = await db.collection('AdminUser').findOne({
      $or: [
        { _id: g.advisorId },
        ...(aObjId ? [{ _id: aObjId }] : [])
      ]
    });

    console.log('--- Guidance:', g._id.toString(), '---');
    console.log('Student ID in doc:', g.studentId, '-> found:', student?.name, 'email:', student?.email);
    console.log('Advisor ID in doc:', g.advisorId, '-> found:', advisor?.name, 'email:', advisor?.email, 'role:', advisor?.role);
    console.log('Subject:', g.subjectCategory);
    console.log('Status:', g.status);
    console.log('Reason:', g.reason);
    console.log('Guidance Notes:', g.guidanceNotes);
    console.log('Created At:', g.createdAt);
  }
}

test().then(() => process.exit(0)).catch(console.error);
