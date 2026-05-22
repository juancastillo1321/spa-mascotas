const express = require('express'); 
const morgan = require('morgan'); 
const cors = require('cors'); 
const path = require('path');
const productosController = require('./controllers/productosController'); 

const app = express(); 

// --- CONFIGURACIÓN DE ARCHIVOS ESTÁTICOS ---
// Usamos la ruta absoluta directa de tu servidor Ubuntu/Vagrant
const rutaFront = '/vagrant/capasFront'; 

app.use(express.static(rutaFront));
console.log("📂 Sirviendo front desde la carpeta original:", rutaFront);

// --- MIDDLEWARES ---
app.use(morgan('dev')); 
app.use(cors());
app.use(express.json()); 

// --- RUTAS DE LA API ---
app.use(productosController); 
 
// --- INICIO DEL SERVIDOR ---
const PORT = 3000;
app.listen(PORT, '0.0.0.0', () => { 
  console.log(`🚀 Microservicio de Productos corriendo en el puerto ${PORT}`); 
});