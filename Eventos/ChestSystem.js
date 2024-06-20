const sqlite3 = require("sqlite3");
const config = require("../config.json");
const Discord = require("discord.js");
const client = require("../index");
const FunctionsGlobal = require("../FunctionsGlobal.js");
const db = new sqlite3.Database("./database.db");

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS  "orgdata" (
	    "money"	INTEGER,
	    "items"	TEXT
    );`);
});

client.on("interactionCreate", async (interaction) => {
  const usuario_id = interaction.user.id;

  if (!interaction.isStringSelectMenu()) return;
    if (interaction.customId === "admin_select") {

        if (interaction.values[0] === "rem_item") {
            console.log()
        }

        if (interaction.values[0] === "add_Item") {

        }

        if (interaction.values[0] === "add_money") {

        }

        if (interaction.values[0] === "rem_money") {

        }
    }
});
