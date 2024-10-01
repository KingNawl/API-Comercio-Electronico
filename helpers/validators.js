export default class Validators {
    static isEmail(email) {
        const re = /\S+@\S+\.\S+/;
        if (!re.test(email)){
            throw new Error('El correo electrónico no es válido');
        }
    }
    static isUsername(username) {
        if(!username){
            throw new Error('El nombre de usuario es obligatorio');
        }
        if (typeof username !== 'string') {
            throw new Error('El nombre de usuario debe ser una cadena de caracteres');
        }
        if (username.length < 3 || username.length > 20) {
            throw new Error('El nombre de usuario debe tener entre 3 y 20 caracteres');
        }
    }
    static isPassword(password) {
        if(!password){
            throw new Error('La contraseña es obligatoria');
        }
        if (typeof password !== 'string') {
            throw new Error('La contraseña debe ser una cadena de caracteres');
        }
        if (password.length < 6 || password.length > 40) {
            throw new Error('La contraseña debe tener entre 6 y 40 caracteres');
        }
    }

    static validateProduct({ name, description, price, stock, discount, disabled }) {
        if (!name || typeof name !== 'string' || name.length < 3 || name.length > 60) {
            throw new Error('El nombre debe ser una cadena de caracteres entre 3 y 60 caracteres');
        }
        if (!description || typeof description !== 'string' || description.length < 10 || description.length > 200) {
            throw new Error('La descripción debe ser una cadena de caracteres entre 10 y 200 caracteres');
        }
        if (typeof price !== 'number' || price < 0) {
            throw new Error('El precio debe ser un número positivo');
        }
        if (typeof stock !== 'number' || stock <= 0) {
            throw new Error('El stock debe ser un número mayor o igual que 0');
        }
        if(discount){
            // El descuento es un decimal opcional entre 0 y 1
            if (typeof discount !== 'number' || discount < 0 || discount >= 1) {
                throw new Error('El descuento debe ser un número entre 0 y 1');
            }
        }
        if (typeof disabled !== 'boolean') {
            throw new Error('El estado deshabilitado debe ser un valor booleano');
        }
    }

    static validateProductUpdate({ name, description, price, stock, discount, disabled }) {
        if (name && (typeof name !== 'string' || name.length < 3 || name.length > 60)) {
            throw new Error('El nombre debe ser una cadena de caracteres entre 3 y 60 caracteres');
        }
        if (description && (typeof description !== 'string' || description.length < 10 || description.length > 200)) {
            throw new Error('La descripción debe ser una cadena de caracteres entre 10 y 200 caracteres');
        }
        if (!price && (typeof price !== 'number' || price < 0)) {
            throw new Error('El precio debe ser un número positivo');
        }
        if (stock && (typeof stock !== 'number' || stock < 0)) {
            throw new Error('El stock debe ser un número mayor o igual que 0');
        }
        if (discount) {
            if (typeof discount !== 'number' || discount < 0 || discount >= 1) {
                throw new Error('El descuento debe ser un número entre 0 y 1');
            }
        }
        if (disabled && typeof disabled !== 'boolean') {
            throw new Error('El estado deshabilitado debe ser un valor booleano');
        }
    }

    static validateId(id) {
        if (isNaN(id) || id <= 0) {
            throw new Error('El ID debe ser un número entero positivo');
        }
    }
}