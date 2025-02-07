var mysql      = require('mysql');
var connection = mysql.createConnection({
      host     : process.env.MYSQL_ADDON_HOST,
      database : process.env.MYSQL_ADDON_DB,
      user     : process.env.MYSQL_ADDON_USER,
      password : process.env.MYSQL_ADDON_PASSWORD
});
PHP
$bdd = new PDO(
      "mysql:host=" . getenv("MYSQL_ADDON_HOST") . ";dbname=" . getenv("MYSQL_ADDON_DB") . ";port=" . getenv("MYSQL_ADDON_PORT"),
      getenv("MYSQL_ADDON_USER"),
      getenv("MYSQL_ADDON_PASSWORD")
);