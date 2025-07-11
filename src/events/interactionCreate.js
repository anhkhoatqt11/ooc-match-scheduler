const interactionCreateEvent = {
    name: 'interactionCreate',
    async execute(interaction, client) {
        if (interaction.isCommand()) {
            const command = client.commands.get(interaction.commandName);
            if (!command) return;

            try {
                await command.execute(interaction);
            } catch (error) {
                console.error('Error executing command:', error);
                await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
            }
        } else if (interaction.isButton()) {
            // Handle button interactions
            if (interaction.customId.startsWith('slot_')) {
                // Import slotManager dynamically to avoid circular imports
                const { slotManager } = await import('../commands/schedule.js');
                await slotManager.handleButtonInteraction(interaction);
            }
        }
    },
};

export default interactionCreateEvent;
