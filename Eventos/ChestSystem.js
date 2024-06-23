const fs = require("fs");
const path = require("path");
const {
  ModalBuilder,
  TextInputBuilder,
  ActionRowBuilder,
  TextInputStyle,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} = require("discord.js");
const client = require("../index");
const FunctionsGlobal = require("../FunctionsGlobal.js");
const configFilePath = path.join(__dirname, "../chestdata.json");
const config = require("../config.json");

// Função para ler dados do arquivo JSON
function readData() {
  if (!fs.existsSync(configFilePath)) {
    fs.writeFileSync(configFilePath, JSON.stringify({}), "utf-8");
  }
  const data = fs.readFileSync(configFilePath, "utf-8");
  if (data.trim() === "") {
    return {};
  }
  return JSON.parse(data, (key, value) => {
    if (key === "items") {
      const lowercaseItems = {};
      Object.keys(value).forEach((item) => {
        lowercaseItems[item.toLowerCase()] = value[item];
      });
      return lowercaseItems;
    }
    return value;
  });
}

// Função para escrever dados no arquivo JSON
function writeData(data) {
  const lowercaseItems = {};
  Object.keys(data).forEach((guildId) => {
    lowercaseItems[guildId] = {
      money: data[guildId].money,
      items: {},
    };
    Object.keys(data[guildId].items).forEach((item) => {
      lowercaseItems[guildId].items[item.toLowerCase()] =
        data[guildId].items[item];
    });
  });
  fs.writeFileSync(
    configFilePath,
    JSON.stringify(lowercaseItems, null, 2),
    "utf-8"
  );
}

// Função para criar a mensagem com os itens da página atual
function createItemsEmbed(guildId, page = 0, itemsPerPage = 10) {
  const data = readData(); // Supondo que você tenha uma função readData() para obter os dados
  const guildData = data[guildId];
  if (!guildData || !guildData.items) {
    const embed = new EmbedBuilder()
      .setColor(config.EMBED.color)
      .setDescription(
        "<:icons_Wrong75:1198037616956821515> | Não há dados de baú nesse servidor."
      );
    return embed;
  }

  const items = Object.entries(guildData.items);
  const totalPages = Math.ceil(items.length / itemsPerPage);

  if (page >= totalPages) page = totalPages - 1;
  if (page < 0) page = 0;

  const start = page * itemsPerPage;
  const end = Math.min(start + itemsPerPage, items.length);

  const embed = new EmbedBuilder()
    .setColor(config.EMBED.color)
    .setTitle("🏦 Banco da Organização")
    .setDescription(`Saldo Caixa Organização: ${guildData.money}\n\n`)
    .setThumbnail(client.user.displayAvatarURL({ dynamic: true }))
    .setFooter({
      text: `Página ${page + 1} de ${totalPages}`,
      iconURL: client.user.displayAvatarURL({ dynamic: true }),
    });

  for (let i = start; i < end; i++) {
    const [item, quantity] = items[i];
    // Corrigindo para começar com letra maiúscula
    const formattedItem = item.charAt(0).toUpperCase() + item.slice(1);
    embed.addFields({
      name: formattedItem,
      value: `Quantidade: ${quantity}`,
      inline: true,
    });
  }

  return embed;
}

// Função para criar os botões de navegação
function createPaginationButtons(page, totalPages) {
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`prev_${page}`)
      .setLabel("⬅️")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page === 0),
    new ButtonBuilder()
      .setCustomId(`next_${page}`)
      .setLabel("➡️")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page === totalPages - 1)
  );

  return row;
}

// Função para calcular o número total de páginas
function calculateTotalPages(guildId, itemsPerPage = 10) {
  const data = readData(); // Supondo que você tenha uma função readData() para obter os dados
  const guildData = data[guildId];
  if (!guildData) return 0;

  const items = Object.entries(guildData.items);
  return Math.ceil(items.length / itemsPerPage);
}

// Função para criar um modal
function createModal(customId, title, inputs) {
  const modal = new ModalBuilder().setCustomId(customId).setTitle(title);

  const components = inputs.map((input) => {
    return new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId(input.customId)
        .setLabel(input.label)
        .setStyle(input.style)
        .setRequired(true)
    );
  });

  modal.addComponents(...components);
  return modal;
}

// Criação dos modais para cada operação
const remItemModal = createModal("rem_item_modal", "Remover Item", [
  { customId: "item", label: "Item", style: TextInputStyle.Short },
  { customId: "quantity", label: "Quantidade", style: TextInputStyle.Short },
  { customId: "proof", label: "Prova", style: TextInputStyle.Paragraph },
]);

const addItemModal = createModal("add_item_modal", "Adicionar Item", [
  { customId: "item", label: "Item", style: TextInputStyle.Short },
  { customId: "quantity", label: "Quantidade", style: TextInputStyle.Short },
  { customId: "proof", label: "Prova", style: TextInputStyle.Paragraph },
]);

const addMoneyModal = createModal("add_money_modal", "Adicionar Dinheiro", [
  { customId: "quantity", label: "Quantidade", style: TextInputStyle.Short },
  { customId: "proof", label: "Prova", style: TextInputStyle.Paragraph },
]);

const remMoneyModal = createModal("rem_money_modal", "Remover Dinheiro", [
  { customId: "quantity", label: "Quantidade", style: TextInputStyle.Short },
  { customId: "proof", label: "Prova", style: TextInputStyle.Paragraph },
]);

