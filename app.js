import express from 'express';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';

import authRoutes from './routes/auth.routes.js';
import productsRoutes from './routes/products.routes.js';
import authenticateToken from './middleware/authenticateToken.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Configuración de la carpeta public
app.use(express.static('public'));

app.use('/bootstrap', express.static(path.join(__dirname, 'node_modules/bootstrap/dist')));
app.use('/bootstrap-icons/font', express.static(path.join(__dirname, 'node_modules/bootstrap-icons/font')));


// Motor de plantillas ejs
app.set('view engine', 'ejs');
app.set('views', './views');

// Middleware
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(authenticateToken);

app.use((req, res, next) => {

    //Añadimos la ruta actual a res.locals para poder usarla en las vistas
    res.locals.currentRoute = req.path;

    //Añadimos el usuario a res.locals para poder usarlo en las vistas
/*     if (req.session.user) {
        res.locals.user = req.session.user;
    }else{
        res.locals.user = null;
    } */
    res.locals.user = req.session.user ? req.session.user : null;
    next();
});

// Routes
app.get('/', (req, res) => {
    res.render('index');
});

app.get('/protected', (req, res) => {
    const { user } = req.session;
    if (!user) return res.status(401).send('Unauthorized');
    res.status(200).render('protected');
})

app.use('/auth', authRoutes);
app.use('/products', (req, res, next) => {
    const { user } = req.session;
    if (!user) return res.status(401).send('Unauthorized');
    next();
}, productsRoutes);

export default app;