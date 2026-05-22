const { Router } = require('express');
const router = Router();
const usuariosModel = require('../models/usuariosModel');

// 1. OBTENER UN USUARIO POR ID (¡VITAL PARA EL MICRO 3003!)
// Sin esta ruta, el micro de órdenes siempre dará error al intentar validar al cliente
// Ruta para que el micro 3003 consulte datos del cliente
// Busca esta ruta en tu controlador de usuarios
router.get('/api/usuarios/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🔍 Buscando usuario con ID: ${id}`); // Para debug
    
    // IMPORTANTE: Verifica que tenga la 's' si así está en tu modelo
    const usuario = await usuariosModel.obtenerUsuariosPorId(id); 
    
    if (!usuario) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }
    
    res.status(200).json(usuario);
  } catch (error) {
    console.error("❌ Error en GET /api/usuarios/:id:", error);
    res.status(500).json({ error: "Error interno en el servidor de usuarios" });
  }
});

// 2. LOGIN CORREGIDO (AHORA ENVÍA EL ID)
router.post('/api/usuarios/login', async (req, res) => {
    try {
        const { correo, password } = req.body;
        
        const usuario = await usuariosModel.validar_password(correo, password);

        if (!usuario) {
            return res.status(401).json({ error: "Correo o contraseña incorrectos" });
        }

        // Lógica de redirección
        let destino = 'ver_productos.html'; 
        if (usuario.rol === 'admin') {
            destino = 'admin_gestion.html';
        }

        // --- CAMBIO CRÍTICO AQUÍ ---
        // Debemos enviar usuario.id (o como se llame en tu DB, ej: id_usuario)
        res.status(200).json({
            mensaje: "¡Bienvenido!",
            id: usuario.id || usuario.id_usuario, // <--- ESTO ES LO QUE FALTABA
            rol: usuario.rol,
            nombre: usuario.nombres,
            correo: correo,
            redireccionarA: destino
        });

    } catch (error) {
        console.error("Error en el proceso de login:", error);
        res.status(500).json({ error: "Hubo un fallo en el servidor de usuarios" });
    }
});



router.get('/api/usuarios', async (req, res) => {
  try {
    const usuarios = await usuariosModel.obtenerUsuarios();
    res.status(200).json(usuarios);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener usuarios" });
  }
});

router.post('/api/usuarios/registrar', async (req, res) => {
    try {
        const { nombres, apellidos, password, cedula, correo, telefono, direccion, rol } = req.body;
        
        // Si 'rol' no existe en req.body, se vuelve 'cliente' automáticamente
        const rolFinal = rol || 'cliente';

        console.log("Intentando registrar a:", correo, "con rol:", rolFinal);

        // IMPORTANTE: Agregamos rolFinal al llamar al modelo
        await usuariosModel.crearUsuarios(
            nombres, 
            apellidos, 
            password, 
            cedula, 
            correo, 
            telefono, 
            direccion, 
            rolFinal
        );
        
        res.status(201).json({ mensaje: "Usuario registrado con éxito" });
    } catch (error) {
        console.error("¡ERROR CRÍTICO EN MYSQL!");
        console.error("Mensaje:", error.message);
        res.status(500).json({ error: "Fallo en el registro", detalle: error.message });
    }
});
// Busca donde esté tu ruta PUT y déjala así:
router.put('/api/usuarios/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { nombres, apellidos, cedula, correo, telefono, direccion, rol } = req.body;

        // Esto imprimirá en la consola lo que el HTML está mandando
        console.log(">>> DATOS RECIBIDOS DEL FRONT:", req.body);

        await usuariosModel.editarUsuario(id, nombres, apellidos, cedula, correo, telefono, direccion, rol || 'cliente');
        
        res.json({ mensaje: "Usuario actualizado correctamente" });
    } catch (error) {
        // ESTO ES LO QUE TIENES QUE PEGAR:
        console.log("**************** ERROR DETECTADO ****************");
        console.log("Mensaje de MySQL:", error.message);
        console.log("Código de error:", error.code);
        console.log("*************************************************");
        
        res.status(500).json({ error: "Fallo en el servidor", detalle: error.message });
    }
});

router.delete('/api/usuarios/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await usuariosModel.eliminarUsuarios(id);
    res.status(200).json({ mensaje: "Eliminado" });
  } catch (error) {
    res.status(500).json({ error: "Error al eliminar" });
  }
});

module.exports = router;