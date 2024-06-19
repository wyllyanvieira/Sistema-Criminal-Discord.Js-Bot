const Discord = require("discord.js");
const sqlite3 = require("sqlite3");
const db = new sqlite3.Database("./database.db");
const config = require("../config.json");
const FunctionsGlobal = require("../FunctionsGlobal.js");
const { createCanvas } = require('canvas');

module.exports = {
  name: "ranking",
  description: "[⚙️ Utilidade] Veja o Ranking dos respectivos setores.",
  type: Discord.ApplicationCommandType.ChatInput,
  options: [
    {
      name: "farm",
      description: "Veja o ranking das pessoas com menos farm.",
      type: Discord.ApplicationCommandOptionType.Subcommand,
    },
    {
      name: "ponto",
      description: "Veja o ranking das pessoas com mais tempo de ponto.",
      type: Discord.ApplicationCommandOptionType.Subcommand,
    },
  ],

  run: async (client, interaction) => {
    if (interaction.options.getSubcommand() === "farm") {
      db.all(`SELECT usuario_id, metas FROM usuarios`, async (err, rows) => {
        if (err) {
          return interaction.reply({
            content: "Erro ao obter ranking.",
            ephemeral: true,
          });
        }

        const ranking = rows.map((row) => {
          const metas = JSON.parse(row.metas);
          const totalFarm = metas.reduce(
            (total, meta) => total + meta.quantidade,
            0
          );
          return {
            usuario_id: row.usuario_id,
            totalFarm,
          };
        });

        ranking.sort((a, b) => a.totalFarm - b.totalFarm);

        var d = new Date();
        let response = `# Ranking de Farms/Metas: \n- Solicitado por: ${interaction.user} \n- Data: ${d} \n\n`;

        for (let i = 0; i < ranking.length; i++) {
          const user = ranking[i];
          try {
            const member = await interaction.guild.members.fetch(user.usuario_id);
            if (member) {
              const username = member.displayName;

              let emoji = "";
              if (i === 0) emoji = "`🥇` ";
              else if (i === 1) emoji = "`🥈` ";
              else if (i === 2) emoji = "`🥉` ";
              else emoji = "`🎖️` ";

              response += `${emoji}${username}: ${user.totalFarm} farms restantes\n`;
            } else {
              response += `ID: ${user.usuario_id} - ${user.totalFarm} farms restantes\n`;
            }
          } catch (error) {
            console.error(error);
          }
        }

        await interaction.reply(response);
      });
    } else if (interaction.options.getSubcommand() === "ponto") {
      function calcularRanking(rows) {
        const ranking = rows.map((row) => {
          const intervalosArray = row.intervalos ? JSON.parse(row.intervalos) : [];
          const tempoTotal = intervalosArray.reduce(
            (acc, intervalo) => acc + intervalo,
            0
          );
          const tempoAbertoAtual = row.aberto
            ? (new Date() - new Date(row.aberto)) / 1000
            : 0;
          return {
            idUsuario: row.usuario_id,
            tempoTotal: tempoTotal + tempoAbertoAtual,
          };
        });

        ranking.sort((a, b) => b.tempoTotal - a.tempoTotal);

        return ranking;
      }

      db.all("SELECT * FROM usuarios", async (err, rows) => {
        if (err) {
          console.error(err);
          return;
        }
        const ranking = calcularRanking(rows);
        var d = new Date();
        let resposta = `# Ranking de Tempo de Ponto: \n- Solicitado por: ${interaction.user} \n- Data: ${d} \n\n`;

        for (let i = 0; i < ranking.length; i++) {
          const user = ranking[i];
          try {
            const membro = await interaction.guild.members.fetch(user.idUsuario);
            if (membro) {
              const nomeUsuario = membro.displayName;
              const tempoFormatado = FunctionsGlobal.formatarTempo(user.tempoTotal);

              let emoji = "";
              if (i === 0) emoji = "`🥇` ";
              else if (i === 1) emoji = "`🥈` ";
              else if (i === 2) emoji = "`🥉` ";
              else if (i >= 2) emoji = "`🎖️` ";

              resposta += `${emoji}${nomeUsuario}: ${tempoFormatado}\n`;
            }
          } catch (error) {
            console.error(error);
          }
        }

        const rankingData = ranking.map(user => ({ nome: user.idUsuario, valor: user.tempoTotal }));
        createAndSendChart(interaction, resposta, rankingData);
      });
    }
  },
};

async function createAndSendChart(interaction, response, rankingData) {
  rankingData.sort((a, b) => b.valor - a.valor);

  const canvas = createCanvas(1920, 1080);
  const ctx = canvas.getContext('2d');
  ctx.font = '32px Arial';  // Adjust font size as per your requirement
  let total = rankingData.reduce((total, item) => total + item.valor, 0);

  // Ajuste da posição da legenda externa para evitar cortes
  const legendX = 50;
  let legendY = 300

  // Convertendo ${rankingData[i].nome} em DisplayNameDiscord
  for (let i = 0; i < Math.min(5, rankingData.length); i++) {
    // Aqui você deve ter uma função ou método para converter o nome em DisplayNameDiscord
    let displayName = await getDisplayNameDiscord(rankingData[i].nome, interaction);
    
    ctx.fillStyle = `hsl(${i * (360 / rankingData.length)}, 100%, 50%)`;
    ctx.fillRect(1450, legendY, 20, 20);
    ctx.fillStyle = '#fff';
    ctx.fillText(`${displayName} | ${FunctionsGlobal.formatarTempo(rankingData[i].valor)}`, 1480, legendY + 20);
    
    legendY += 40; // Incrementa o valor de Y para a próxima linha da legenda
  }

  let anguloAtual = 0;
  for (let i = 0; i < rankingData.length; i++) {
    let angulo = anguloAtual + (Math.PI * 2 * (rankingData[i].valor / total)) / 2;
    let raio = 400;

    ctx.beginPath();
    ctx.arc(960, 540, raio, anguloAtual, anguloAtual + (Math.PI * 2 * (rankingData[i].valor / total)), false);
    ctx.lineTo(960, 540);
    ctx.fillStyle = `hsl(${i * (360 / rankingData.length)}, 100%, 50%)`;
    ctx.fill();

    // Convertendo ${rankingData[i].nome} em DisplayNameDiscord para o gráfico
    let displayName = await getDisplayNameDiscord(rankingData[i].nome, interaction);

    let texto = `${displayName} | ${FunctionsGlobal.formatarTempo(rankingData[i].valor)}`;
    let x = 960 + raio * 0.8 * Math.cos(angulo);
    let y = 540 + raio * 0.8 * Math.sin(angulo);
    ctx.fillStyle = '#000';
    ctx.fillText(texto, x, y);

    anguloAtual += Math.PI * 2 * (rankingData[i].valor / total);
  }

  const buffer = canvas.toBuffer('image/png');
  const attachment = new Discord.AttachmentBuilder(buffer, {name:'grafico.png'});

  await interaction.channel.send({ content: response, files: [attachment] });
}

// Função para converter ${rankingData[i].nome} em DisplayNameDiscord
async function getDisplayNameDiscord(userId, interaction) {
  try {
    const user = await interaction.guild.members.fetch(userId);
    return user.displayName;
  } catch (error) {
    console.error(`Erro ao obter o DisplayNameDiscord para o usuário ${userId}:`, error);
    return userId; // Caso haja erro, retorna o ID do usuário como fallback
  }
}