client.on("interactionCreate", async (interaction) => {
  if (config.SISTEMAS.bau) {
    if (!interaction.isStringSelectMenu()) return;

    if (interaction.customId === "orgmenu") {
      if (interaction.values[0] === "rem_item") {
        await interaction.showModal(remItemModal);
      }

      if (interaction.values[0] === "add_item") {
        await interaction.showModal(addItemModal);
      }

      if (interaction.values[0] === "add_money") {
        await interaction.showModal(addMoneyModal);
      }

      if (interaction.values[0] === "rem_money") {
        await interaction.showModal(remMoneyModal);
      }
    }

    if (
      interaction.customId === "admin_select" &&
      interaction.values[0] === "view_chest"
    ) {
      const guildId = interaction.guildId;
      const page = 0; // Começa na primeira página
      const embed = createItemsEmbed(guildId, page);
      const totalPages = calculateTotalPages(guildId);

      const buttons = createPaginationButtons(page, totalPages);

      await interaction.reply({
        embeds: [embed],
        components: [buttons],
        ephemeral: true,
      });
    }
  }
});

client.on("interactionCreate", async (interaction) => {
  if (config.SISTEMAS.bau) {
    if (!interaction.isButton()) return;
    if (interaction.customId.startsWith("prev" || "next")) {
      const guildId = interaction.guildId;
      const [action, currentPage] = interaction.customId.split("_");
      if (action === "prev") newPage -= 1;
      if (action === "next") newPage += 1;

      const totalPages = calculateTotalPages(guildId);
      const itemsMessage = createItemsEmbed(guildId, newPage);

      const buttons = createPaginationButtons(newPage, totalPages);

      await interaction.update({
        content: itemsMessage,
        components: [buttons],
      });
    }
  }
});

client.on("interactionCreate", async (interaction) => {
  if (config.SISTEMAS.bau) {
    if (interaction.isModalSubmit()) {
      const guild_id = interaction.guild.id;
      const customId = interaction.customId;

      let data = readData();

      if (!data[guild_id]) {
        data[guild_id] = { money: 0, items: {} };
      }

      if (customId === "rem_item_modal" || customId === "add_item_modal") {
        const item = interaction.fields.getTextInputValue("item");
        const quantity = parseInt(
          interaction.fields.getTextInputValue("quantity")
        );
        const proof = interaction.fields.getTextInputValue("proof");

        if (customId === "rem_item_modal") {
          if (
            data[guild_id].items[item] &&
            data[guild_id].items[item] >= quantity
          ) {
            data[guild_id].items[item] -= quantity;
            if (data[guild_id].items[item] === 0) {
              delete data[guild_id].items[item];
            }
            writeData(data);
            interaction.reply({
              content:
                " <:delete:1197986063554187284>| Item removido com sucesso!",
              ephemeral: true,
            });
            FunctionsGlobal.log(
              "chest",
              `> O Usuario <@${interaction.user.id}> removeu **${quantity}x ${item}** do Baú da organização
          > Provas Anexadas: ${proof}`
            );
          } else {
            interaction.reply({
              content:
                "<:icons_Wrong75:1198037616956821515> | A Organização não possue essa quantidade em seu baú!",
              ephemeral: true,
            });
          }
        }

        if (customId === "add_item_modal") {
          data[guild_id].items[item] =
            (data[guild_id].items[item] || 0) + quantity;
          writeData(data);
          interaction.reply({
            content:
              "<:iconscorrect:1198037618361905345> | Item adicionado com sucesso!",
            ephemeral: true,
          });
          FunctionsGlobal.log(
            "chest",
            `> O Usuario <@${interaction.user.id}> colocou **${quantity}x ${item}** do Baú da organização
          > Provas Anexadas: ${proof}`
          );
        }
      }

      if (customId === "add_money_modal" || customId === "rem_money_modal") {
        const quantity = parseInt(
          interaction.fields.getTextInputValue("quantity")
        );
        const proof = interaction.fields.getTextInputValue("proof");

        if (customId === "add_money_modal") {
          data[guild_id].money += quantity;
          writeData(data);
          interaction.reply({
            content:
              "<:iconscorrect:1198037618361905345> | Dinheiro adicionado com sucesso!",
            ephemeral: true,
          });
          FunctionsGlobal.log(
            "chest",
            `> O Usuario <@${interaction.user.id}> adicionou **${quantity}x de Dinheiro** aos cofres da organização
          > Provas Anexadas: ${proof}`
          );
        }

        if (customId === "rem_money_modal") {
          if (data[guild_id].money >= quantity) {
            data[guild_id].money -= quantity;
            writeData(data);
            interaction.reply({
              content:
                "<:delete:1197986063554187284> | Dinheiro removido com sucesso!",
              ephemeral: true,
            });
            FunctionsGlobal.log(
              "chest",
              `O Usuario <@${interaction.user.id}> removeu **${quantity}x de Dinheiro** aos cofres da organização
            > Provas Anexadas: ${proof}`
            );
          } else {
            interaction.reply({
              content:
                "<:icons_Wrong75:1198037616956821515> | A Organização não possue esse valor em seu cofre!",
              ephemeral: true,
            });
          }
        }
      }
    }
  }
});
