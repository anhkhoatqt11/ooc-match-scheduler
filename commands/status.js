const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { slotManager } = require('./schedule');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('status')
        .setDescription('Xem trạng thái lịch đấu hiện tại'),
    
    async execute(interaction) {
        const channelId = interaction.channel.id;
        const schedule = slotManager.getActiveSchedule(channelId);
        
        if (!schedule) {
            return interaction.reply({ 
                content: '❌ Không có lịch đấu hoạt động trong kênh này!', 
                ephemeral: true 
            });
        }

        const embed = new EmbedBuilder()
            .setTitle('📊 Trạng Thái Lịch Đấu')
            .setColor('#0099ff')
            .setTimestamp();

        // Tính toán thời gian còn lại
        const timeLeft = Math.max(0, schedule.endTime - Date.now());
        const minutesLeft = Math.ceil(timeLeft / 60000);

        embed.addFields(
            { name: '👤 Người tạo:', value: `<@${schedule.createdBy}>`, inline: true },
            { name: '⏰ Thời gian còn lại:', value: `${minutesLeft} phút`, inline: true },
            { name: '👥 Số người tham gia:', value: `${schedule.participants.size} người`, inline: true }
        );

        // Thêm thông tin chi tiết về từng slot
        const slotInfo = [];
        slotManager.timeSlots.forEach(slot => {
            const playersInSlot = [];
            schedule.participants.forEach((userSlots, userId) => {
                if (userSlots.has(slot.value)) {
                    playersInSlot.push(`<@${userId}>`);
                }
            });

            if (playersInSlot.length > 0) {
                slotInfo.push(`${slot.emoji} **${slot.time}**: ${playersInSlot.join(', ')}`);
            }
        });

        if (slotInfo.length > 0) {
            embed.setDescription(slotInfo.join('\n'));
        } else {
            embed.setDescription('Chưa có ai đăng ký khung giờ nào.');
        }

        await interaction.reply({ embeds: [embed], ephemeral: true });
    },
};
