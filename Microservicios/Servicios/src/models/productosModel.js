const mysql = require('mysql2/promise');

const connection = mysql.createPool({ 
    // Ahora leerá 'db' desde el environment del docker-compose
    host: process.env.DB_HOST || 'db', 
    user: process.env.DB_USER || 'root', 
    password: process.env.DB_PASSWORD || 'Titoelgato0809', 
    database: process.env.DB_NAME || 'almacenServicios' 
});

module.exports = connection;
 
async function obtenerProductos() { 
    const [rows] = await connection.query('SELECT * FROM servicio'); 
    return rows; 
}

async function obtenerProductoPorId(id) {
    const result = await connection.query(
        'SELECT * FROM servicio WHERE id = ?',
        [id]
    );
    return result[0][0]; 
}

// MODIFICACIÓN: Agregamos cupos_maximos a la inserción
async function crearProducto(nombre, precio, detalle, marca, estado, cupos) { 
    // Usamos los nombres de las columnas para que sea más seguro
    const sql = 'INSERT INTO servicio (nombre, precio, detalle, marca, estado, cupos) VALUES(?,?,?,?,?,?)';
    const result = await connection.query(sql, [nombre, precio, detalle, marca, estado, cupos]); 
    return result; 
} 

// MODIFICACIÓN: Agregamos cupos_maximos a la actualización
async function editarProducto(id, nombre, precio, detalle, marca, estado, cupos) {
    const result = await connection.query(
        'UPDATE servicio SET nombre = ?, precio = ?, detalle = ?, marca = ?, estado = ?, cupos = ? WHERE id = ?',
        [nombre, precio, detalle, marca, estado, cupos, id]
    );
    return result;
}

// NUEVA FUNCIÓN: Para que el micro de Órdenes descuente el cupo
async function descontarCupo(id) {
    const sql = 'UPDATE servicio SET cupos = cupos - 1 WHERE id = ? AND cupos > 0';
    const [result] = await connection.query(sql, [id]);
    // Retorna true si se hizo el descuento, false si no había cupos
    return result.affectedRows > 0;
}

async function eliminarProducto(id) {
    const result = await connection.query(
        'DELETE FROM servicio WHERE id = ?',
        [id]
    );
    return result;
}
async function actualizarEstadoProducto(id, estado) {
    const sql = 'UPDATE servicio SET estado = ? WHERE id = ?';
    const [result] = await connection.query(sql, [estado, id]);
    return result;
}


module.exports = { 
    obtenerProductos, 
    obtenerProductoPorId,
    crearProducto,
    editarProducto,
    eliminarProducto,
    descontarCupo,
    actualizarEstadoProducto
};
 
