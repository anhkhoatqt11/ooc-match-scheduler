const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { slotManager } = require('./schedule');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('cancel')
        .setDescription('Hủy lịch đấu hiện tại')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
    
    async execute(interaction) {
        // Kiểm tra quyền admin
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
            return interaction.reply({ 
                content: '❌ Bạn không có quyền sử dụng lệnh này! Cần quyền "Manage Messages".', 
                ephemeral: true 
            });
        }

        const channelId = interaction.channel.id;
        const schedule = slotManager.getActiveSchedule(channelId);
        
        if (!schedule) {
            return interaction.reply({ 
                content: '❌ Không có lịch đấu hoạt động trong kênh này!', 
                ephemeral: true 
            });
        }

        // Chỉ cho phép người tạo lịch hoặc admin hủy
        if (schedule.createdBy !== interaction.user.id && !interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({ 
                content: '❌ Chỉ người tạo lịch hoặc admin mới có thể hủy lịch đấu!', 
                ephemeral: true 
            });
        }

        // Xóa lịch đấu
        slotManager.activeSchedules.delete(channelId);
        
        await interaction.reply({ 
            content: '✅ Đã hủy lịch đấu thành công!', 
            ephemeral: false 
        });
    },
};
