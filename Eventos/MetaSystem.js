const sqlite3 = require("sqlite3");
const Discord = require("discord.js");
const { Modal, TextInputComponent, showModal } = require("discord-modals");
const client = require("../index");
const db = new sqlite3.Database("./database.db");
const config = require("../config.json");
const FunctionsGlobal = require("../FunctionsGlobal.js");

require("discord-modals")(client);

// Configurar o banco de dados
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS usuarios (
    usuario_id TEXT PRIMARY KEY,
    aberto INTEGER,
    intervalos TEXT,
    metas TEXT
  );`);
});

// Função para inicializar as metas no banco de dados
function initializeMetas(usuario_id, callback) {
  const metas = config.METAS_FARM.metaglobal.map(meta => ({
    item: meta.item,
    quantidade: 0
  }));
  db.run(
    `INSERT OR REPLACE INTO usuarios (usuario_id, metas) VALUES (?, ?)`,
    [usuario_id, JSON.stringify(metas)],
    callback
  );
}


// Função para enviar as metas e atualizar o banco de dados
function updateMetas(usuario_id, items, callback) {
  db.get(
    `SELECT metas FROM usuarios WHERE usuario_id = ?`,
    [usuario_id],
    (err, row) => {
      if (err) return callback(err);

      if (!row || !row.metas) {
        initializeMetas(usuario_id, (err) => {
          if (err) return callback(err);
          updateMetas(usuario_id, items, callback);
        });
      } else {
        let metas = JSON.parse(row.metas);

        items.forEach(({ item, quantidade }) => {
          let meta = metas.find((meta) => meta.item === item);
          if (meta) {
            meta.quantidade += quantidade;
          } else {
            metas.push({ item, quantidade });
          }
        });

        db.run(
          `UPDATE usuarios SET metas = ? WHERE usuario_id = ?`,
          [JSON.stringify(metas), usuario_id],
          callback
        );
      }
    }
  );
}


client.on("interactionCreate", async (interaction) => {
  const usuario_id = interaction.user.id;
  if (interaction.isButton()) {
    if (interaction.customId === "send_meta") {
      // Exibir modal para o usuário enviar as metas
      const modal = new Modal()
        .setCustomId("send_meta_modal")
        .setTitle("Enviar Metas")
        .addComponents(
          new TextInputComponent()
            .setCustomId("meta_items")
            .setLabel('Itens e Quantidades (ex: "3 pistola, 2 m4")')
            .setStyle("LONG"),
          new TextInputComponent()
            .setCustomId("meta_proof")
            .setLabel("Link de Comprovação")
            .setStyle("SHORT")
        );

      showModal(modal, {
        client: client,
        interaction: interaction,
      });
    }

    if (interaction.customId === "check_metas") {
      db.get(
        `SELECT metas FROM usuarios WHERE usuario_id = ?`,
        [usuario_id],
        (err, row) => {
          if (err) {
            return interaction.reply({
              content: "Erro ao verificar metas.",
              ephemeral: true,
            });
          }
    
          if (!row || !row.metas) {
            initializeMetas(usuario_id, (err) => {
              if (err) {
                return interaction.reply({
                  content: "Erro ao inicializar metas.",
                  ephemeral: true,
                });
              }
    
              return interaction.reply({
                content: "Metas inicializadas!",
                ephemeral: true,
              });
            });
          } else {
            const metas = JSON.parse(row.metas);
            const globalMetas = config.METAS_FARM.metaglobal;
            
    
            let response = "Suas metas:\n";
            globalMetas.forEach((globalMeta) => {
              console.log(globalMeta)
              let userMeta = metas.find((meta) => meta.item === globalMeta.item);
              let restante = globalMeta.quantidade - (userMeta ? userMeta.quantidade : 0);
              response += `Item: ${globalMeta.item}, Quantidade restante: ${restante}\n`;
            });
    
            return interaction.reply({ content: response, ephemeral: true });
          }
        }
      );
    }
    

    if (
      interaction.customId === "add_farm" ||
      interaction.customId === "remove_farm" ||
      interaction.customId === "reset_farm"
    ) {
      // Abre o modal correspondente para o administrador
      let modal;
      if (interaction.customId === "add_farm") {
        modal = new Modal()
          .setCustomId("add_farm_modal")
          .setTitle("Adicionar Farm")
          .addComponents(
            new TextInputComponent()
              .setCustomId("user_id")
              .setLabel("ID do Usuário")
              .setStyle("SHORT"),
            new TextInputComponent()
              .setCustomId("farm_item")
              .setLabel("Item")
              .setStyle("SHORT"),
            new TextInputComponent()
              .setCustomId("farm_quantidade")
              .setLabel("Quantidade")
              .setStyle("SHORT")
          );
      } else if (interaction.customId === "remove_farm") {
        modal = new Modal()
          .setCustomId("remove_farm_modal")
          .setTitle("Remover Farm")
          .addComponents(
            new TextInputComponent()
              .setCustomId("user_id")
              .setLabel("ID do Usuário")
              .setStyle("SHORT"),
            new TextInputComponent()
              .setCustomId("farm_item")
              .setLabel("Item")
              .setStyle("SHORT"),
            new TextInputComponent()
              .setCustomId("farm_quantidade")
              .setLabel("Quantidade")
              .setStyle("SHORT")
          );
      } else if (interaction.customId === "reset_farm") {
        modal = new Modal()
          .setCustomId("reset_farm_modal")
          .setTitle("Resetar Farms")
          .addComponents(
            new TextInputComponent()
              .setCustomId("user_id")
              .setLabel("ID do Usuário")
              .setStyle("SHORT")
          );
      }

      showModal(modal, {
        client: client,
        interaction: interaction,
      });
    }
  }
  if (interaction.isModalSubmit()) {
    if (interaction.customId === "send_meta_modal") {
      const itemsInput = interaction.fields.getTextInputValue("meta_items");
      const proofLink = interaction.fields.getTextInputValue("meta_proof");

      if (!itemsInput || !proofLink) {
        return interaction.reply({
          content: "<:icons_Wrong75:1198037616956821515> | Valores inválidos.",
          ephemeral: true,
        });
      }

      const items = itemsInput
        .split(",")
        .map((item) => {
          const [quantidade, ...itemName] = item.trim().split(" ");
          return {
            item: itemName.join(" ").trim(),
            quantidade: parseInt(quantidade, 10),
          };
        })
        .filter((item) => item.quantidade && item.item);

      if (items.length === 0) {
        return interaction.reply({
          content: "<:icons_Wrong75:1198037616956821515> | Formato dos itens inválido.",
          ephemeral: true,
        });
      }

      // Gerar string descritiva dos itens farmados
      const itemsDescription = items
        .map(({ item, quantidade }) => `${quantidade} ${item}`)
        .join(", ");

      // Log do link de comprovação para auditoria
      FunctionsGlobal.log(
        "metas",
        `Usuário ${interaction.user.tag} realizou a meta de: ${itemsDescription} **Link de Comprovação:** ${proofLink}`
      );

      updateMetas(usuario_id, items, (err) => {
        if (err) {
          return interaction.reply({
            content: "<:icons_Wrong75:1198037616956821515> | Erro ao enviar meta.",
            ephemeral: true,
          });
        }

        return interaction.reply({
          content: "<:newmember:1197986072039264266> | Meta enviada com sucesso!",
          ephemeral: true,
        });
      });
    } else {
      const targetUserId = interaction.fields.getTextInputValue("user_id");

      if (!targetUserId) {
        return interaction.reply({
          content: "<:icons_Wrong75:1198037616956821515> | ID do usuário inválido.",
          ephemeral: true,
        });
      }

      if (interaction.customId === "add_farm_modal") {
        const item = interaction.fields.getTextInputValue("farm_item");
        const quantidade = parseInt(
          interaction.fields.getTextInputValue("farm_quantidade"),
          10
        );

        if (!item || isNaN(quantidade)) {
          return interaction.reply({
            content: "<:icons_Wrong75:1198037616956821515> | Valores inválidos.",
            ephemeral: true,
          });
        }

        // Atualiza o banco de dados para adicionar a farm
        updateMetas(
          targetUserId,
          [{ item, quantidade: -quantidade }],
          (err) => {
            if (err) {
              return interaction.reply({
                content: "<:icons_Wrong75:1198037616956821515> | Erro ao adicionar farm.",
                ephemeral: true,
              });
            }

            return interaction.reply({
              content: "<:ecomode:1197986068545425511> | Farm adicionada com sucesso!",
              ephemeral: true,
            });
          }
        );
      }

      if (interaction.customId === "remove_farm_modal") {
        const item = interaction.fields.getTextInputValue("farm_item");
        const quantidade = parseInt(
          interaction.fields.getTextInputValue("farm_quantidade"),
          10
        );

        if (!item || isNaN(quantidade)) {
          return interaction.reply({
            content: "<:icons_Wrong75:1198037616956821515> | Valores inválidos.",
            ephemeral: true,
          });
        }

        // Atualiza o banco de dados para remover a farm
        updateMetas(targetUserId, [{ item, quantidade }], (err) => {
          if (err) {
            return interaction.reply({
              content: "<:icons_Wrong75:1198037616956821515> | Erro ao remover farm.",
              ephemeral: true,
            });
          }

          return interaction.reply({
            content: "<:iconscorrect:1198037618361905345> | Farm removida com sucesso!",
            ephemeral: true,
          });
        });
      }

      if (interaction.customId === "reset_farm_modal") {
        // Inicializa as metas para resetar
        initializeMetas(targetUserId, (err) => {
          if (err) {
            return interaction.reply({
              content: "<:icons_Wrong75:1198037616956821515> | Erro ao resetar farms.",
              ephemeral: true,
            });
          }

          return interaction.reply({
            content: "<:iconscorrect:1198037618361905345> | Farms resetadas com sucesso!",
            ephemeral: true,
          });
        });
      }
    }
  }
});
