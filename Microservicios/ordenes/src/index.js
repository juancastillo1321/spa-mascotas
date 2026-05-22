const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const path = require('path'); 
const ordenesController = require('./controllers/ordenesController');

const app = express();

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// CAMBIO AQUÍ: Ruta absoluta para que sea igual de sencillo que lo de tu amigo
app.use(express.static('/vagrant/capasFront'));

app.use('/api', ordenesController);

const PORT = 3003;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Microservicio de Ordenes en puerto ${PORT}`);
    console.log(`📂 Sirviendo front desde: /vagrant/capasFront`);
});