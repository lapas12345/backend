const express = require('express');
const cors = require('cors');
const reportRoutes = require('./src/modules/reports/reportRoutes');
require('dotenv').config();

const app = express();
app.use(cors({
  origin: [
    'https://sistema-gestion-academica.vercel.app',  // tu frontend en Vercel
    'http://localhost:5173'                            // para desarrollo local
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
app.use(express.json());

app.use('/api/reports', reportRoutes);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Servidor en puerto ${PORT}`));
