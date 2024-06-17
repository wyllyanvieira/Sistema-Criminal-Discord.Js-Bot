const sqlite3 = require("sqlite3");
const config = require("../config.json"); // Substitua pelo caminho real do seu arquivo de configuração
const Discord = require("discord.js");
const client = require("../index");
const FunctionsGlobal = require("../FunctionsGlobal.js");
const db = new sqlite3.Database("./database.db");

/////////////////////////////////////////////////////////////////////////////////
////////////////////////SISTEMA VISUALZIAR LOGS//////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS logs (
    type TEXT,
    text TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  );`);
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isStringSelectMenu()) return;

  if (interaction.customId === "admin_select") {
    if (interaction.values[0] === "logviewer") {
      if (
        !interaction.member.permissions.has(
          Discord.PermissionsBitField.Flags.ManageMessages
        )
      ) {
        return interaction.reply({
          content: `<:icons_Wrong75:1198037616956821515> | Você não possui permissão para utilizar este comando.`,
          ephemeral: true,
        });
      }

      // Enviar menu de seleção de tema
      const themeDropdown = new Discord.StringSelectMenuBuilder()
        .setCustomId("theme_select")
        .setPlaceholder("Selecione o tema dos logs")
        .addOptions([
          { label: "Bate-Ponto", emoji: '🗳️' , value: "ponto" },
          { label: "Administração", emoji: '👑' ,value: "admin" },
          { label: "Baú", emoji: '🗄️' ,value: "bau" },
          { label: "Metas/Farming", emoji: '🎒' ,value: "metas" },
        ]);

      const row = new Discord.ActionRowBuilder().addComponents(themeDropdown);

      await interaction.reply({
        content: "Selecione o tema dos logs que deseja visualizar:",
        components: [row],
        ephemeral: true,
      });
    }
  }

  if (interaction.customId === "theme_select") {
    const theme = interaction.values[0];
    const pageSize = 5;
    let pageIndex = 0;

    const fetchLogs = (callback) => {
      db.all(
        "SELECT * FROM logs WHERE type = ? ORDER BY timestamp DESC LIMIT ? OFFSET ?",
        [theme, pageSize, pageIndex * pageSize],
        (err, rows) => {
          if (err) {
            console.error(err);
            return;
          }
          callback(rows);
        }
      );
    };

    const createLogMessage = (logs) => {
      return (
        logs
          .map((log, index) => `**${index + 1}.** ${log.text} - **${log.timestamp}**`)
          .join("\n") || "## Nenhum log encontrado."
      );
    };

    const createPaginationButtons = (isFirstPage, isLastPage) => {
      return new Discord.ActionRowBuilder().addComponents(
        new Discord.ButtonBuilder()
          .setCustomId("previous_page")
          .setLabel("Anterior")
          .setStyle(Discord.ButtonStyle.Primary)
          .setDisabled(isFirstPage),
        new Discord.ButtonBuilder()
          .setCustomId("next_page")
          .setLabel("Próxima")
          .setStyle(Discord.ButtonStyle.Primary)
          .setDisabled(isLastPage),
        new Discord.ButtonBuilder()
          .setCustomId("clear_logs")
          .setLabel("Limpar Logs")
          .setStyle(Discord.ButtonStyle.Danger)
      );
    };

    fetchLogs(async (logs) => {
      const isLastPage = logs.length < pageSize;
      const logMessage = createLogMessage(logs);
      const buttons = createPaginationButtons(pageIndex === 0, isLastPage);

      await interaction.reply({
        content: `Logs (${theme}):\n${logMessage}`,
        components: [buttons],
        ephemeral: true,
      });

      const filter = (i) => i.user.id === interaction.user.id;
      const collector = interaction.channel.createMessageComponentCollector({
        filter,
        time: 60000,
      });

      collector.on("collect", async (i) => {
        if (i.customId === "previous_page") {
          pageIndex--;
        } else if (i.customId === "next_page") {
          pageIndex++;
        } else if (i.customId === 'clear_logs') {
          db.run("DELETE FROM logs WHERE type = ?", [theme], (err) => {
            if (err) {
              console.error(err);
              return;
            }
          });

          await i.update({
            content: `Todos os logs do tema "${theme}" foram apagados.`,
            components: [],
            ephemeral: true,
          });

          return;
        }

        fetchLogs(async (logs) => {
          const isLastPage = logs.length < pageSize;
          const logMessage = createLogMessage(logs);
          const buttons = createPaginationButtons(pageIndex === 0, isLastPage);

          await i.update({
            content: `Logs (${theme}):\n${logMessage}`,
            components: [buttons],
          });
        });
      });
      
    });
  }
});
