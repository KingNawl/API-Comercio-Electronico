import express from 'express';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import path from 'path';

import authRoutes from './routes/auth.routes.js';
import productsRoutes from './routes/products.routes.js';
import authenticateToken from './middleware/authenticateToken.js';

const app = express();

// Configuración de la carpeta public
app.use(express.static(path.join(process.cwd(), 'public')));


// Motor de plantillas ejs
app.set('view engine', 'ejs');

// Middleware
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(authenticateToken);

// Routes
app.get('/', (req, res) => {
    const { user } = req.session;
    res.render('index', { user });
});

app.get('/protected', (req, res) => {
    const { user } = req.session;
    console.log(user)
    if (!user) return res.status(401).send('Unauthorized');
    res.status(200).render('protected', { user });
})

app.use('/auth', authRoutes);
app.use('/products', productsRoutes);

export default app;