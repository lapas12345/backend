const express = require('express');
const cors = require('cors');
const reportRoutes = require('./src/modules/reports/reportRoutes');
require('dotenv').config();

const app = express();
app.use(cors({ origin: '*' })); 
app.use(express.json());

app.use('/api/reports', reportRoutes);

const PORT = process.env.PORT || 3001;  // Render inyecta process.env.PORT
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor en puerto ${PORT}`);
});

