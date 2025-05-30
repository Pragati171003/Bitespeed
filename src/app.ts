import express, { Application, Request, Response } from 'express';
import dotenv from 'dotenv';
import { connectDB } from './config/database';
import identityRoutes from './routes/identityRoutes';
//import { errorHandler } from './utils/errorHandler';

dotenv.config();

const app: Application = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection
connectDB();

// Routes
app.get('/', (req: Request, res: Response) => {
  res.send('Bitespeed Identity Reconciliation Service is running!');
});
app.use('/api', identityRoutes); // Prefixing with /api might be good practice

// Global error handler - should be last middleware
//app.use(errorHandler);


export default app;