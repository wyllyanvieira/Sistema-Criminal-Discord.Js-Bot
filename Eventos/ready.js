const sqlite3 = require("sqlite3");
const config = require("../config.json"); // Substitua pelo caminho real do seu arquivo de configuração
const Discord = require("discord.js");
const client = require("../index");
const FunctionsGlobal = require("../FunctionsGlobal.js");

client.once("ready", async () => {
  const canais = {
    mensagem_ponto: config.CANAIS.canal_ponto,
    mensagem_metas: config.CANAIS.canal_metas,
    mensagem_logbau: config.CANAIS.canal_bau
  };

  for (const [tipo, canalId] of Object.entries(canais)) {
    if (!canalId) continue;

    const channel = await client.channels.fetch(canalId);

    if (channel && channel.type === Discord.ChannelType.GuildText) {
      // Limpar o canal
      channel.bulkDelete(100).catch(console.error);
      setTimeout(async () => {
        let embed;
        let components;

        if (tipo === "mensagem_ponto") {
          embed = new Discord.EmbedBuilder()
            .setTitle("🗳️ Controle de Bate-Ponto")
            .setThumbnail(client.user.displayAvatarURL({ dynamic: true }))
            .setDescription(
              "Para os superiores saberem quem mais frequenta a cidade, foi coordenado um sistema de bate-ponto para melhor gerenciamento da organização. Lembrando que, em caso de esquecimento do ponto aberto, ele será fechado automaticamente por um superior. Utilize os botões abaixo para gerenciar essas ações."
            )
            .setColor(config.EMBED.color);

          components = [
            new Discord.ActionRowBuilder().addComponents(
              new Discord.ButtonBuilder()
                .setCustomId("abrir_ponto")
                .setLabel("Abrir Ponto")
                .setStyle(Discord.ButtonStyle.Success),
              new Discord.ButtonBuilder()
                .setCustomId("fechar_ponto")
                .setLabel("Fechar Ponto")
                .setStyle(Discord.ButtonStyle.Danger)
            ),
          ];
        } else if (tipo === "mensagem_metas") {
          embed = new Discord.EmbedBuilder()
            .setTitle("🎒 Controle de Metas/Farming")
            .setDescription(
              "Aqui será postado o controle de metas/Farming do usuário. Caso haja uma postagem fake acerca das metas, haverá punições. Lembrando que todos têm uma meta a ser atingida. Ao realizá-la, faça a postagem no Discord."
            )
            .setColor(config.EMBED.color);

          components = [
            new Discord.ActionRowBuilder().addComponents(
              new Discord.ButtonBuilder()
                .setCustomId("send_meta")
                .setLabel("Enviar Meta")
                .setStyle(Discord.ButtonStyle.Primary),
              new Discord.ButtonBuilder()
                .setCustomId("check_metas")
                .setLabel("Verificar Pendência Meta")
                .setStyle(Discord.ButtonStyle.Secondary)
            ),
          ];
        } else if (tipo === "mensagem_logbau") {
          embed = new Discord.EmbedBuilder()
            .setTitle("Mensagem Logbau")
            .setDescription("Descrição para mensagem logbau")
            .setColor(config.EMBED.color);

          components = [
            new Discord.ActionRowBuilder().addComponents(
              new Discord.ButtonBuilder()
                .setCustomId("add_Item")
                .setLabel("Colocar Item no Baú")
                .setStyle(Discord.ButtonStyle.Primary),
              new Discord.ButtonBuilder()
                .setCustomId("rem_Item")
                .setLabel("Pegar Item do Baú")
                .setStyle(Discord.ButtonStyle.Danger)
            ),
          ];
        }

        if (embed && components) {
          await channel.send({ embeds: [embed], components });
          console.log(
            `⚠️ Mensagem enviada para o canal ${channel.id} com o tipo ${tipo}`
          );
        }
      }, 1000); // Atraso de 1 segundo
    }
  }
});
