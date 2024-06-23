const sqlite3 = require("sqlite3");
const config = require("../config.json"); // Substitua pelo caminho real do seu arquivo de configuração
const Discord = require("discord.js");
const client = require("../index");
const FunctionsGlobal = require("../FunctionsGlobal.js");

client.once("ready", async () => {
  const canais = {
    mensagem_ponto: config.CANAIS.canal_ponto,
    mensagem_metas: config.CANAIS.canal_metas,
    mensagem_logbau: config.CANAIS.canal_bau,
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

        if (tipo === "mensagem_ponto" && config.SISTEMAS.ponto) {
          embed = new Discord.EmbedBuilder()
            .setTitle("🗳️ Controle de Bate-Ponto")
            .setThumbnail(client.user.displayAvatarURL({ dynamic: true }))
            .setDescription(
              "Para os superiores saberem quem mais frequenta a cidade, foi coordenado um sistema de bate-ponto para melhor gerenciamento da organização. Lembrando que, em caso de esquecimento do ponto aberto, ele será fechado automaticamente por um superior. Utilize os botões abaixo para gerenciar essas ações."
            )
            .setColor(config.EMBED.color)
            .addFields(
              {
                name: "<:newmember:1197986072039264266> Abrir Ponto",
                value:
                  '> Clique no botão "Abrir Ponto" para registrar o início do seu expediente.',
                inline: true,
              },
              {
                name: "<:member:1197986380781985903> Fechar Ponto",
                value:
                  '> Clique no botão "Fechar Ponto" para registrar o término do seu expediente.',
                inline: true,
              }
            );

          if (config.EMBED.BANNER && config.EMBED.BANNER.imagem_ponto) {
            embed.setImage(config.EMBED.BANNER.imagem_ponto);
          }

          components = [
            new Discord.ActionRowBuilder().addComponents(
              new Discord.ButtonBuilder()
                .setCustomId("abrir_ponto")
                .setEmoji("1197986072039264266")
                .setLabel("Abrir Ponto")
                .setStyle(Discord.ButtonStyle.Success),
              new Discord.ButtonBuilder()
                .setCustomId("fechar_ponto")
                .setEmoji("1197986380781985903")
                .setLabel("Fechar Ponto")
                .setStyle(Discord.ButtonStyle.Danger)
            ),
          ];
        } else if (tipo === "mensagem_metas" && config.SISTEMAS.metas) {
          embed = new Discord.EmbedBuilder()
            .setTitle("🎒 Controle de Metas/Farming")
            .setDescription(
              "Aqui será postado o controle de metas/Farming do usuário. Caso haja uma postagem fake acerca das metas, haverá punições. Lembrando que todos têm uma meta a ser atingida. Ao realizá-la, faça a postagem no Discord."
            )
            .setColor(config.EMBED.color)
            .setThumbnail(client.user.displayAvatarURL({ dynamic: true }))
            .addFields(
              {
                name: "<:ecomode:1197986068545425511> Enviar Meta",
                value:
                  "> Use este botão para enviar suas metas e reportar seu progresso.",
              },
              {
                name: "<:info:1197986066779607121> Verificar Pendência Meta",
                value:
                  "> Use este botão para verificar as pendências relacionadas às suas metas.",
              }
            );

          if (config.EMBED.BANNER && config.EMBED.BANNER.imagem_metas) {
            embed.setImage(config.EMBED.BANNER.imagem_metas);
          }

          components = [
            new Discord.ActionRowBuilder().addComponents(
              new Discord.ButtonBuilder()
                .setCustomId("send_meta")
                .setEmoji("1197986068545425511")
                .setLabel("Enviar Meta")
                .setStyle(Discord.ButtonStyle.Success),
              new Discord.ButtonBuilder()
                .setCustomId("check_metas")
                .setEmoji("1197986066779607121")
                .setLabel("Verificar Pendência Meta")
                .setStyle(Discord.ButtonStyle.Secondary)
            ),
          ];
        } else if (tipo === "mensagem_logbau" && config.SISTEMAS.bau) {
          embed = new Discord.EmbedBuilder()
            .setTitle("💰 Controle de Organização Monetária")
            .setDescription(
              "Este menu permite gerenciar o baú e o caixa da Organização. Selecione uma das opções abaixo:"
            )
            .setColor(config.EMBED.color)
            .setThumbnail(client.user.displayAvatarURL({ dynamic: true }))
            .addFields(
              {
                name: "<:rules:1197986061750632598> Adicionar Item",
                value: "> Informe a adição de itens ao baú da Organização.",
              },
              {
                name: "<:rules:1197986061750632598> Remover Item",
                value: "> Informe a remoção de itens do baú da Organização.",
              },
              {
                name: "<:iconcreditcard:1197986075117887649> Adicionar Dinheiro",
                value:
                  "> Registre a adição de dinheiro ao caixa da Organização.",
              },
              {
                name: "<:iconcreditcard:1197986075117887649> Remover Dinheiro",
                value:
                  "> Registre a remoção de dinheiro do caixa da Organização.",
              }
            );

          if (config.EMBED.BANNER && config.EMBED.BANNER.imagem_bau) {
            embed.setImage(config.EMBED.BANNER.imagem_bau);
          }

          components = [
            new Discord.ActionRowBuilder().addComponents(
              new Discord.StringSelectMenuBuilder()
                .setCustomId("orgmenu")
                .setPlaceholder("⚙️ | Selecione uma opção")
                .addOptions([
                  {
                    label: "Adicionar Item",
                    emoji: "1197986061750632598",
                    description:
                      "Informe a adição de itens ao baú da Organização",
                    value: "add_item",
                  },
                  {
                    label: "Remover Item",
                    emoji: "1197986061750632598",
                    description:
                      "Informe a remoção de itens do baú da Organização",
                    value: "rem_item",
                  },
                  {
                    label: "Adicionar Dinheiro",
                    emoji: "1197986075117887649",
                    description:
                      "Registre a adição de dinheiro ao caixa da Organização",
                    value: "add_money",
                  },
                  {
                    label: "Remover Dinheiro",
                    emoji: "1197986075117887649",
                    description:
                      "Registre a remoção de dinheiro do caixa da Organização",
                    value: "rem_money",
                  },
                ])
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

