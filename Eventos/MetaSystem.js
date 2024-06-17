const sqlite3 = require("sqlite3");
const Discord = require("discord.js");
const { Modal, TextInputComponent, showModal } = require('discord-modals');
const client = require("../index");
const db = new sqlite3.Database("./database.db");
const config = require("../config.json"); 
const FunctionsGlobal = require("../FunctionsGlobal.js");

require('discord-modals')(client);

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
  const metas = JSON.stringify(config.METAS_FARM.metaglobal);
  db.run(`INSERT OR REPLACE INTO usuarios (usuario_id, metas) VALUES (?, ?)`, [usuario_id, metas], callback);
}

// Função para enviar as metas e atualizar o banco de dados
function updateMetas(usuario_id, items, callback) {
  db.get(`SELECT metas FROM usuarios WHERE usuario_id = ?`, [usuario_id], (err, row) => {
    if (err) return callback(err);

    if (!row || !row.metas) {
      initializeMetas(usuario_id, (err) => {
        if (err) return callback(err);

        // Após inicializar as metas, tentar atualizar novamente
        updateMetas(usuario_id, items, callback);
      });
    } else {
      let metas = JSON.parse(row.metas);

      items.forEach(({ item, quantidade }) => {
        let meta = metas.find(meta => meta.item === item);
        if (meta) {
          meta.quantidade = Math.max(meta.quantidade - quantidade, 0);
        }
      });

      db.run(`UPDATE usuarios SET metas = ? WHERE usuario_id = ?`, [JSON.stringify(metas), usuario_id], callback);
    }
  });
}

client.on("interactionCreate", async (interaction) => {
  const usuario_id = interaction.user.id;
  if (interaction.isButton()) {
    if (interaction.customId === "send_meta") {
      // Exibir modal para o usuário enviar as metas
      const modal = new Modal()
        .setCustomId('send_meta_modal')
        .setTitle('Enviar Metas')
        .addComponents(
          new TextInputComponent()
            .setCustomId('meta_items')
            .setLabel('Itens e Quantidades (ex: "3 pistola, 2 m4")')
            .setStyle('LONG'),
          new TextInputComponent()
            .setCustomId('meta_proof')
            .setLabel('Link de Comprovação')
            .setStyle('SHORT')
        );

      showModal(modal, {
        client: client,
        interaction: interaction
      });
    }

    if (interaction.customId === "check_metas") {
      db.get(`SELECT metas FROM usuarios WHERE usuario_id = ?`, [usuario_id], (err, row) => {
        if (err) {
          return interaction.reply({ content: 'Erro ao verificar metas.', ephemeral: true });
        }

        if (!row || !row.metas) {
          initializeMetas(usuario_id, (err) => {
            if (err) {
              return interaction.reply({ content: 'Erro ao inicializar metas.', ephemeral: true });
            }

            return interaction.reply({ content: 'Metas inicializadas!', ephemeral: true });
          });
        } else {
          const metas = JSON.parse(row.metas);
          let response = 'Suas metas:\n';
          metas.forEach(meta => {
            response += `Item: ${meta.item}, Quantidade restante: ${meta.quantidade}\n`;
          });

          return interaction.reply({ content: response, ephemeral: true });
        }
      });
    }
  }

  if (interaction.isModalSubmit()) {
    if (interaction.customId === 'send_meta_modal') {
      const itemsInput = interaction.fields.getTextInputValue('meta_items');
      const proofLink = interaction.fields.getTextInputValue('meta_proof');

      if (!itemsInput || !proofLink) {
        return interaction.reply({ content: 'Valores inválidos.', ephemeral: true });
      }

      const items = itemsInput.split(',').map(item => {
        const [quantidade, ...itemName] = item.trim().split(' ');
        return {
          item: itemName.join(' ').trim(),
          quantidade: parseInt(quantidade, 10)
        };
      }).filter(item => item.quantidade && item.item);

      if (items.length === 0) {
        return interaction.reply({ content: 'Formato dos itens inválido.', ephemeral: true });
      }

      // Gerar string descritiva dos itens farmados
      const itemsDescription = items.map(({ item, quantidade }) => `${quantidade} ${item}`).join(', ');

      // Log do link de comprovação para auditoria
      FunctionsGlobal.log("metas", `Usuário ${interaction.user.tag} realizou a meta de: ${itemsDescription} **Link de Comprovação:** ${proofLink}`);

      updateMetas(usuario_id, items, (err) => {
        if (err) {
          return interaction.reply({ content: 'Erro ao enviar meta.', ephemeral: true });
        }

        return interaction.reply({ content: 'Meta enviada com sucesso!', ephemeral: true });
      });
    }
  }
});