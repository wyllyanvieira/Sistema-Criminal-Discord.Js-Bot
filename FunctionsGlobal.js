const sqlite3 = require("sqlite3");
const config = require("./config.json");
const Discord = require("discord.js");
const client = require("./index");
const db = new sqlite3.Database("./database.db");

function log(type, text) {
  let channelId;
  switch (type) {
    case 'ponto':
      channelId = config.LOGS.Canal_log_ponto;
      break;
    case 'metas':
      channelId = config.LOGS.Canal_log_metas;
      break;
    case 'bau':
      channelId = config.LOGS.Canal_log_bau;
      break;
    default:
      console.error(`Tipo de log desconhecido: ${type}`);
      return;
  }

  // Verifica se o canal está configurado
  if (!channelId) {
    console.error(`Canal de log não configurado para o tipo: ${type}`);
    return;
  }
  
  // Fetch the channel and send the message
  client.channels.fetch(channelId)
    .then(channel => {
      if (channel) {
        channel.send(text).catch(err => {
          console.error(`Erro ao enviar mensagem no canal: ${err}`);
        });
      } else {
        console.error(`Canal não encontrado: ${channelId}`);
      }
    })
    .catch(err => {
      console.error(`Erro ao buscar o canal: ${err}`);
    });
}


function formatarTempo(segundos) {
  const horas = Math.floor(segundos / 3600);
  const minutos = Math.floor((segundos % 3600) / 60);
  const segundosRestantes = segundos % 60;

  return `${horas}h ${minutos}m ${segundosRestantes.toFixed(0)}s`;
}




module.exports = { log , formatarTempo};
