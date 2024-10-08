import { Router } from 'express';
import pool from '../database.js';
import Validators from '../helpers/validators.js';

const router = Router();

/**
 * GET /products
 * Obtener todos los productos
 */
router.get('/', async (req, res) => {
    try {
        const connect = await pool.getConnection();

        const [rows] = await connect.query('SELECT * FROM products');
        if (!rows.length) return res.status(404).render('products',{ message: 'No hay productos disponibles' });

        console.log(rows);
        

        res.status(200).render('products', { products: rows });

    } catch (error) {
        res.status(500).json({ message: error.message, products: [] });
    }
})

/**
 * GET /products/new
 * Formulario para crear un nuevo producto
 */
router.get('/new', (req, res) => {
    res.status(200).render('new-product');
})

router.get('/gestor', async (req, res) => {
    try {
        const connect = await pool.getConnection();

        const [rows] = await connect.query('SELECT * FROM products');
        if (!rows.length) return res.status(404).render('products',{ message: 'No hay productos disponibles' });

        console.log(rows);
        

        res.status(200).render('gestor', { products: rows });

    } catch (error) {
        res.status(500).json({ message: error.message, products: [] });
    }
})

router.get('/:id', async (req, res) => {
    const { id } = req.params;

    Validators.validateId(id);

    try {
        const connect = await pool.getConnection();

        const [rows] = await connect.query('SELECT * FROM products WHERE id = ?', [id]);
        if (!rows.length) return res.status(404).render('products', { message: 'Producto no encontrado', products: [] });

        res.status(200).render('products', { products: rows });
    }catch (error) {
        res.status(500).render('products', { message: error.message, products: [] });
    }
})

/**
 * POST /products/new
 * Crear un nuevo producto
 */
router.post('/new', async (req, res) => {
    const { name, description, price, stock, discount, disabled } = req.body;

    console.log(name, description, price, stock, discount, disabled);

    let connection;
    let query;
    try {
        Validators.validateProduct({ name, description, price, stock, discount, disabled });

        connection = await pool.getConnection();

        //Comprobar si el producto ya existe
        query = 'SELECT * FROM products WHERE name = ?';
        const [rows] = await connection.query(query, [name]);

        if (rows.length) {
            throw new Error('El producto ya existe');
        }

        //Insertar el producto
        query = 'INSERT INTO products (name, description, price, stock, discount, disabled) VALUES (?, ?, ?, ?, ?, ?)';
        const [resultInsert] = await connection.query(query, [name, description, price, stock, discount, disabled]);

        const id = resultInsert.insertId;

        connection.commit();

        res.status(201).json({
            message: 'Producto creado correctamente',
            idProduct: id,
            producto: name
        })

    } catch (error) {
        res.status(500).json({ message: error.message });
        
    }
})

router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { name, description, price, stock, discount, disabled } = req.body;

    let connection;
    let query;
    try {
        Validators.validateProductUpdate({ name, description, price, stock, discount, disabled });
        
        //Comprobar si el producto existe
        connection = await pool.getConnection();
        connection.beginTransaction();

        query = 'SELECT * FROM products WHERE id = ?';
        const [rows] = await connection.query(query, [id]);

        if (!rows.length) {
            return res.status(404).json({ message: 'Producto no encontrado' });
        }

        //Comprobar si el nombre del producto ya existe
        if (name){
            query = 'SELECT * FROM products WHERE name = ? AND id != ?';
            const [rows] = await connection.query(query, [name, id]);

            if (rows.length) {
                throw new Error('El producto ya existe');
            }
        }

        //Actualizar el producto segun los parametros que se hayan enviado segun si son null o no
        query = 'UPDATE products SET name = COALESCE(?, name), description = COALESCE(?, description), price = COALESCE(?, price), stock = COALESCE(?, stock), discount = COALESCE(?, discount), disabled = COALESCE(?, disabled) WHERE id = ?';
        const [result] = await connection.query(query, [name, description, price, stock, discount, disabled, id]);

        res.status(200).json({ 
            message: 'Producto actualizado correctamente',
            filasAfectadas: result.affectedRows,
            filasCambiadas: result.changedRows
        });

        connection.commit();
    } catch (error) {
        if(connection) connection.rollback();
        res.status(500).json({ message: error.message });
    } finally {
        if(connection) connection.release();
    }
})

router.delete('/:id', async (req, res) => {
    const { id } = req.params;

    let connection;
    let query;
    try {
        Validators.validateId(id);

        connection = await pool.getConnection();
        connection.beginTransaction();

        //Comprobar si existe el producto
        query = 'SELECT * FROM products WHERE id = ?';
        const [rows] = await connection.query(query, [id]);

        if (!rows.length) {
            return res.status(404).json({ message: 'Producto no encontrado' });
        }

        //Eliminar el producto
        query = 'DELETE FROM products WHERE id = ?';
        const [result] = await connection.query(query, [id]);

        connection.commit();

        res.status(200).json({
            message: 'Producto eliminado correctamente'
        })
    } catch (error) {
        if(connection) connection.rollback();
        res.status(500).json({ message: error.message });
    } finally {
        if(connection) connection.release();
    }
})


export default router;