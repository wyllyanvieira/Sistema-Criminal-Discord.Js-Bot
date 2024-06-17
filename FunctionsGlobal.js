
const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database('./database.db');

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    text TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
});

function log(type, text) {
  db.run(`INSERT INTO logs (type, text) VALUES (?, ?)`, [type, text], function(err) {
    if (err) {
      return console.error(err.message);
    }
    console.log(`Log salvo: ${type} - ${text}`);
  });
}

function formatarTempo(segundos) {
  const horas = Math.floor(segundos / 3600);
  const minutos = Math.floor((segundos % 3600) / 60);
  const segundosRestantes = segundos % 60;

  return `${horas}h ${minutos}m ${segundosRestantes.toFixed(0)}s`;
}




module.exports = { log , formatarTempo, getConfig, setConfig};
