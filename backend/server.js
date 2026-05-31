const express = require('express');
const cors = require('cors');
const reportRoutes = require('./src/modules/reports/reportRoutes');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/reports', reportRoutes);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Servidor en puerto ${PORT}`));