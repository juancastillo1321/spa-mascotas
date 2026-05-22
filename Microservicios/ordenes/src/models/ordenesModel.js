const mysql = require('mysql2/promise');

// Mantenemos tu configuración exacta
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'db', 
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'Titoelgato0809',
    database: process.env.DB_NAME || 'almacenOrdenes',
    port: 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Mantenemos el nombre de la función: traerOrdenes
async function traerOrdenes() {
    const query = 'SELECT * FROM reservas'; 
    // Corregido internamente: de 'db.query' a 'pool.query'
    const [rows] = await pool.query(query);
    return rows;
}

// Mantenemos el nombre de la función: contarCuposPorServicioYFecha
const contarCuposPorServicioYFecha = async (nombreServicio, fecha) => {
    try {
        const sql = `SELECT COUNT(*) as total FROM reservas WHERE nombreServicio LIKE ? AND DATE(fecha) = ?`;
        const [rows] = await pool.query(sql, [`%${nombreServicio}%`, fecha]);
        return rows[0].total;
    } catch (error) {
        console.error("❌ ERROR EN MODELO (contarCupos):", error.message);
        throw error;
    }
};

// Mantenemos el nombre de la función: crearOrden
async function crearOrden(datos) {
    const query = `
        INSERT INTO reservas (nombreCliente, emailCliente, precioTotal, fecha, nombreServicio, estado)
        VALUES (?, ?, ?, ?, ?, ?)
    `;
    const valores = [
        datos.nombreCliente, 
        datos.emailCliente, 
        datos.precioTotal, 
        datos.fecha, 
        datos.nombreServicio, 
        datos.estado || 'pendiente'
    ];
    // Corregido internamente: de 'connection.query' a 'pool.query'
    const [result] = await pool.query(query, valores);
    return result;
}

// Mantenemos el nombre de la función: traerOrden
async function traerOrden(id) {
    try {
        const [rows] = await pool.query('SELECT * FROM reservas WHERE id = ?', [id]);
        return rows[0];
    } catch (error) {
        console.error("❌ ERROR EN MODELO (traerOrden):", error.message);
        throw error;
    }
}

// Mantenemos el nombre de la función: eliminarOrden
async function eliminarOrden(id) {
    try {
        const [result] = await pool.query('DELETE FROM reservas WHERE id = ?', [id]);
        return result;
    } catch (error) {
        console.error("❌ ERROR EN MODELO (eliminarOrden):", error.message);
        throw error;
    }
}

// Mantenemos el nombre de la función: marcarOrdenComoPagada
async function marcarOrdenComoPagada(id) {
    try {
        const sql = 'UPDATE reservas SET estado = ? WHERE id = ?';
        const [result] = await pool.query(sql, ['pagado', id]);
        return result;
    } catch (error) {
        console.error("❌ ERROR EN MODELO (marcarOrdenComoPagada):", error.message);
        throw error;
    }
}

// Exportamos exactamente lo mismo que tenías
module.exports = {
    traerOrdenes,
    crearOrden,
    traerOrden,
    eliminarOrden,
    contarCuposPorServicioYFecha,
    marcarOrdenComoPagada
};