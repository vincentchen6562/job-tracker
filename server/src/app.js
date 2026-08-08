import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { env } from './config/env.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';

import authRoutes from './routes/auth.routes.js';
import householdRoutes from './routes/household.routes.js';
import billsRoutes from './routes/bills.routes.js';
import goalsRoutes from './routes/goals.routes.js';
import simulateRoutes from './routes/simulate.routes.js';
import aiRoutes from './routes/ai.routes.js';
import reportsRoutes from './routes/reports.routes.js';
import transactionsRoutes from './routes/transactions.routes.js';

const app = express();

app.use(cors({ origin: env.clientOrigin }));
app.use(express.json());

const MONGO_STATES = ['disconnected', 'connected', 'connecting', 'disconnecting'];
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', mongo: MONGO_STATES[mongoose.connection.readyState] });
});

app.use('/api/auth', authRoutes);
app.use('/api/household', householdRoutes);
app.use('/api/bills', billsRoutes);
app.use('/api/goals', goalsRoutes);
app.use('/api/simulate', simulateRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/transactions', transactionsRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
