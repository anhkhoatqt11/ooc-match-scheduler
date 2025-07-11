import { SlashCommandBuilder } from 'discord.js';

const cancelCommand = {
    data: new SlashCommandBuilder()
        .setName('cancel')
        .setDescription('Hủy lịch đấu hiện tại'),
    
    async execute(interaction) {
        await interaction.reply({ content: 'Cancel command executed!', ephemeral: true });
    },
};

export default cancelCommand;
