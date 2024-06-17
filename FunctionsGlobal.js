
const sqlite3 = require("sqlite3").verbose();

// Conectar ao banco de dados SQLite3
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

// Função para pegar o valor da configuração pelo tipo
function getConfig(type) {
  try {
      const row = db.prepare('SELECT value FROM config WHERE type = ?').get(type);
      if (row) {
          return row.value;
      } else {
          return null;
      }
  } catch (err) {
      console.error(err.message);
      return null;
  }
}

// Função para definir o valor da configuração pelo tipo
function setConfig(type, value) {
  try {
      const row = db.prepare('SELECT id FROM config WHERE type = ?').get(type);
      if (row) {
          // Se existir, atualizar
          db.prepare('UPDATE config SET value = ? WHERE type = ?').run(value, type);
      } else {
          // Se não existir, inserir
          db.prepare('INSERT INTO config (type, value) VALUES (?, ?)').run(type, value);
      }
      return true;
  } catch (err) {
      console.error(err.message);
      return false;
  }
}


module.exports = { log , formatarTempo, getConfig, setConfig};
