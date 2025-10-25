import mesadaEntryRoutes from './routes/mesadaEntry';
import reportRoutes from './routes/reportRoutes';
import mesadaExpenseRoutes from './routes/mesadaExpense';
import carroEntryRoutes from './routes/carroEntry';
import carroExpenseRoutes from './routes/carroExpense';
import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import config from './config';
import Database from './config/database';

const app: Application = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// Logging middleware
if (config.server.nodeEnv === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Database connection
const database = Database.getInstance();

// Import routes
import userRoutes from './routes/userRoutes';
import salaryRoutes from './routes/salaryRoutes';
import salaryUserRoutes from './routes/salaryUserRoutes';
import expenseRoutes from './routes/expenseRoutes';

import reminderRoutes from './routes/reminderRoutes';
import investmentRoutes from './routes/investmentRoutes';

import investmentEntryRoutes from './routes/investmentEntryRoutes';
import emergencyEntryRoutes from './routes/emergencyEntry';
import emergencyExpenseRoutes from './routes/emergencyExpense';
import viagemEntryRoutes from './routes/viagemEntry';
import viagemExpenseRoutes from './routes/viagemExpense';
import summaryRoutes from './routes/summaryRoutes';
import investmentAnnualReturnRoutes from './routes/investmentAnnualReturnRoutes';

// Routes
app.use('/api/users', userRoutes);
app.use('/api/salary', salaryRoutes);
app.use('/api/salary', salaryUserRoutes);
app.use('/api/expense', expenseRoutes);
app.use('/api/reminder', reminderRoutes);
app.use('/api/investment', investmentRoutes);
app.use('/api/investment-entry', investmentEntryRoutes);
app.use('/api/emergency-entry', emergencyEntryRoutes);
app.use('/api/emergency-expense', emergencyExpenseRoutes);
app.use('/api/viagem-entry', viagemEntryRoutes);
app.use('/api/viagem-expense', viagemExpenseRoutes);
app.use('/api/carro-entry', carroEntryRoutes);
app.use('/api/carro-expense', carroExpenseRoutes);
app.use('/api/mesada-entry', mesadaEntryRoutes);
app.use('/api/mesada-expense', mesadaExpenseRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/summary', summaryRoutes);
app.use('/api/investment-returns', investmentAnnualReturnRoutes);
// app.use('/api/transactions', require('./routes/transactions'));
// app.use('/api/categories', require('./routes/categories'));
// app.use('/api/reports', require('./routes/reports'));

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'success',
    message: 'JSFinance API está funcionando!',
    timestamp: new Date().toISOString(),
    environment: config.server.nodeEnv,
    database: database.getConnectionStatus()
  });
});

// Endpoint de diagnóstico para listar rotas ativas
app.get('/api/_routes', (req: Request, res: Response) => {
  const routes: Array<{ method: string; path: string }> = [];
  const anyApp: any = app as any;
  anyApp._router?.stack?.forEach((layer: any) => {
    if (layer.route && layer.route.path) {
      const methods = Object.keys(layer.route.methods || {}).filter(Boolean);
      methods.forEach((m) => routes.push({ method: m.toUpperCase(), path: layer.route.path }));
    } else if (layer.name === 'router' && layer.handle?.stack) {
      layer.handle.stack.forEach((h: any) => {
        const route = h.route;
        if (route) {
          const methods = Object.keys(route.methods || {}).filter(Boolean);
          const prefix = layer.regexp && layer.regexp.fast_star ? '' : (layer.regexp?.toString() || '');
          // Tenta extrair o prefixo de path do regex (heurística simples)
          let base = '';
          if (layer.regexp && layer.regexp.fast_slash) base = '/';
          // Quando o router é montado via app.use('/api/reports', router)
          // o regexp costuma conter o prefixo '/api/reports'. Vamos tentar guardar isso manualmente:
          // Como alternativa simples, só listamos os paths do route e o consumidor saberá o prefixo externo.
          methods.forEach((m) => routes.push({ method: m.toUpperCase(), path: route.path }));
        }
      });
    }
  });
  res.json({ count: routes.length, routes });
});

// 404 handler
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({
    status: 'error',
    message: `Rota ${req.originalUrl} não encontrada`
  });
});

// Global error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('❌ Erro:', err.stack);
  
  const statusCode = err.statusCode || 500;
  const message = config.server.nodeEnv === 'production' 
    ? 'Algo deu errado!' 
    : err.message;

  res.status(statusCode).json({
    status: 'error',
    message,
    ...(config.server.nodeEnv === 'development' && { stack: err.stack })
  });
});

// Start server
const startServer = async (): Promise<void> => {
  try {
    // Connect to database
    await database.connect(config.database);

    // Start listening
    app.listen(config.server.port, () => {
      console.log(`🚀 Servidor rodando na porta ${config.server.port}`);
      console.log(`🌍 Ambiente: ${config.server.nodeEnv}`);
      console.log(`🔗 URL: http://localhost:${config.server.port}`);
    });
  } catch (error) {
    console.error('❌ Erro ao iniciar servidor:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 Recebido SIGTERM, encerrando servidor...');
  await database.disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🛑 Recebido SIGINT, encerrando servidor...');
  await database.disconnect();
  process.exit(0);
});

// Start the application
startServer();

export default app;
