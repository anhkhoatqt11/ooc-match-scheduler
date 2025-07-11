require('dotenv').config();
const { REST, Routes } = require('discord.js');
const { CLIENT_ID, GUILD_ID, DISCORD_TOKEN } = process.env;
const fs = require('fs');
const commands = [];

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    commands.push(command.data.toJSON());
}

const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);

(async () => {
    try {
        console.log('Đang đăng ký slash commands...');
        await rest.put(
            Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
            { body: commands },
        );
        console.log('Đăng ký thành công!');
    } catch (error) {
        console.error(error);
    }
})();
