const sqlite3 = require("sqlite3");
const config = require("../config.json"); // Substitua pelo caminho real do seu arquivo de configuração
const Discord = require("discord.js");
const client = require("../index");
const FunctionsGlobal = require("../FunctionsGlobal.js");
const db = new sqlite3.Database("./database.db");

/////////////////////////////////////////////////////////////////////////////////
////////////////////////SISTEMA DE ABRIR E FECHAR PONTO//////////////////////////
/////////////////////////////////////////////////////////////////////////////////
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS usuarios (
    usuario_id TEXT PRIMARY KEY,
    aberto INTEGER,
    intervalos TEXT,
    metas TEXT
  );`);
});

function fecharPonto(row, idUsuario, interaction, client, db) {
  db.get(
    "SELECT * FROM usuarios WHERE usuario_id = ?",
    [idUsuario],
    async (err, row) => {
      if (err) {
        console.error(err);
        return;
      }

      if (row.aberto) {
        const fechado = new Date();
        const aberto = new Date(row.aberto);
        const intervalo = (fechado - aberto) / 1000;

        let novosIntervalos = []; // Inicialize novosIntervalos como um array vazio

        // Se row.intervalos não for null, faça o parse do JSON
        if (row.intervalos) {
          novosIntervalos = JSON.parse(row.intervalos);
        }

        novosIntervalos.push(intervalo);

        db.run(
          "UPDATE usuarios SET aberto = NULL, intervalos = ? WHERE usuario_id = ?",
          [JSON.stringify(novosIntervalos), idUsuario],
          (err) => {
            if (err) console.error(err);
          }
        );

        await interaction.reply({
          content: `> 🙋 | Ponto fechado! Intervalo: ${FunctionsGlobal.formatarTempo(
            intervalo
          )}`,
          ephemeral: true,
        });
        FunctionsGlobal.log(
          `ponto`,
          ` Ponto do usuário ${
            interaction.user
          } fechado com ${FunctionsGlobal.formatarTempo(intervalo)}.`
        );
      } else {
        await interaction.reply({
          content:
            "> <:icons_Wrong75:1198037616956821515> | Você não tem um ponto aberto.",
          ephemeral: true,
        });
      }
    }
  );
}

client.on("interactionCreate", async (interaction) => {
  const idUsuario = interaction.user.id;
  if (!interaction.isButton()) return;

  if (interaction.customId === "abrir_ponto") {

    db.get(
      "SELECT * FROM usuarios WHERE usuario_id = ?",
      [idUsuario],
      async (err, row) => {
        if (err) {
          console.error(err);
          return;
        }

        if (!row) {
          // Se o usuário não estiver no banco de dados, adiciona ele
          db.run(
            "INSERT INTO usuarios (usuario_id, aberto, intervalos, metas) VALUES (?, ?, ?, ?)",
            [idUsuario, null, "[]", null],
            (err) => {
              if (err) {
                console.error(err);
                return;
              }
            }
          );
        }
        if (row && row.aberto) {
          interaction.reply({
            content:
              "> <:icons_Wrong75:1198037616956821515> | Você já tem um ponto aberto.",
            ephemeral: true,
          });
          return;
        }

        // Atualiza o campo 'aberto' no banco de dados
        db.run(
          "UPDATE usuarios SET aberto = ? WHERE usuario_id = ?",
          [Date.now(), idUsuario],
          (err) => {
            if (err) console.error(err);
          }
        );

        await interaction.reply({
          content: "<:iconscorrect:1198037618361905345> | Ponto aberto!",
          ephemeral: true,
        });
        FunctionsGlobal.log(
          `ponto`,
          `Ponto do usuário ${interaction.user} aberto.`
        );
      }
    );
  }
  if (interaction.customId === "fechar_ponto") {
    db.get(
      "SELECT * FROM usuarios WHERE usuario_id = ?",
      [idUsuario],
      async (err, row) => {
        if (err) {
          console.error(err);
          return;
        }
        fecharPonto(row, idUsuario, interaction, client, db);
      }
    );
  }
});

/////////////////////////////////////////////////////////////////////////////////
////////////////////////SISTEMA DE FECHAR POTNO ADMIN////////////////////////////
/////////////////////////////////////////////////////////////////////////////////
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isStringSelectMenu()) return;
  if (interaction.customId === "admin_select") {
    if (interaction.values[0] === "fechar_ponto_admin") {
      console.log("foi");
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
      // Buscar usuários com ponto aberto
      db.all(
        "SELECT * FROM usuarios WHERE aberto IS NOT NULL",
        async (err, rows) => {
          if (err) {
            console.error(err);
            return;
          }

          if (rows.length === 0) {
            await interaction.reply({
              content:
                "> <:guide:1197986076984365147> | Nenhum ponto aberto no momento.",
              ephemeral: true,
            });
            return;
          }

          // Criar array de opções para o dropdown
          const options = await Promise.all(
            rows.map(async (row) => {
              try {
                const member = await interaction.guild.members.fetch(
                  row.usuario_id
                );

                return {
                  label: member.displayName || member.user.username,
                  value: row.usuario_id,
                };
              } catch (error) {
                console.error(
                  `Erro ao buscar membro ${row.usuario_id}: ${error.message}`
                );
                return {
                  label: "Usuário não encontrado",
                  value: row.usuario_id,
                };
              }
            })
          );

          console.log(options);

          const dropdown = new Discord.StringSelectMenuBuilder()
            .setCustomId("fechar_ponto_dropdown")
            .setPlaceholder("Selecione o usuário para fechar o ponto")
            .addOptions(options);

          const row = new Discord.ActionRowBuilder().addComponents(dropdown);

          await interaction.reply({
            content: "Selecione o usuário para fechar o ponto:",
            components: [row],
            ephemeral: true,
          });
        }
      );
    }
  }
  if (interaction.customId === "fechar_ponto_dropdown") {
    const idUsuario = interaction.values[0];
    db.get(
      "SELECT * FROM usuarios WHERE usuario_id = ?",
      [idUsuario],
      async (err, row) => {
        if (err) {
          console.error(err);
          return;
        }

        if (row && row.aberto) {
          const fechado = new Date();
          const aberto = new Date(row.aberto);
          const intervalo = (fechado - aberto) / 1000;

          // Atualiza o banco de dados com o intervalo
          const novosIntervalos = JSON.parse(row.intervalos);
          novosIntervalos.push(intervalo);

          db.run(
            "UPDATE usuarios SET aberto = NULL, intervalos = ? WHERE usuario_id = ?",
            [JSON.stringify(novosIntervalos), idUsuario],
            (err) => {
              if (err) console.error(err);
            }
          );

          await interaction.reply({
            content: `> <:delete:1197986063554187284> | Ponto fechado de maneira forçada! Intervalo desde a abertura de ${FunctionsGlobal.formatarTempo(
              intervalo
            )}`,
            ephemeral: true,
          });
          FunctionsGlobal.log(
            `ponto`,
            `Ponto do usuário <@${idUsuario}> fechado de maneira forçada por ${
              interaction.user
            } com intervalo desde sua abertura de ${FunctionsGlobal.formatarTempo(
              intervalo
            )}.`
          );
        } else {
          await interaction.reply({
            content:
              "> <:icons_Wrong75:1198037616956821515> | Você não tem um ponto aberto.",
            ephemeral: true,
          });
        }
      }
    );
  }
});
