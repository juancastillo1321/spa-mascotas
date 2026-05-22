const mysql = require('mysql2/promise');

const connection = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'capasAlmacen',
    port: '3306'
});

async function obtenerUsuarios() {
    const [rows] = await connection.query('SELECT * FROM usuarios');
    return rows;
}

async function obtenerUsuariosPorId(id) {
    const [rows] = await connection.query(
        'SELECT * FROM usuarios WHERE id = ?',
        [id]
    );
    return rows[0];
}

async function crearUsuarios(nombres, apellidos, cedula, correo, telefono, direccion) {
    const [result] = await connection.query(
        'INSERT INTO usuarios (nombres, apellidos, cedula, correo, telefono, direccion) VALUES (?, ?, ?, ?, ?, ?)',
        [nombres, apellidos, cedula, correo, telefono, direccion]
    );
    return result;
}

async function editarUsuarios(id, nombres, apellidos, cedula, correo, telefono, direccion) {
    const [result] = await connection.query(
        'UPDATE usuarios SET nombres = ?, apellidos = ?, cedula = ?, correo = ?, telefono = ?, direccion = ? WHERE id = ?',
        [nombres, apellidos, cedula, correo, telefono, direccion, id]
    );
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
    editarUsuarios,
    eliminarUsuarios
};