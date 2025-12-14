import { connectDB, closeDB } from './src/config/db.js';

(async () => {
  await connectDB();
  await closeDB();
})();
