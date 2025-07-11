const { slotManager } = require('../commands/schedule');

module.exports = {
    name: 'interactionCreate',
    async execute(interaction, client) {
        // Xử lý slash commands
        if (interaction.isChatInputCommand()) {
            const command = client.commands.get(interaction.commandName);
            if (!command) return;

            try {
                await command.execute(interaction);
            } catch (error) {
                console.error(error);
                await interaction.reply({ content: 'Có lỗi xảy ra!', ephemeral: true });
            }
            return;
        }

        // Xử lý button interactions cho slot manager
        if (interaction.isButton()) {
            // Kiểm tra xem có phải là slot button không
            if (interaction.customId.startsWith('slot_')) {
                try {
                    await slotManager.handleButtonInteraction(interaction);
                } catch (error) {
                    console.error('Error handling button interaction:', error);
                    await interaction.reply({ 
                        content: '❌ Có lỗi xảy ra khi xử lý tương tác!', 
                        ephemeral: true 
                    });
                }
            }
        }
    },
};
