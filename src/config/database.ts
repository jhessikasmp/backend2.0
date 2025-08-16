import mongoose from 'mongoose';

interface DatabaseConfig {
  uri: string;
  options?: mongoose.ConnectOptions;
}

class Database {
  private static instance: Database;
  private isConnected: boolean = false;

  private constructor() {}

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  public async connect(config: DatabaseConfig): Promise<void> {
    if (this.isConnected) {
      console.log('🗄️  MongoDB já está conectado');
      return;
    }

    try {
      await mongoose.connect(config.uri, config.options || {});
      this.isConnected = true;
      console.log('🗄️  MongoDB conectado com sucesso');
      
      // Event listeners
      mongoose.connection.on('error', (error) => {
        console.error('❌ Erro na conexão MongoDB:', error);
        this.isConnected = false;
      });

      mongoose.connection.on('disconnected', () => {
        console.log('⚠️  MongoDB desconectado');
        this.isConnected = false;
      });

      mongoose.connection.on('reconnected', () => {
        console.log('🔄 MongoDB reconectado');
        this.isConnected = true;
      });

    } catch (error) {
      console.error('❌ Erro ao conectar com MongoDB:', error);
      this.isConnected = false;
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    try {
      await mongoose.disconnect();
      this.isConnected = false;
      console.log('🗄️  MongoDB desconectado com sucesso');
    } catch (error) {
      console.error('❌ Erro ao desconectar MongoDB:', error);
      throw error;
    }
  }

  public getConnectionStatus(): boolean {
    return this.isConnected;
  }

  public getConnection() {
    return mongoose.connection;
  }
}

export default Database;
