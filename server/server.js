const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/auth", require("./routes/authRoutes"));

app.use("/api/spaces", require("./routes/spaceRoutes"));

mongoose.connect(process.env.MONGO_URI).then(()=>{
    console.log("Connected to MongoDB");
    app.listen(process.env.PORT, () => {
        console.log(`Server is running on port ${process.env.PORT}`);
    });
}).catch((err) => {
    console.error("Error connecting to MongoDB:", err);
});

