const Discord = require("discord.js");
const config = require("../config.json");
const sqlite3 = require("sqlite3");
const client = require("../index");

module.exports = {
  name: "administracao",
  description: "[⚙️ Utilidade] Realiza configuração de administracção do bot.",
  type: Discord.ApplicationCommandType.ChatInput,

  run: async (client, interaction) => {
    let bot = client.user.tag;
    let avatar_bot = client.user.displayAvatarURL({ dynamic: true });
    let embed = new Discord.EmbedBuilder()
      .setColor(config.EMBED.color)
      .setTimestamp(new Date())
      .setThumbnail(avatar_bot)
      .setDescription(
        `> Realize a administração de sistema do bot atraves desse painel selecione as opções abaixo\n
        > **Informações do sistema:**\n
        **Versão do sistema:** 1.20-v
        **Cliente do BOT:** <@${config.owner}>
        **Tag de Usuario do BOT:** ${bot}`
      );

    let selectMenu = new Discord.ActionRowBuilder().addComponents(
      new Discord.StringSelectMenuBuilder()
        .setCustomId("admin_select")
        .setPlaceholder("⚙️ | Selecione uma opção")
        .addOptions([
          {
            label: "Bate-Ponto",
            emoji: "🗳️",
            description: "Visualize e gerencie o bate-ponto",
            value: "ponto_menu",
          },
          {
            label: "Gerenciamento de Farm",
            emoji: "🎒",
            description: "Gerencie o controle das farms da sua organização",
            value: "metas_menu",
          },
          {
            label: "Configuração",
            emoji: "⚙️",
            description: "Configure o modo para sua organização",
            value: "config_menu",
          },
        ])
    );

    interaction.reply({ embeds: [embed], components: [selectMenu] });
  },
};

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isStringSelectMenu()) return;
  if (interaction.customId === "admin_select") {
    if (interaction.values[0] === "ponto_menu") {
      let embed = new Discord.EmbedBuilder()
        .setColor(config.EMBED.color)
        .setDescription(`Você selecionou a opção Bate-Ponto`);

      let buttons = new Discord.ActionRowBuilder().addComponents(
        new Discord.ButtonBuilder()
          .setCustomId("enviar_mensagem_ponto")
          .setLabel("Enviar Mensagem Bate-ponto")
          .setStyle(Discord.ButtonStyle.Primary),
        new Discord.ButtonBuilder()
          .setCustomId("adicionar_remover_tempo")
          .setLabel("Adicionar/Remover Tempo")
          .setStyle(Discord.ButtonStyle.Secondary)
      );

      interaction.reply({ embeds: [embed], components: [buttons],  ephemeral: true});
    }
    if (interaction.values[0] === "metas_menu") {
      let embed = new Discord.EmbedBuilder()
        .setColor(config.EMBED.color)
        .setDescription(`Você selecionou a opção de Gerenciamento de Metas`);

      let buttons = new Discord.ActionRowBuilder().addComponents(
        new Discord.ButtonBuilder()
          .setCustomId("enviar_mensagem_metas")
          .setLabel("Enviar Mensagem do painel")
          .setStyle(Discord.ButtonStyle.Primary),
        new Discord.ButtonBuilder()
          .setCustomId("setvalue_meta")
          .setLabel("Setar Meta de farm")
          .setStyle(Discord.ButtonStyle.Success),
        new Discord.ButtonBuilder()
          .setCustomId("adicionar_remover_tempom")
          .setLabel("Adicionar/Remover Meta")
          .setStyle(Discord.ButtonStyle.Secondary)
      );

      interaction.reply({ embeds: [embed], components: [buttons],  ephemeral: true });
    }
    if (interaction.values[0] === "config_menu") {
      let embed = new Discord.EmbedBuilder()
        .setColor(config.EMBED.color)
        .setDescription(`Você selecionou a opção de Gerenciamento do Servidor`);

        let dropdown = new Discord.ActionRowBuilder().addComponents(
          new Discord.StringSelectMenuBuilder()
            .setCustomId("admin_select")
            .setPlaceholder("⚙️ | Selecione uma opção")
            .addOptions([
              {
                label: "Gerar Ranking Geral",
                value: "gerar_rankings",
                description: "Gera o ranking geral",
                emoji: "📊"
              },
              {
                label: "Limpar Rankings",
                value: "limpar_rankings",
                description: "Limpa os rankings",
                emoji: "🧹"
              },
              {
                label: "Enviar Painel de Log Bau",
                value: "enviar_mensagem_logbau",
                description: "Envia o painel de Log Bau",
                emoji: "📮"
              },
              {
                label: "Visualizar Logs",
                value: "logviewer",
                description: "Visualiza os logs",
                emoji: "📑"
              },
              {
                label: "Fechar Pontos Abertos",
                value: "fechar_ponto_admin",
                description: "Fechar pontos abertos",
                emoji: "🔒"
              },
            ])
        );


      interaction.reply({ embeds: [embed], components: [dropdown],  ephemeral: true });
    }
  }
});
