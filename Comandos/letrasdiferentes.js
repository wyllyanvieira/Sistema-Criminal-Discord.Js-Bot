const Discord = require("discord.js");
const config = require("../config.json");

// Mapeamento de letras diferentes
const letrasDiferentes = {
  0: "0",
  1: "1",
  2: "2",
  3: "3",
  4: "4",
  5: "5",
  6: "6",
  7: "7",
  8: "8",
  9: "9",
  a: "ᴀ",
  b: "ʙ",
  c: "ᴄ",
  d: "ᴅ",
  e: "ᴇ",
  f: "ғ",
  g: "ɢ",
  h: "ʜ",
  i: "ɪ",
  j: "ᴊ",
  k: "ᴋ",
  l: "ʟ",
  m: "ᴍ",
  n: "ɴ",
  o: "ᴏ",
  p: "ᴘ",
  q: "ǫ",
  r: "ʀ",
  s: "s",
  t: "ᴛ",
  u: "ᴜ",
  v: "ᴠ",
  w: "ᴡ",
  x: "x",
  y: "ʏ",
  z: "ᴢ",
  A: "ᴀ",
  B: "ʙ",
  C: "ᴄ",
  D: "ᴅ",
  E: "ᴇ",
  F: "ғ",
  G: "ɢ",
  H: "ʜ",
  I: "ɪ",
  J: "ᴊ",
  K: "ᴋ",
  L: "ʟ",
  M: "ᴍ",
  N: "ɴ",
  O: "ᴏ",
  P: "ᴘ",
  Q: "ǫ",
  R: "ʀ",
  S: "s",
  T: "ᴛ",
  U: "ᴜ",
  V: "ᴠ",
  W: "ᴡ",
  X: "x",
  Y: "ʏ",
  Z: "ᴢ",
};

module.exports = {
  name: "letrasdiferentes",
  description: "[⚙️ Utilidade] Escreva com letras diferentes.",
  type: Discord.ApplicationCommandType.ChatInput,
  options: [
    {
      name: "texto",
      description: "Digite o Texto que será comvertido nas letras diferentes?",
      type: Discord.ApplicationCommandOptionType.String,
      required: true,
    },
  ],

  run: async (client, interaction) => {
    const textoOriginal = interaction.options.getString("texto");
    let textoTransformado = "";

    // Transforma cada caractere do texto original usando o mapeamento
    for (let i = 0; i < textoOriginal.length; i++) {
      const char = textoOriginal.charAt(i);
      const charTransformado = letrasDiferentes[char] || char; // Se não houver transformação, mantém o caractere original
      textoTransformado += charTransformado;
    }

    // Envia a mensagem de volta para o canal onde o comando foi utilizado
    await interaction.reply({content: `> ${textoTransformado}`, ephemeral: true });
  },
};
