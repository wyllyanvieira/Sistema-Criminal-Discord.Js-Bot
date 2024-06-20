const Discord = require("discord.js");
const sqlite3 = require("sqlite3");
const db = new sqlite3.Database("./database.db");
const config = require("../config.json");
const FunctionsGlobal = require("../FunctionsGlobal.js");
const { ChartJSNodeCanvas } = require("chartjs-node-canvas");

const width = 1280; // largura do gráfico
const height = 720; // altura do gráfico
const backgroundColour = "white"; // Uses https://www.w3schools.com/tags/canvas_fillstyle.asp
const chartJSNodeCanvas = new ChartJSNodeCanvas({
  width,
  height,
  backgroundColour,
});

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
    {
      name: "misto",
      description:
        "Veja o ranking das pessoas com mais desempenho dentro da organização.",
      type: Discord.ApplicationCommandOptionType.Subcommand,
    },
  ],

  run: async (client, interaction) => {
    await interaction.reply({
      content: "O ranking está sendo processado. Por favor, aguarde...",
      ephemeral: true,
    });

    if (interaction.options.getSubcommand() === "farm") {
      db.all(`SELECT usuario_id, metas FROM usuarios`, async (err, rows) => {
        if (err) {
          return interaction.editReply({
            content: "Erro ao obter ranking.",
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

        // Ordenar para que os usuários com mais farms apareçam primeiro
        ranking.sort((a, b) => b.totalFarm - a.totalFarm);

        var d = new Date();
        let response = `# Ranking de Farms/Metas: \n- Solicitado por: ${interaction.user} \n- Data: ${d} \n\n`;

        for (let i = 0; i < ranking.length; i++) {
          const user = ranking[i];
          try {
            const member = await interaction.guild.members.fetch(
              user.usuario_id
            );
            if (member) {
              const username = member.displayName;

              let emoji = "";
              if (i === 0) emoji = "`🥇` ";
              else if (i === 1) emoji = "`🥈` ";
              else if (i === 2) emoji = "`🥉` ";
              else emoji = "`🎖️` ";

              response += `${emoji}${username}: ${user.totalFarm} farms realizados\n`;
            } else {
              response += `ID: ${user.usuario_id} - ${user.totalFarm} farms realizados\n`;
            }
          } catch (error) {
            console.error(error);
          }
        }

        const rankingData = ranking.map((user) => ({
          nome: user.usuario_id,
          valor: user.totalFarm,
        }));

        setTimeout(() => {
          createAndSendChart(interaction, response, rankingData);
        }, 1000);
      });
    } else if (interaction.options.getSubcommand() === "ponto") {
      function calcularRanking(rows) {
        const ranking = rows.map((row) => {
          const intervalosArray = row.intervalos
            ? JSON.parse(row.intervalos)
            : [];
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
            const membro = await interaction.guild.members.fetch(
              user.idUsuario
            );
            if (membro) {
              const nomeUsuario = membro.displayName;
              const tempoFormatado = FunctionsGlobal.formatarTempo(
                user.tempoTotal
              );

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

        const rankingData = ranking.map((user) => ({
          nome: user.idUsuario,
          valor: user.tempoTotal,
        }));

        setTimeout(() => {
          createAndSendChart(interaction, resposta, rankingData);
        }, 1000);
      });
    } else if (interaction.options.getSubcommand() === "misto") {
      db.all(
        `SELECT usuario_id, metas, intervalos FROM usuarios`,
        async (err, rows) => {
          if (err) {
            return interaction.editReply({
              content: "Erro ao obter ranking misto.",
            });
          }

          const farmData = rows.map((row) => {
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

          const pontoData = rows.map((row) => {
            const intervalosArray = row.intervalos
              ? JSON.parse(row.intervalos)
              : [];
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

          farmData.sort((a, b) => b.totalFarm - a.totalFarm);
          pontoData.sort((a, b) => b.tempoTotal - a.tempoTotal);

          var d = new Date();
          let resposta = `# Ranking Misto (Farm e Tempo de Ponto): \n- Solicitado por: ${interaction.user} \n- Data: ${d} \n\n`;

          for (
            let i = 0;
            i < Math.min(farmData.length, pontoData.length, 5);
            i++
          ) {
            const farmUser = farmData[i];
            const pontoUser = pontoData[i];
            try {
              const memberFarm = await interaction.guild.members.fetch(
                farmUser.usuario_id
              );
              const memberPonto = await interaction.guild.members.fetch(
                pontoUser.idUsuario
              );

              const nomeFarm = memberFarm
                ? memberFarm.displayName
                : `ID: ${farmUser.usuario_id}`;
              const nomePonto = memberPonto
                ? memberPonto.displayName
                : `ID: ${pontoUser.idUsuario}`;

              let emoji = "";
              if (i === 0) emoji = "`🥇` ";
              else if (i === 1) emoji = "`🥈` ";
              else if (i === 2) emoji = "`🥉` ";
              else emoji = "`🎖️` ";

              resposta += `${emoji}${nomeFarm}: ${FunctionsGlobal.formatarTempo(
                pontoUser.tempoTotal
              )} | ${farmUser.totalFarm} farms realizados\n`;
            } catch (error) {
              console.error(error);
            }
          }

          const farmRankingData = farmData.map((user) => ({
            nome: user.usuario_id,
            valor: user.totalFarm,
          }));
          const pontoRankingData = pontoData.map((user) => ({
            nome: user.idUsuario,
            valor: user.tempoTotal,
          }));

          setTimeout(() => {
            createAndSendMultiAxisChart(
              interaction,
              resposta,
              farmRankingData,
              pontoRankingData
            );
          }, 1000);
        }
      );
    }
  },
};

async function createAndSendChart(interaction, response, rankingData) {
  rankingData.sort((a, b) => b.valor - a.valor);

  const labels = await Promise.all(
    rankingData.map((data) => getDisplayNameDiscord(data.nome, interaction))
  );
  const data = rankingData.map((data) => data.valor);

  const configuration = {
    type: "pie",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Ranking",
          data: data,
          backgroundColor: labels.map(
            (_, i) => `hsl(${i * (360 / labels.length)}, 100%, 50%)`
          ),
        },
      ],
    },
    options: {
      plugins: {
        legend: {
          display: true,
          position: "right",
        },
      },
    },
  };

  const buffer = await chartJSNodeCanvas.renderToBuffer(configuration);
  const attachment = new Discord.AttachmentBuilder(buffer, {
    name: "grafico.png",
  });

  await interaction.channel.send({ content: response, files: [attachment] });
}

async function createAndSendMultiAxisChart(
  interaction,
  response,
  farmData,
  pontoData
) {
  const labels = farmData.map((user) => user.nome); // Usaremos os nomes dos usuários como labels
  const farmValues = farmData.map((user) => user.valor);
  const pontoValues = pontoData.map((user) => user.valor);

  const configuration = {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Farm",
          yAxisID: "farm",
          data: farmValues,
          borderColor: "rgba(255, 99, 132, 1)",
          backgroundColor: "rgba(255, 99, 132, 0.2)",
          borderWidth: 1,
          fill: false,
        },
        {
          label: "Tempo de Ponto",
          yAxisID: "ponto",
          data: pontoValues,
          borderColor: "rgba(54, 162, 235, 1)",
          backgroundColor: "rgba(54, 162, 235, 0.2)",
          borderWidth: 1,
          fill: false,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: "Ranking Misto (Farm e Tempo de Ponto)",
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: "Tempo de Ponto",
          },
        },
        farm: {
          position: "right",
          title: {
            display: true,
            text: "Farm",
          },
          grid: {
            drawOnChartArea: false,
          },
        },
      },
    },
  };

  const buffer = await chartJSNodeCanvas.renderToBuffer(configuration);
  const attachment = new Discord.AttachmentBuilder(buffer, {
    name: "grafico.png",
  });

  await interaction.channel.send({ content: response, files: [attachment] });
}

// Função para converter ${rankingData[i].nome} em DisplayNameDiscord
async function getDisplayNameDiscord(userId, interaction) {
  try {
    const user = await interaction.guild.members.fetch(userId);
    return user.displayName;
  } catch (error) {
    console.error(
      `Erro ao obter o DisplayNameDiscord para o usuário ${userId}:`,
      error
    );
    return userId; // Caso haja erro, retorna o ID do usuário como fallback
  }
}
