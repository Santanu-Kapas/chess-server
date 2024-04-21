const pg =require("pg");
require('dotenv').config();

const db = new pg.Client({
  connectionString:process.env.DB_connecionString,
});
console.log("db connects sucessfully!");
module.exports=db;