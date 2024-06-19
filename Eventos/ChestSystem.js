
const sqlite3 = require('sqlite3');
const config = require('../config.json');
const Discord = require('discord.js');
const client = require("../index");
const FunctionsGlobal = require('../FunctionsGlobal.js');
const db = new sqlite3.Database("./database.db");

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS chest (
      usuario_id TEXT,
      item TEXT,
      quantidade INTEGER,
      prova TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );`);
  });


client.on('interactionCreate', async (interaction) => {
    const usuario_id = interaction.user.id;

    if (interaction.isButton()) {
        if (interaction.customId === 'rem_item') {
            // Aqui o usuário está tentando remover um item do inventário
            const filter = (m) => m.author.id === interaction.user.id;
            interaction.user.send('Qual item você deseja remover?').then(() => {
                interaction.channel.awaitMessages({ filter, max: 1, time: 60000, errors: ['time'] })
                    .then(async (collected) => {
                        const item = collected.first().content;
                        const quantidade = 1; // Quantidade a remover (poderia ser ajustável)
                        const prova = collected.first().content; // Aqui você pode pedir a prova

                        // Remover item do inventário
                        db.run('DELETE FROM chest WHERE usuario_id = ? AND item = ? LIMIT ?', [usuario_id, item, quantidade], function(err) {
                            if (err) {
                                return console.error(err.message);
                            }
                            console.log(`Row(s) deleted: ${this.changes}`);
                            interaction.reply(`Item ${item} removido do inventário.`);
                        });
                    })
                    .catch((err) => {
                        console.error(err);
                        interaction.reply('Você não respondeu a tempo ou ocorreu um erro.');
                    });
            });
        }

        if (interaction.customId === 'add_Item') {
            // Aqui o usuário está tentando adicionar um item ao inventário
            const filter = (m) => m.author.id === interaction.user.id;
            interaction.user.send('Qual item você deseja adicionar?').then(() => {
                interaction.channel.awaitMessages({ filter, max: 1, time: 60000, errors: ['time'] })
                    .then(async (collected) => {
                        const item = collected.first().content;
                        const quantidade = 1; // Quantidade a adicionar (poderia ser ajustável)
                        const prova = collected.first().content; // Aqui você pode pedir a prova

                        // Inserir item no inventário
                        db.run('INSERT INTO chest(usuario_id, item, quantidade, prova) VALUES(?, ?, ?, ?)', [usuario_id, item, quantidade, prova], function(err) {
                            if (err) {
                                return console.error(err.message);
                            }
                            console.log(`A row has been inserted with rowid ${this.lastID}`);
                            interaction.reply(`Item ${item} adicionado ao inventário.`);
                        });
                    })
                    .catch((err) => {
                        console.error(err);
                        interaction.reply('Você não respondeu a tempo ou ocorreu um erro.');
                    });
            });
        }
    }
});
