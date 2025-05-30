import express, { Application, Request, Response } from 'express';
import dotenv from 'dotenv';
import { connectDB } from './config/database';
import identityRoutes from './routes/identityRoutes';

dotenv.config();

const app: Application = express();


app.use(express.json());
app.use(express.urlencoded({ extended: true }));


connectDB();


app.get('/', (req: Request, res: Response) => {
  res.send('Bitespeed Identity Reconciliation Service is running!');
});
app.use('/api', identityRoutes); 




export default app;