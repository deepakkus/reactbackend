var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var mongoose = require("mongoose");
var cors = require('cors');

require('dotenv').config();

var indexRouter = require('./routes/index');

var app = express();
 
mongoose.connect(process.env.MONGOURL,
    {
        useUnifiedTopology: true,
        useNewUrlParser: true,
        useCreateIndex: true,
        useFindAndModify: false
    })
    .then(() => {
        console.log('Database connected');
    })
    .catch((error) => {
        console.log('Error connecting to database');
    });

app.use(cors());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads',express.static(path.join(__dirname, 'uploads')));


const splite = (items, splite_data) => {
    var scanResults = {};
    Object.keys(items).forEach(async function (index) {
        if (splite_data != index) {
            scanResults[index] = items[index];
        }
    });
    return scanResults;
};
app.use((req, res, next) => {
    req.splite = splite;
    next();
})

app.use('/', indexRouter);
  

app.use((req, res, next) => {
    res.sendFile(path.join(__dirname, "client/build/index.html"));
});
// Your code
if (process.env.NODE_ENV === "production") {
    const path = require("path");
    app.use(express.static(path.resolve(__dirname, 'client/build')));
    app.get("*", (req, res) => {
        res.sendFile(path.resolve(__dirname, 'client/index.html'),function (err) {
            if(err) {
                res.status(500).send(err)
            }
        });
    })
}
// Your code


app.listen(8090, () => {
  console.log("Server is running on port 8090.");
});

module.exports = app;
