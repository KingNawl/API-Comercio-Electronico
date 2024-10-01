import jwt from 'jsonwebtoken';
import { SECRET_KEY, NODE_ENV } from '../config.js';
import pool from '../database.js';

const authenticateToken = async (req, res, next) => {

    const { access_token, refresh_token } = req.cookies;
    req.session = { user: null };

    if(!access_token && !refresh_token) return next();

    try {
        const accessData = jwt.verify(access_token, SECRET_KEY);
        req.session.user = accessData;
    } catch(error) {
        
        if(refresh_token){
            let connection;
            try {
                const refreshData = jwt.verify(refresh_token, SECRET_KEY);
                
                connection = await pool.getConnection();
                const query = 'SELECT * FROM users WHERE id = ? && username = ? && refresh_token = ?';
                const [rows] = await connection.query(query, [refreshData.id, refreshData.username, refresh_token]);

                if(!rows.length) throw new Error('Invalid refresh token');

                const newAccessToken = jwt.sign({ id: refreshData.id, username: refreshData.username }, SECRET_KEY, { expiresIn: '1h' });
                res.cookie('access_token', newAccessToken, {
                    httpOnly: true,
                    secure: NODE_ENV === 'production',
                    sameSite: 'strict',
                    maxAge: 1000 * 60 * 60,	//1 hora
                });

                req.session.user = refreshData;
            } catch (error) {
                console.error(error);
            } finally {
                if(connection) connection.release();
            }
        }
    }

    next();
}

export default authenticateToken;