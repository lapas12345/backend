const express = require('express');
const cors = require('cors');
const reportRoutes = require('./src/modules/reports/reportRoutes');
const vinculacionRoutes = require('./src/modules/vinculacion/vinculacionRoutes');
require('dotenv').config();

const app = express();
app.use(cors({ origin: '*' })); 
// Los informes de vinculacion reciben imagenes en base64 para insertarlas en el PDF final.
// El limite evita el valor por defecto de Express, que seria demasiado pequeno para evidencias.
app.use(express.json({ limit: '50mb' }));

app.use('/api/reports', reportRoutes);
app.use('/api/vinculacion', vinculacionRoutes);

const PORT = process.env.PORT || 3001;  // Render inyecta process.env.PORT
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor en puerto ${PORT}`);
});
