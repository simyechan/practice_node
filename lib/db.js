const mysql = require('mysql2');
require("dotenv").config({path: '.env'});
const db = mysql.createConnection({
    host:process.env.HOST,
    user:process.env.USERNAME,
    password:process.env.PASSWORD,
    database:process.env.DATABASE
});
db.connect();
module.exports = db;