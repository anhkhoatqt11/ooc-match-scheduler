const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Xem hướng dẫn sử dụng bot'),
    
    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setTitle('🤖 Hướng Dẫn Sử Dụng Bot Lập Lịch Trận Đấu')
            .setDescription('Dưới đây là các lệnh có sẵn:')
            .setColor('#00ff00')
            .addFields(
                {
                    name: '📅 `/schedule <dates> [duration]`',
                    value: '• Tạo lịch đấu cho ngày cụ thể\n• `dates`: Ngày thi đấu (dd/mm/yyyy hoặc dd/mm/yyyy,dd/mm/yyyy) - **BẮT BUỘC**\n• `duration`: Thời gian vote (phút, mặc định 60)\n• **Chỉ admin mới dùng được**',
                    inline: false
                },
                {
                    name: '❌ `/cancel`',
                    value: '• Hủy lịch đấu hiện tại\n• **Chỉ admin hoặc người tạo mới dùng được**',
                    inline: false
                },
                {
                    name: '📊 `/status`',
                    value: '• Xem trạng thái lịch đấu hiện tại\n• **Mọi người đều dùng được**',
                    inline: false
                },
                {
                    name: '🕐 `/slots`',
                    value: '• Xem tất cả khung giờ có sẵn\n• **Mọi người đều dùng được**',
                    inline: false
                },
                {
                    name: '❓ `/help`',
                    value: '• Xem hướng dẫn này\n• **Mọi người đều dùng được**',
                    inline: false
                }
            )
            .addFields(
                {
                    name: '📝 Cách Sử Dụng:',
                    value: '1. Admin dùng `/schedule 15/07/2025` hoặc `/schedule 15/07/2025,16/07/2025` để tạo lịch đấu\n2. **Người chơi có thể chọn nhiều khung giờ** (20h và/hoặc 22h)\n3. Bot tự động chia trận khi hết thời gian\n4. **Mỗi người chỉ được xếp vào 1 trận duy nhất** (ưu tiên khung giờ sớm hơn)\n5. Người dư sẽ được gộp vào các trận chưa đủ 4 người',
                    inline: false
                },
                {
                    name: '🕐 Khung Giờ Cố Định:',
                    value: '� **20:00** - Tối\n🌙 **22:00** - Khuya\n\n📅 **Ví dụ**: `/schedule 25/12/2025 120` (vote trong 2 giờ)',
                    inline: false
                },
                {
                    name: '⏰ Thời Gian Vote:',
                    value: '• Tối thiểu: 1 phút\n• Tối đa: 7 ngày (10080 phút)\n• Mặc định: 60 phút',
                    inline: false
                },
                {
                    name: '🎯 Cơ Chế Xếp Trận:',
                    value: '• Bạn có thể chọn cả 20h và 22h\n• Bot sẽ ưu tiên xếp bạn vào khung giờ sớm hơn (20h)\n• Một khi đã được xếp trận, bạn sẽ không xuất hiện ở khung giờ khác\n• Đảm bảo công bằng: mỗi người chỉ chơi 1 trận',
                    inline: false
                }
            )
            .setFooter({ text: 'Bot được tạo để giúp lập lịch trận đấu tự động' })
            .setTimestamp();

        await interaction.reply({ embeds: [embed], ephemeral: true });
    },
};
