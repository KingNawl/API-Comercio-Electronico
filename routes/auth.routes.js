import { Router } from 'express';

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

import pool from '../database.js';
import { SALT, SECRET_KEY, NODE_ENV } from '../config.js';
import Validators from '../helpers/validators.js';

const router = Router();

router.get('/register', (req, res) => {
    res.render('register');
})

router.post('/register', async (req, res) => {
    const { email, username, password } = req.body;
    
    let connection;
    let query;
    try {
        
        //Validaciones
        Validators.isEmail(email);
        Validators.isUsername(username);
        Validators.isPassword(password);
        
        connection = await pool.getConnection();

        connection.beginTransaction();
        
        //Verificar si el usuario ya existe
        query = 'SELECT * FROM users WHERE email = ? or username = ?';
        const [rows] = await connection.query(query, [email, username]);

        if (rows.length) {
            if(rows[0].email === email){
                throw new Error('Email ya existe');
            }else{
                throw new Error('Usuario ya existe');
            }
        }

        //Encriptar la contraseña
        const hashedPassword = await bcrypt.hash(password, SALT);

        //Insertar el usuario
        query = 'INSERT INTO users (email, username, password) VALUES (?, ?, ?)';
        const [resultInsert] = await connection.query(query, [email, username, hashedPassword]);

        const id = resultInsert.insertId;

        //Generar el token de autenticación por 1 hora
        const token = jwt.sign({ id, username }, SECRET_KEY, { expiresIn: '1h' });
        
        //Generar el refresh token por 7 dias
        const refreshToken = jwt.sign({ id, username }, SECRET_KEY, { expiresIn: '7d' });

        //Actualizar el refresh token en la base de datos
        query = 'UPDATE users SET refresh_token = ? WHERE id = ?';
        await connection.query(query, [refreshToken, id]);

        //Commit
        connection.commit();

        res
            .cookie('access_token', token, {
                httpOnly: true,
                secure: NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 1000 * 60 * 60,	//1 hora
            })
            .cookie('refresh_token', refreshToken, {
                httpOnly: true,
                secure: NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 1000 * 60 * 60 * 24 * 7,	//7 dias
            })
            .status(201)
            .json({ message: 'Usuario registrado correctamente' });

    } catch (error) {
        if (connection) connection.rollback();
        console.error(error);
        res.status(500).json({ message: error.message });   
    } finally {
        if (connection) connection.release();
    }
})

router.get('/login', (req, res) => {
    const { user } = req.session;
    if (user) return res.redirect('/protected');
    res.render('login');
})

router.post('/login', async (req, res) => {
    const { username: userReq, password: passReq } = req.body;

    let connection;
    let query;
    try {
        Validators.isUsername(userReq);
        Validators.isPassword(passReq);

        //Verificar si el usuario existe
        connection = await pool.getConnection();
        query = 'SELECT * FROM users WHERE username = ?';
        const [rows] = await connection.query(query, [userReq]);

        if(!rows.length) throw new Error('Usuario o contraseña incorrectos');

        //Verificar la contraseña
        const { id, username, password} = rows[0];
        const isMatch = await bcrypt.compare(passReq, password);
        if (!isMatch) throw new Error('Usuario o contraseña incorrectos');

        //Generar el token de autenticación por 1 hora
        const token = jwt.sign({ id, username }, SECRET_KEY, { expiresIn: '1h' });
        
        //Generar el refresh token por 7 dias
        const refreshToken = jwt.sign({ id, username }, SECRET_KEY, { expiresIn: '7d' });

        //Actualizar el refresh token en la base de datos
        query = 'UPDATE users SET refresh_token = ? WHERE id = ?';
        await connection.query(query, [refreshToken, id]);

        //Crear las cookies y la respuesta
        res
            .cookie('access_token', token, {
                httpOnly: true,
                secure: NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 1000 * 60 * 60,	//1 hora
            })
            .cookie('refresh_token', refreshToken, {
                httpOnly: true,
                secure: NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 1000 * 60 * 60 * 24 * 7,	//7 dias
            })
            .status(201)
            .json({ message: 'Usuario logueado correctamente' });

    } catch (error) {
        console.log(error);
        res.status(401).json( {message: error.message})
    } finally {
        if (connection) connection.release();
    }
})

router.get('/logout', async (req, res) => {
    const { refreshToken } = req.cookies;

    let connection;
    try {
        connection = await pool.getConnection();

        connection.beginTransaction();

        // Eliminar el refresh token de la base de datos
        const query = 'UPDATE users SET refresh_token = NULL WHERE refresh_token = ?';
        await connection.query(query, [refreshToken]);

        // Commit
        connection.commit();

        res
            .clearCookie('access_token')
            .clearCookie('refresh_token')
            .status(200)
            .redirect('/');
    } catch (error) {
        connection.rollback();
        console.log(error);
        res.status(500).json({ message: 'Internal Server Error' });
    } finally {
        if (connection) connection.release();
    }
});

export default router;