# GTARP Roleplay Factions Bot

Bem-vindo ao projeto GTARP Roleplay Factions Bot! Este bot foi desenvolvido para facilitar a administração e a interação de facções no servidor de GTA Roleplay, fornecendo funcionalidades essenciais para os jogadores e administradores.

## Índice

- [Sobre o Projeto](#sobre-o-projeto)
- [Funcionalidades](#funcionalidades)
- [Instalação](#instalação)
- [Configuração](#configuração)
- [Comandos](#comandos)
- [Contribuição](#contribuição)
- [Licença](#licença)
- [Contato](#contato)

## Sobre o Projeto

O GTARP Roleplay Factions Bot é um bot de Discord desenvolvido em Node.js que oferece várias funcionalidades para gerenciar e melhorar a experiência de roleplay de facções no GTARP. O bot permite que os administradores gerenciem facções, organizem eventos, e proporcionem uma melhor interação entre os membros.

## Funcionalidades

- **Gerenciamento de Facções**: Criação, edição e exclusão de facções.
- **Gerenciamento de Baú**: Organização de baú da organização para as facções.
- **Sistema de Rankings**: Gerenciamento de rankings dentro das facções.
- **Logs de Atividades**: Registro de atividades importantes das facções.
- **Mensagens Automáticas**: Envio de mensagens automáticas para comunicação de eventos e atualizações.

## Instalação

### Pré-requisitos

- Node.js v14 ou superior
- NPM (Node Package Manager)
- Conta no Discord com permissões para criar bots

### Passo a Passo

1. Clone o repositório:

   ```bash
   git clone https://github.com/wyllyanvieira/Sistema-Criminal-Discord.Js-Bot.git
   ```

2. Instale as dependências:

   ```bash
   npm install
   ```

3. Entre no Arquivo **config.json** e configure a gosto:

   ```json
    {
        "token": "",
        "owner":"",

            "EMBED": {
                "color": "2f3136"
            },

            "CANAIS": {
                "canal_ponto":"",
                "canal_metas":"",
                "canal_bau":"",
            },

            "METAS_FARM": {
                "metaglobal": [
                        {"quantidade": 3, "item": "item 1"},
                        {"quantidade": 2, "item": "item 2"},
                        {"quantidade": 1, "item": "item 3"}
                    ]
            }
    }



4. Inicie o bot:
   ```bash
   npm start
   ```

## Configuração

No arquivo `config.json`, configure as seguintes variáveis:

- `token`: Token do seu bot no Discord.
- `owner`: Prefixo para os comandos do bot.
- `canal_ponto"`: Configura o canal destinado a Bate-Ponto
- `canal_metas"`: Configura o canal destinado a Metas de Farm
- `canal_bau"`: Configura o canal destinado a Envio de Baús
- `metaglobal`: Array que Define Objetos para envio de farm

## Comandos

### Comandos de Administração

- `/administracao`: Para abrir menu com diversas opções administrativas.

### Comandos de Administração

- `/verhoras`: Comando para ver tempo que seu ponto está batido.

### Comandos de Ranking

- `/ranking ponto`: ver a posição do usuario no ranking de bate-ponto.
- `/ranking metas`: ver a posição do usuario no ranking de metas/farm .

## Contribuição

Contribuições são bem-vindas! Siga os passos abaixo para contribuir:

1. Faça um fork do projeto.
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`).
3. Commit suas mudanças (`git commit -m 'Adicionar nova feature'`).
4. Push para a branch (`git push origin feature/nova-feature`).
5. Abra um Pull Request.

## Licença

Este projeto está licenciado sob a licença MIT - veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## Contato

Desenvolvido por [Wyllyan Vieira](https://github.com/seu-wyllyanvieira). Entre em contato pelo e-mail wyllyanvieira@hotmail.com.
