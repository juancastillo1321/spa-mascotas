const express = require('express');
const router = express.Router();
const productosModel = require('../models/productosModel');

// --- RUTA PARA OBTENER TODOS LOS SERVICIOS ---
router.get('/api/productos', async (req, res) => {
    try {
        const productos = await productosModel.obtenerProductos();
        res.status(200).json(productos);
    } catch (error) {
        res.status(500).json({ error: "Error al obtener servicios" });
    }
});

router.get('/api/productos/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const producto = await productosModel.obtenerProductoPorId(id);

        if (!producto) {
            return res.status(404).json({ error: "No se encontró el servicio" });
        }
        res.json(producto);
    } catch (error) {
        res.status(500).json({ error: "Error en el servidor" });
    }
});

// --- RUTA PARA INSERTAR UN SERVICIO ---
router.post('/api/productos', async (req, res) => {
    try {
        // MODIFICACIÓN: Agregamos cupos_maximos que viene del body
        let { nombre, precio, detalle, marca, estado, cupos } = req.body;

        if (Number(precio) < 0) {
            return res.status(400).json({ error: "El precio no puede ser negativo" });
        }

        const estadosValidos = ['activo', 'inhabilitado', 'completado'];
        if (!estado || !estadosValidos.includes(estado.toLowerCase())) {
            return res.status(400).json({ error: "Estado no permitido. Use: activo, inhabilitado o completado" });
        }

        const estadoFinal = estado.toLowerCase();
        // MODIFICACIÓN: Si no envían cupos, ponemos 10 por defecto
        const cuposFinales = cupos || 10;

        // MODIFICACIÓN: Enviamos los cupos al modelo
        await productosModel.crearProducto(nombre, precio, detalle, marca, estadoFinal, cuposFinales);
        res.status(201).json({ mensaje: "Servicio creado con éxito" });

    } catch (error) {
        console.error("Error al insertar:", error);
        res.status(500).json({ error: "Error interno al insertar" });
    }
});

// --- RUTA PARA EDITAR UN SERVICIO ---
router.put('/api/productos/:id', async (req, res) => {
    try {
        const { id } = req.params;
        // MODIFICACIÓN: Agregamos cupos_maximos al editar
        let { nombre, precio, detalle, marca, estado, cupos } = req.body;

        if (Number(precio) < 0) {
            return res.status(400).json({ error: "El precio no puede ser negativo" });
        }

        const estadosValidos = ['activo', 'inhabilitado', 'completado'];
        if (!estado || !estadosValidos.includes(estado.toLowerCase())) {
            return res.status(400).json({ error: "Estado no permitido" });
        }

        const estadoFinal = estado.toLowerCase();

        // MODIFICACIÓN: Pasamos cupos_maximos al modelo
        await productosModel.editarProducto(id, nombre, precio, detalle, marca, estadoFinal, cupos);
        
        res.status(200).json({ mensaje: "Servicio actualizado con éxito" });

    } catch (error) {
        console.error("Error al editar:", error);
        res.status(500).json({ error: "Error interno al actualizar" });
    }
}); 

// --- RUTA PARA ELIMINAR UN SERVICIO ---
router.delete('/api/productos/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await productosModel.eliminarProducto(id);
        res.status(200).json({ mensaje: "Servicio eliminado correctamente" });
    } catch (error) {
        res.status(500).json({ error: "Error al eliminar" });
    }
});


// NUEVA FUNCIÓN (Opcional pero recomendada para el punto de los cupos)
// Sirve para que el micro de órdenes descuente cupos sin cambiar toda la lógica
router.patch('/api/productos/:id/descontar', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await productosModel.descontarCupo(id);
        if (!result) return res.status(400).json({ error: "Sin cupos" });
        res.json({ mensaje: "Cupo descontado" });
    } catch (error) {
        res.status(500).json({ error: "Error al descontar" });
    }
});
router.patch('/api/productos/:id/estado', async (req, res) => {
    try {
        const { id } = req.params;
        let { estado } = req.body;

        const estadosValidos = ['activo', 'inhabilitado', 'completado'];
        if (!estado || !estadosValidos.includes(String(estado).toLowerCase())) {
            return res.status(400).json({ error: "Estado no permitido. Use: activo, inhabilitado o completado" });
        }

        const producto = await productosModel.obtenerProductoPorId(id);
        if (!producto) {
            return res.status(404).json({ error: "No se encontró el servicio" });
        }

        const result = await productosModel.actualizarEstadoProducto(id, String(estado).toLowerCase());

        if (result.affectedRows === 0) {
            return res.status(400).json({ error: "No se pudo actualizar el estado" });
        }

        res.json({ mensaje: "Estado del servicio actualizado correctamente" });
    } catch (error) {
        console.error("Error al actualizar estado:", error);
        res.status(500).json({ error: "Error interno al actualizar el estado" });
    }
});

module.exports = router;
