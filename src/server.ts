import 'reflect-metadata'; //needs this for all typeorm projects

import dotenv from 'dotenv';
import { createConnection } from 'typeorm';
import morgan from 'morgan';
import express from 'express';
import cookieParser from 'cookie-parser';

dotenv.config();
import authRoutes from './routes/auth';
import postRoutes from './routes/posts';
import subRoutes from './routes/subs';
import miscRoutes from './routes/misc';
import userRoutes from './routes/users';

import trim from './middleware/trim';
import cors from 'cors';
const app = express();

app.use(express.json()); // be sure to add esModuleEntrope to true in the tsconfig for this to work

app.use(
  cors({
    credentials: true,
    origin: process.env.ORIGIN,
    optionsSuccessStatus: 200,
  })
); // put this real close to the top
app.use(morgan('dev'));
app.use(trim);
app.use(cookieParser());
app.use(express.static('public'));
//req not used so we can omit it. The types are inferred in this case since we passed them inline. Weird
app.get('/api', (_, res) => res.send('Hello from app'));
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/subs', subRoutes);
app.use('/api/misc', miscRoutes);
app.use('/api/users', userRoutes);

app.listen(process.env.PORT, async () => {
  console.log(`Listening on the following port ${process.env.PORT}`);

  try {
    await createConnection();
    console.log('Database connected');
  } catch (err) {
    console.log(err);
  }
});
