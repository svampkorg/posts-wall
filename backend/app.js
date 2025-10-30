import express from 'express';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import path, { dirname } from 'path';

import posts from './routes/posts.js';
import user from './routes/user.js';

// import { DB_SERVER, HOST_ADDRESS } from '../venvs.ts';
const DB_SERVER=process.env['DB_SERVER'];
const HOST_ADDRESS=process.env['HOST_ADDRESS']

console.log('CORS requests will be allowed from:', HOST_ADDRESS);

try {
  await mongoose.connect(DB_SERVER);
  console.log('connected to database!');
} catch (error) {
  console.log('Connection failed! ', error);
  process.exit(1);
}

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use('/images', express.static(path.join(dirname(''),'images')));

app.use((req, res, next) => {
  console.log('Inc req from host: ', req.host);
  console.log(' - hostname: ', req.hostname);
  res.setHeader('Access-Control-Allow-Origin', HOST_ADDRESS);
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Origin, X-Request-With, Content-Type, Accept, content-type, Authorization',
  );
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  next();
});

app.use('/api/posts', posts);
app.use('/api/user', user);

export default app;
