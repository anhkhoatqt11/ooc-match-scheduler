import { REST, Routes } from 'discord.js';

// Import commands
import scheduleCommand from './commands/schedule.js';
import cancelCommand from './commands/cancel.js';
import statusCommand from './commands/status.js';
import slotsCommand from './commands/slots.js';
import helpCommand from './commands/help.js';

const commands = [
    scheduleCommand.data.toJSON(),
    cancelCommand.data.toJSON(),
    statusCommand.data.toJSON(),
    slotsCommand.data.toJSON(),
    helpCommand.data.toJSON(),
];

// Deploy commands function
export async function deployCommands(env) {
    const rest = new REST({ version: '10' }).setToken(env.DISCORD_TOKEN);

    try {
        console.log('Started refreshing application (/) commands.');

        // For guild-specific commands
        if (env.GUILD_ID) {
            await rest.put(
                Routes.applicationGuildCommands(env.CLIENT_ID, env.GUILD_ID),
                { body: commands },
            );
            console.log('Successfully reloaded guild-specific application (/) commands.');
        } else {
            // For global commands
            await rest.put(
                Routes.applicationCommands(env.CLIENT_ID),
                { body: commands },
            );
            console.log('Successfully reloaded global application (/) commands.');
        }
    } catch (error) {
        console.error('Error deploying commands:', error);
    }
}

// For use in the worker
export { commands };
