require('dotenv').config();
const mysql = require('mysql2/promise');

const connection = mysql.createPool({ 
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: 3306
});

async function obtenerUsuarios() {
    const [rows] = await connection.query('SELECT id, nombres, apellidos, cedula, correo, telefono, direccion, rol FROM usuarios');
    return rows;
}

async function validar_password(correo, password) {
    // IMPORTANTE: Traemos el ROL para que el Front sepa quién es quién
    const [rows] = await connection.query(
        'SELECT id, nombres, apellidos, correo, rol FROM usuarios WHERE correo = ? AND password = ?',
        [correo, password]
    );
    return rows[0];
}

async function validar_password_admin(correo, password) {
    const [rows] = await connection.query(
        'SELECT id, nombres, apellidos, correo, rol FROM usuarios WHERE correo = ? AND password = ? AND rol = "admin"',
        [correo, password]
    );
    return rows[0];
}


async function obtenerUsuariosPorId(id) {
    const [rows] = await connection.query("SELECT * FROM usuarios WHERE id = ?", [id]);
    return rows[0];
}

// El controlador sigue enviando los datos en este orden exacto
async function crearUsuarios(nombres, apellidos, password, cedula, correo, telefono, direccion, rol) {
    const query = `
        INSERT INTO usuarios (nombres, apellidos, password, cedula, correo, telefono, direccion, rol) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    // El orden de los '?' debe coincidir con este array
    const valores = [nombres, apellidos, password, cedula, correo, telefono, direccion, rol];
    
    const [result] = await connection.query(query, valores);
    return result;
}   

// REVISA ESTO EN usuariosModel.js
async function editarUsuario(id, nombres, apellidos, cedula, correo, telefono, direccion, rol) {
    const query = `
        UPDATE usuarios 
        SET nombres = ?, apellidos = ?, cedula = ?, correo = ?, telefono = ?, direccion = ?, rol = ?
        WHERE id = ?
    `;
    // EL ORDEN AQUÍ ES LO QUE SUELE FALLAR:
    const valores = [nombres, apellidos, cedula, correo, telefono, direccion, rol, id];
    
    const [result] = await connection.query(query, valores);
    return result;
}
async function eliminarUsuarios(id) {
    const [result] = await connection.query(
        'DELETE FROM usuarios WHERE id = ?',
        [id]
    );
    return result;
}

module.exports = {
    obtenerUsuarios,
    obtenerUsuariosPorId,
    crearUsuarios,
    editarUsuario,
    eliminarUsuarios,
    validar_password
};