const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Routes
const videoRoutes = require('./routes/videoRoutes');
app.use('/api/videos', videoRoutes);

app.get('/', (req, res) => {
    res.send('UniScript Backend is running');
});

// Routes will be added here

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
