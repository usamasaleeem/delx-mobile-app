const express = require("express");
const cors = require("cors");
const dotenv=require('dotenv')
var cookieParser = require('cookie-parser')


const app = express();
const dbConnect= require('./dbConnect');
const allowedOrigins = [
  "http://localhost:3000",      // web on same machine
  "http://192.168.1.6:3000",    // web on another device via IP
  "http://192.168.1.6:19000",   // Expo / React Native dev
  "http://192.168.1.6:5000",    // local dashboard if any
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests without origin (mobile APK, Postman)
    if (!origin) return callback(null, true);

    // Allow if origin is in whitelist
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // Otherwise, block
    return callback(new Error("Not allowed by CORS: " + origin));
  },
  credentials: true,
  methods: ["GET","POST","PUT","DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

const sendEmail = require("./utils/sendEmail");
const customerRouter = require("./routes/Customer.router");
const shiftRouter = require("./routes/Shift.router");
const productRouter = require("./routes/Product.router");
const driverRouter = require("./routes/Driver.router");
const vehicleRouter = require("./routes/Vehicle.router");
const compRouter = require("./routes/Comp.router");
const scheduleRouter = require("./routes/Schedule.router");
const TransactionRouter = require("./routes/Transaction.router");

const orderRouter = require("./routes/Order.router");
dbConnect();
dotenv.config();
console.log(cors());

app.use(express.json());

app.use(cookieParser());
app.use(customerRouter);

app.use(productRouter);
app.use(vehicleRouter);
app.use(driverRouter);
app.use(scheduleRouter);
app.use(shiftRouter);
app.use(compRouter);
app.use(TransactionRouter);

app.use(orderRouter);


module.exports = app