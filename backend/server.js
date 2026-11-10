const express = require('express');
const path = require('path');
const productRoutes = require('./routes/productRoutes');
const authRoutes = require('./routes/authRoutes');

const app = express();
const port = process.env.PORT || 3000;
const frontendPath = path.join(__dirname, '..', 'frontend');

app.use(express.json());
app.use(express.static(path.join(frontendPath, 'public')));
app.use('/public', express.static(path.join(frontendPath, 'public')));
app.use('/views', express.static(path.join(frontendPath, 'views')));
app.use('/api/products', productRoutes);
app.use('/api/auth', authRoutes);
app.get('/', (req, res) => res.sendFile(path.join(frontendPath, 'views', 'index.html')));

app.listen(port, () => console.log(`Integrain is running at http://localhost:${port}`));
