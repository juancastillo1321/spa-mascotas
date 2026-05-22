const express = require('express'); 
const morgan = require('morgan'); 
const cors = require('cors'); 
const path = require('path');
const usuariosController = require('./controllers/usuariosController'); 

const app = express(); 

const rutaFront = '/vagrant/capasFront'; 

app.use(express.static(rutaFront));
console.log("📂 Usuarios sirviendo front desde:", rutaFront);

// --- MIDDLEWARES ---
app.use(morgan('dev')); 
app.use(cors());
app.use(express.json()); 

// --- RUTAS DE LA API ---
app.use(usuariosController); 
 

const PORT = 3001;
app.listen(PORT, '0.0.0.0', () => { 
  console.log(`🚀 Microservicio de Usuarios corriendo en el puerto ${PORT}`); 
});