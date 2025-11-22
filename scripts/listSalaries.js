const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');

async function main(){
  console.log('Script starting, loading MONGODB_URI...');
  const uri = process.env.MONGODB_URI;
  console.log('MONGODB_URI present:', !!uri);
  if(!uri){
    console.error('MONGODB_URI not set');
    process.exit(1);
  }
  try{
    mongoose.set('strictQuery', false);
    await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to MongoDB');
    const Salary = mongoose.connection.collection('salaries');

    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth()+1, 0,23,59,59,999);

    const currentMonth = await Salary.find({ date: { $gte: firstDay, $lte: lastDay } }).toArray();
    console.log('=== Salaries (current month) ===');
    console.log(JSON.stringify(currentMonth, null, 2));

    const all = await Salary.find({}).sort({ date: -1 }).limit(100).toArray();
    console.log('=== Salaries (recent 100) ===');
    console.log(JSON.stringify(all, null, 2));

    await mongoose.disconnect();
  }catch(err){
    console.error('Error', err);
    process.exit(1);
  }
}

main();
