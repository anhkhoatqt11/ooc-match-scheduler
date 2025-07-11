const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('slots')
        .setDescription('Xem thông tin về khung giờ thi đấu'),
    
    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setTitle('🕐 Khung Giờ Thi Đấu')
            .setDescription('Bot chỉ hỗ trợ **2 khung giờ cố định** mỗi ngày:')
            .setColor('#0099ff')
            .addFields(
                {
                    name: '� Khung Giờ Tối Sớm',
                    value: '**20:00** - Phù hợp cho những người muốn chơi sớm',
                    inline: false
                },
                {
                    name: '🌙 Khung Giờ Tối Muộn',
                    value: '**22:00** - Phù hợp cho những người thích chơi muộn',
                    inline: false
                }
            )
            .addFields(
                {
                    name: '📋 Lưu Ý:',
                    value: '• Mỗi khung giờ có thể có **nhiều trận** diễn ra cùng lúc\n• Mỗi trận tối đa **4 người chơi**\n• Admin có thể tạo lịch cho **nhiều ngày** cùng lúc\n• Sử dụng `/schedule dd/mm/yyyy` hoặc `/schedule dd/mm/yyyy,dd/mm/yyyy`',
                    inline: false
                },
                {
                    name: '💡 Ví Dụ:',
                    value: '`/schedule 25/12/2025` → 1 ngày\n`/schedule 25/12/2025,26/12/2025` → 2 ngày\n`/schedule 25/12/2025,26/12/2025,27/12/2025 180` → 3 ngày, vote 3 giờ',
                    inline: false
                }
            )
            .setFooter({ text: 'Liên hệ admin để tạo lịch đấu cho ngày bạn muốn' })
            .setTimestamp();

        await interaction.reply({ embeds: [embed], ephemeral: true });
    }
};
