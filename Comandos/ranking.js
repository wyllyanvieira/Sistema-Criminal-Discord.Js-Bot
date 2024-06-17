const Discord = require("discord.js");
const sqlite3 = require("sqlite3");
const db = new sqlite3.Database("./database.db");
const config = require("../config.json");

module.exports = {
  name: "ranking", 
  description: "[⚙️ Utilidade] Veja o Ranking dos respectivos setores.", 
  type: Discord.ApplicationCommandType.ChatInput,
  options: [
    {
      name: 'farm',
      description: 'Veja o ranking das pessoas com menos farm.',
      type: Discord.ApplicationCommandOptionType.Subcommand
    }
  ],

  run: async (client, interaction) => {
    if (interaction.options.getSubcommand() === 'farm') {
      // Consulta ao banco de dados para obter os usuários e suas metas
      db.all(`SELECT usuario_id, metas FROM usuarios`, [], (err, rows) => {
        if (err) {
          return interaction.reply({ content: 'Erro ao obter ranking.', ephemeral: true });
        }

        // Processar os dados para calcular a quantidade total de farms restantes para cada usuário
        console.log(rows)
        const ranking = rows.map(row => {
          const metas = JSON.parse(row.metas);
          const totalFarm = metas.reduce((total, meta) => total + meta.quantidade, 0);
          return {
            usuario_id: row.usuario_id,
            totalFarm
          };
        });

        // Ordenar os usuários pelo total de farms restantes (do menor para o maior)
        ranking.sort((a, b) => a.totalFarm - b.totalFarm);

        // Criar a mensagem de resposta com o ranking
        let response = '**Ranking de Farms:**\n\n';
        ranking.forEach((user, index) => {
          const member = interaction.guild.members.cache.get(user.usuario_id);
          const username = member ? member.user.tag : `ID: ${user.usuario_id}`;
          response += `${index + 1}. ${username} - ${user.totalFarm} farms restantes\n`;
        });

        // Enviar a resposta
        interaction.reply({ content: response, ephemeral: false });
      });
    }
  }
};
