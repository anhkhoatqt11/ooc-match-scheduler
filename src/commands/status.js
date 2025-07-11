import { SlashCommandBuilder } from 'discord.js';

const statusCommand = {
    data: new SlashCommandBuilder()
        .setName('status')
        .setDescription('Xem trạng thái lịch đấu hiện tại'),
    
    async execute(interaction) {
        await interaction.reply({ content: 'Status command executed!', ephemeral: true });
    },
};

export default statusCommand;
