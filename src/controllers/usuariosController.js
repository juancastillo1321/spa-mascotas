const { Router } = require('express');
const router = Router();
const usuariosModel = require('../models/usuariosModel');

router.get('/api/usuarios', async (req, res) => {
  try {
    const usuarios = await usuariosModel.obtenerUsuarios();
    res.status(200).json(usuarios);
  } catch (error) {
    console.error("Error al obtener usuarios:", error);
    res.status(500).json({ error: "Error del servidor al obtener usuarios" });
  }
});

router.get('/api/usuarios/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const usuario = await usuariosModel.obtenerUsuariosPorId(id);

    if (!usuario) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    res.status(200).json(usuario);
  } catch (error) {
    console.error("Error al obtener usuario por ID:", error);
    res.status(500).json({ error: "Error del servidor al obtener usuario" });
  }
});

router.post('/api/usuarios', async (req, res) => {
  try {
    const { nombres, apellidos, cedula, correo, telefono, direccion } = req.body;
    await usuariosModel.crearUsuarios(nombres, apellidos, cedula, correo, telefono, direccion);
    res.status(201).json({ mensaje: "Usuario creado con éxito" });
  } catch (error) {
    console.error("Error al insertar usuario:", error);
    res.status(500).json({ error: "Error del servidor al insertar usuario" });
  }
});

router.put('/api/usuarios/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nombres, apellidos, cedula, correo, telefono, direccion } = req.body;
    await usuariosModel.editarUsuarios(id, nombres, apellidos, cedula, correo, telefono, direccion);
    res.status(200).json({ mensaje: "Usuario actualizado con éxito" });
  } catch (error) {
    console.error("Error al actualizar usuario:", error);
    res.status(500).json({ error: "Error del servidor al actualizar usuario" });
  }
});

router.delete('/api/usuarios/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await usuariosModel.eliminarUsuarios(id);
    res.status(200).json({ mensaje: "Usuario eliminado con éxito" });
  } catch (error) {
    console.error("Error al eliminar usuario:", error);
    res.status(500).json({ error: "Error del servidor al eliminar usuario" });
  }
});

module.exports = router;