import dotenv from 'dotenv';
dotenv.config();

export const {
    PORT = 3000,
    SALT = 10,
    NODE_ENV = 'development',
    DB_HOST,
    DB_USER,
    DB_PASSWORD,
    DB_NAME,
    DB_PORT,
    SECRET_KEY = 'EstoEsUnaPalabraSuperSecreta14091427ynuncaVAISapoderDESCRIPTARestesuperSecreto',
} = process.env;