const Discord = require("discord.js");
const sqlite3 = require("sqlite3");
const FunctionsGlobal = require("../FunctionsGlobal.js");
const db = new sqlite3.Database("database.db");
const config = require("../config.json"); // Use o mesmo nome do banco de dados que você definiu anteriormente
if (config.SISTEMAS.ponto) {
  module.exports = {
    name: "verhoras",
    description:
      "[⚙️ Utilidade] Veja tem que está em patrulha e o tem que você bateu-ponto.",
    type: Discord.ApplicationCommandType.ChatInput,

    run: async (client, interaction) => {
      const idUsuario = interaction.user.id;

      // Obtém os dados do banco de dados para o usuário específico
      db.get(
        "SELECT * FROM usuarios WHERE usuario_id = ?",
        [idUsuario],
        async (err, row) => {
          if (err) {
            console.error(err);
            return interaction.reply({
              content:
                "<:icons_Wrong75:1198037616956821515> | Ocorreu um erro ao buscar os dados.",
              ephemeral: true,
            });
          }

          if (!row) {
            return interaction.reply({
              content:
                "<:icons_Wrong75:1198037616956821515> | Você ainda não bateu ponto após o último reset..",
              ephemeral: true,
            });
          }

          const intervalosArray = JSON.parse(row.intervalos); // Converte a string JSON do banco de dados em um array
          const tempoTotal = intervalosArray.reduce(
            (acc, intervalo) => acc + intervalo,
            0
          );
          const tempoAbertoAtual = row.aberto
            ? (new Date() - new Date(row.aberto)) / 1000
            : 0;

          const tempoAbertoAtualFormatado =
            FunctionsGlobal.formatarTempo(tempoAbertoAtual);
          const tempoTotalFormatado = FunctionsGlobal.formatarTempo(
            tempoTotal + tempoAbertoAtual
          );
          if (tempoAbertoAtual == 0) {
            interaction.reply({
              content: `<:iconscorrect:1198037618361905345> | Você tem registrado em ponto: **${tempoTotalFormatado}**.`,
              ephemeral: true,
            });
          } else {
            interaction.reply({
              content: `<:refresh:1197986033594269778> | Você está com ponto aberto há: ${tempoAbertoAtualFormatado}`,
              ephemeral: true,
            });
          }
        }
      );
    },
  };
}
