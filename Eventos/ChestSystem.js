const fs = require("fs");
const path = require("path");
const {
  ModalBuilder,
  TextInputBuilder,
  ActionRowBuilder,
  TextInputStyle,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");
const client = require("../index");
const FunctionsGlobal = require("../FunctionsGlobal.js");
const configFilePath = path.join(__dirname, "../chestdata.json");

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
function createItemsMessage(guildId, page = 0, itemsPerPage = 10) {
  const data = readData(); // Supondo que você tenha uma função readData() para obter os dados
  const guildData = data[guildId];
  if (!guildData || !guildData.items) return 'Não há dados de baú nesse servidor.';

  const items = Object.entries(guildData.items);
  const totalPages = Math.ceil(items.length / itemsPerPage);

  if (page >= totalPages) page = totalPages - 1;
  if (page < 0) page = 0;

  const start = page * itemsPerPage;
  const end = Math.min(start + itemsPerPage, items.length);
  
  let message = `**Banco da Organização:** ${guildData.money}\n\n`;
  
  for (let i = start; i < end; i++) {
    const [item, quantity] = items[i];
    message += `**${item}:** ${quantity}\n`;
  }

  message += `\n**Página ${page + 1} de ${totalPages}**`;

  return message;
}

// Função para calcular o número total de páginas
function calculateTotalPages(guildId, itemsPerPage = 10) {
  const data = readData(); // Supondo que você tenha uma função readData() para obter os dados
  const guildData = data[guildId];
  if (!guildData) return 0;

  const items = Object.entries(guildData.items);
  return Math.ceil(items.length / itemsPerPage);
}

// Função para criar botões de navegação
function createPaginationButtons(page, totalPages) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`prev_page_${page}`)
      .setLabel('⬅️')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page === 0),
    new ButtonBuilder()
      .setCustomId(`next_page_${page}`)
      .setLabel('➡️')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page === totalPages - 1)
  );
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
    const itemsMessage = createItemsMessage(guildId, page);
    const totalPages = calculateTotalPages(guildId);

    const buttons = createPaginationButtons(page, totalPages);

    await interaction.reply({
      content: itemsMessage,
      components: [buttons],
    });
  }
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isButton()) return;

  const guildId = interaction.guildId;
  const [action, currentPage] = interaction.customId.split('_');
  let newPage = parseInt(currentPage);

  if (action === 'prev') newPage -= 1;
  if (action === 'next') newPage += 1;

  const totalPages = calculateTotalPages(guildId);
  const itemsMessage = createItemsMessage(guildId, newPage);

  const buttons = createPaginationButtons(newPage, totalPages);

  await interaction.update({
    content: itemsMessage,
    components: [buttons],
  });
});

client.on("interactionCreate", async (interaction) => {
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
        } else {
          interaction.reply({
            content:
              "<:icons_Wrong75:1198037616956821515> | Quantidade insuficiente!",
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
        } else {
          interaction.reply({
            content:
              "<:icons_Wrong75:1198037616956821515> | Quantidade insuficiente!",
            ephemeral: true,
          });
        }
      }
    }
  }
});
