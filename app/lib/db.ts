import { Pool } from 'pg';

const sslMode = process.env.DB_SSLMODE || 'disable';

const poolConfig = {
  user: process.env.POSTGRES_USER,
  host: process.env.POSTGRES_HOST,
  database: process.env.POSTGRES_DATABASE,
  password: process.env.POSTGRES_PASSWORD,
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  ssl: sslMode === 'require' ? { rejectUnauthorized: false } : false,
  
  max: 5,
  min: 0,
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 5000,
  statement_timeout: 30000,
  query_timeout: 30000,
  allowExitOnIdle: true,
};

let pool: Pool;

function getPool() {
  if (!pool) {
    pool = new Pool(poolConfig);
    
    pool.on('error', (err) => {
      console.error('Error inesperado en el pool de PostgreSQL:', err);
    });
    
    if (process.env.NODE_ENV !== 'production') {
      pool.on('connect', () => {
        console.log('Nueva conexión al pool de PostgreSQL');
      });
      
      pool.on('remove', () => {
        console.log('Conexión removida del pool');
      });
    }
  }
  return pool;
}

export const query = async (text: string, params?: any[]) => {
  const currentPool = getPool();
  const client = await currentPool.connect();
  
  try {
    const start = Date.now();
    const res = await client.query(text, params);
    const duration = Date.now() - start;
    
    if (process.env.NODE_ENV !== 'production' || duration > 1000) {
      console.log('Query ejecutada', { 
        duration: `${duration}ms`, 
        rows: res.rowCount,
        slow: duration > 1000 ? '⚠️ LENTA' : '✓'
      });
    }
    
    return res;
  } catch (error: any) {
    console.error('Error en query de PostgreSQL:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      hint: error.hint,
    });
    throw error;
  } finally {
    client.release();
  }
};

export const queryWithRetry = async (
  text: string, 
  params?: any[], 
  maxRetries: number = 3
) => {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await query(text, params);
    } catch (error: any) {
      lastError = error;
      
      const retryableCodes = [
        '40P01',
        '57014',
        '08006',
        '08003',
        '53300',
      ];
      
      if (retryableCodes.includes(error.code) && attempt < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        console.log(`Reintentando query (intento ${attempt}/${maxRetries}) después de ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      throw error;
    }
  }
  
  throw lastError;
};

export const transaction = async <T>(
  callback: (client: any) => Promise<T>
): Promise<T> => {
  const currentPool = getPool();
  const client = await currentPool.connect();
  
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const healthCheck = async (): Promise<boolean> => {
  try {
    const result = await query('SELECT 1 as health');
    return result.rows[0].health === 1;
  } catch (error) {
    console.error('Health check falló:', error);
    return false;
  }
};

export const getPoolStats = () => {
  const currentPool = getPool();
  return {
    totalCount: currentPool.totalCount,
    idleCount: currentPool.idleCount,
    waitingCount: currentPool.waitingCount,
  };
};

export const closePool = async () => {
  if (pool) {
    await pool.end();
    console.log('Pool de PostgreSQL cerrado');
  }
};

export default getPool();