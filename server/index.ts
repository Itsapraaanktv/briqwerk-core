import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import rephraseRouter from './routes/rephraseRoute';

// Load environment variables
dotenv.config();

const app = express();
const port = process.env['PORT'] || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api', rephraseRouter);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
}); 