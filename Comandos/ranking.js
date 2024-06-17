const Discord = require("discord.js");
const sqlite3 = require("sqlite3");
const db = new sqlite3.Database("./database.db");
const config = require("../config.json");
const FunctionsGlobal = require("../FunctionsGlobal.js");

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
      // Consulta ao banco de dados para obter os usuários e suas metas
      db.all(`SELECT usuario_id, metas FROM usuarios`, [], (err, rows) => {
        if (err) {
          return interaction.reply({
            content: "Erro ao obter ranking.",
            ephemeral: true,
          });
        }

        // Processar os dados para calcular a quantidade total de farms restantes para cada usuário
        console.log(rows);
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

        // Ordenar os usuários pelo total de farms restantes (do menor para o maior)
        ranking.sort((a, b) => a.totalFarm - b.totalFarm);

        // Criar a mensagem de resposta com o ranking
        var d = new Date();
        let response = `# Ranking de Farms/Metas: \n- Solicitado por: ${interaction.user} \n- Data: ${d} \n\n`;
        ranking.forEach((user, index) => {
          const member = interaction.guild.members.cache.get(user.usuario_id);
          const username = member ? member.user.tag : `ID: ${user.usuario_id}`;
          response += `${index + 1}. ${username} - ${
            user.totalFarm
          } farms restantes\n`;
        });

        // Enviar a resposta
        interaction.reply({ content: response, ephemeral: false });
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

      // Obtém os dados do banco de dados
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

            // Verifica se o membro existe antes de adicionar à resposta
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
        interaction.channel.send({ content: resposta });
      });
    }
  },
};
