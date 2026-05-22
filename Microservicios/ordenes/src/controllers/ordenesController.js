const express = require('express');
const router = express.Router();
const axios = require('axios');
const ordenesModel = require('../models/ordenesModel');

router.get('/ordenes', async (req, res) => {
    try {
        const datos = await ordenesModel.traerOrdenes();
        res.json(datos);
    } catch (error) {
        console.error("DETALLE DEL ERROR:", error); 
        res.status(500).json({ error: "Error de DB", detalle: error.message });
    }
});

router.post('/ordenes', async (req, res) => {
    try {
        const { usuario, items, fecha_reserva } = req.body;
        console.log("📥 Intentando crear reserva para:", usuario);

        let totalPagar = 0;
        let nombreServicio = "";
        let idServicioPrincipal = null;

        // --- VALIDACIÓN DE CUPO ---
        for (const item of items) {
            // CAMBIO: 'servicios' es el nombre en el docker-compose
            const resProd = await axios.get(`http://servicios:3000/api/productos/${item.id}`); 
            const producto = resProd.data;

            if (!producto || producto.cupos <= 0) {
                return res.status(400).json({ error: `Sin cupos para el servicio: ${item.id}` });
            }
            
            totalPagar = producto.precio;
            nombreServicio = producto.nombre;
            idServicioPrincipal = item.id;
        }

        // --- VALIDACIÓN DE USUARIO ---
        let dataUser;
        try {
            // CAMBIO: 'usuarios' es el nombre en el docker-compose
            const resUser = await axios.get(`http://usuarios:3001/api/usuarios/${usuario}`);
            dataUser = resUser.data;
        } catch (err) {
            console.error("❌ Error llamando al micro de USUARIOS:", err.message);
            return res.status(500).json({ error: "El micro de USUARIOS no responde o el usuario no existe" });
        }

        // --- GUARDAR EN DB ---
        const nuevaOrden = {
            nombreCliente: dataUser.nombre,
            emailCliente: dataUser.correo,
            precioTotal: totalPagar,
            fecha: fecha_reserva,
            nombreServicio: nombreServicio,
            estado: 'pendiente'
        };

        const resultado = await ordenesModel.crearOrden(nuevaOrden);

        // ¡IMPORTANTE! Envía la respuesta al cliente para que el log no se quede colgado
        res.status(201).json({ 
            mensaje: "Reserva creada con éxito", 
            idOrden: resultado.insertId 
        });

    } catch (error) {
        console.error("❌ ERROR GENERAL EN POST:", error);
        res.status(500).json({ error: "Error al procesar la reserva", detalle: error.message });
    }
});

// --- RUTA DELETE CORREGIDA (Cambié localhost por servicios) ---
router.delete('/ordenes/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const orden = await ordenesModel.traerOrden(id);
        
        if (!orden) {
            return res.status(404).json({ error: "Orden no encontrada" });
        }

        await ordenesModel.eliminarOrden(id);

        if (orden.idServicio) {
            // CAMBIO: localhost -> servicios
            const resProd = await axios.get(`http://servicios:3000/api/productos/${orden.idServicio}`);
            const producto = resProd.data;

            const reservasRestantes = await ordenesModel.contarCuposPorServicioYFecha(
                orden.nombreServicio,
                orden.fecha
            );

            if (reservasRestantes < producto.cupos && String(producto.estado).toLowerCase() === 'completado') {
                // CAMBIO: localhost -> servicios
                await axios.patch(`http://servicios:3000/api/productos/${orden.idServicio}/estado`, {
                    estado: 'activo'
                });
            }
        }
        res.json({ mensaje: "Orden eliminada" });
    } catch (error) {
        console.error("Error al eliminar orden:", error.message);
        res.status(500).json({ error: "Error al eliminar la orden", detalle: error.message });
    }
});

module.exports = router;