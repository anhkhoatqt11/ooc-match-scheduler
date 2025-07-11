const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

class SlotManager {
    constructor() {
        this.activeSchedules = new Map(); // Lưu trữ các lịch đang hoạt động
        this.timeSlots = []; // Sẽ được tạo khi admin set ngày
    }

    generateTimeSlots(targetDate) {
        const slots = [];
        const baseDate = new Date(targetDate);
        
        // Chỉ tạo slots cho ngày được chỉ định
        const dateStr = baseDate.toLocaleDateString('vi-VN', { 
            day: '2-digit', 
            month: '2-digit',
            year: 'numeric'
        });
        
        // Chỉ có 2 khung giờ: 8h và 21h
        const timeSlots = [
            { time: '08:00', emoji: '🌅' },
            { time: '21:00', emoji: '🌙' }
        ];
        
        timeSlots.forEach(slot => {
            slots.push({
                emoji: slot.emoji,
                time: `${slot.time}`,
                date: dateStr,
                value: `slot_${dateStr.replace(/\//g, '')}_${slot.time.replace(':', '')}`,
                fullDisplay: `${dateStr} - ${slot.time}`,
                sortKey: parseInt(slot.time.replace(':', ''))
            });
        });
        
        return slots;
    }

    createScheduleEmbed(channelId, duration = 60, targetDate) {
        const embed = new EmbedBuilder()
            .setTitle('🎮 Lập Lịch Trận Đấu')
            .setDescription(`Chọn khung thời gian bạn có thể chơi cho ngày **${targetDate}**`)
            .setColor('#00FF00')
            .addFields(
                { name: '📅 Ngày thi đấu:', value: targetDate, inline: true },
                { name: '⏰ Thời gian vote:', value: this.formatDuration(duration), inline: true },
                { name: '👥 Tối đa mỗi trận:', value: '4 người chơi', inline: true },
                { name: '🕐 Khung giờ:', value: '🌅 08:00 và 🌙 21:00', inline: true },
                { name: '📊 Trạng thái:', value: 'Đang mở vote', inline: true }
            )
            .setFooter({ text: 'Bot sẽ tự động chia trận khi hết thời gian vote. Mỗi khung giờ có thể có nhiều trận.' })
            .setTimestamp();

        return embed;
    }

    formatDuration(minutes) {
        if (minutes < 60) {
            return `${minutes} phút`;
        } else if (minutes < 1440) {
            const hours = Math.floor(minutes / 60);
            const mins = minutes % 60;
            return mins > 0 ? `${hours} giờ ${mins} phút` : `${hours} giờ`;
        } else {
            const days = Math.floor(minutes / 1440);
            const hours = Math.floor((minutes % 1440) / 60);
            const mins = minutes % 60;
            let result = `${days} ngày`;
            if (hours > 0) result += ` ${hours} giờ`;
            if (mins > 0) result += ` ${mins} phút`;
            return result;
        }
    }

    createButtons() {
        const rows = [];
        
        if (this.timeSlots.length === 0) {
            return rows;
        }
        
        // Tạo 1 hàng với 2 nút (8h và 21h)
        const row = new ActionRowBuilder();
        
        this.timeSlots.forEach(slot => {
            row.addComponents(
                new ButtonBuilder()
                    .setCustomId(slot.value)
                    .setLabel(`${slot.emoji} ${slot.date} - ${slot.time}`)
                    .setStyle(ButtonStyle.Primary)
            );
        });
        
        rows.push(row);
        return rows;
    }

    async createSchedule(interaction, duration = 60, targetDate) {
        const channelId = interaction.channel.id;
        
        // Tạo time slots cho ngày được chỉ định
        this.timeSlots = this.generateTimeSlots(targetDate);
        
        const scheduleData = {
            channelId,
            createdBy: interaction.user.id,
            createdAt: Date.now(),
            duration: duration * 60000, // Convert to milliseconds
            participants: new Map(), // Map<userId, Set<slotValue>>
            endTime: Date.now() + (duration * 60000),
            targetDate: targetDate,
            timeSlots: this.timeSlots
        };

        this.activeSchedules.set(channelId, scheduleData);

        const embed = this.createScheduleEmbed(channelId, duration, targetDate);
        const buttons = this.createButtons();

        await interaction.reply({
            embeds: [embed],
            components: buttons
        });

        // Tự động kết thúc sau thời gian đã định
        setTimeout(() => {
            this.finalizeSchedule(channelId, interaction.client);
        }, duration * 60000);
    }

    async handleButtonInteraction(interaction) {
        const channelId = interaction.channel.id;
        const userId = interaction.user.id;
        const slotValue = interaction.customId;

        const schedule = this.activeSchedules.get(channelId);
        if (!schedule) {
            return interaction.reply({ content: '❌ Không tìm thấy lịch đấu hoạt động!', ephemeral: true });
        }

        // Kiểm tra xem thời gian vote đã hết chưa
        if (Date.now() > schedule.endTime) {
            return interaction.reply({ content: '❌ Thời gian vote đã kết thúc!', ephemeral: true });
        }

        // Khởi tạo user nếu chưa tồn tại
        if (!schedule.participants.has(userId)) {
            schedule.participants.set(userId, new Set());
        }

        const userSlots = schedule.participants.get(userId);
        
        // Toggle slot
        if (userSlots.has(slotValue)) {
            userSlots.delete(slotValue);
            await interaction.reply({ content: `✅ Đã bỏ chọn khung giờ ${this.getSlotInfo(slotValue, schedule.timeSlots)}!`, ephemeral: true });
        } else {
            userSlots.add(slotValue);
            await interaction.reply({ content: `✅ Đã chọn khung giờ ${this.getSlotInfo(slotValue, schedule.timeSlots)}!`, ephemeral: true });
        }

        // Cập nhật embed với thông tin mới
        await this.updateScheduleEmbed(interaction);
    }

    async updateScheduleEmbed(interaction) {
        const channelId = interaction.channel.id;
        const schedule = this.activeSchedules.get(channelId);
        
        if (!schedule) return;

        const embed = new EmbedBuilder()
            .setTitle('🎮 Lập Lịch Trận Đấu')
            .setDescription(`Chọn khung thời gian bạn có thể chơi cho ngày **${schedule.targetDate}**`)
            .setColor('#00FF00')
            .setFooter({ text: 'Bot sẽ tự động chia trận khi hết thời gian vote. Mỗi khung giờ có thể có nhiều trận.' })
            .setTimestamp();

        // Tính toán thời gian còn lại
        const timeLeft = Math.max(0, schedule.endTime - Date.now());
        const minutesLeft = Math.ceil(timeLeft / 60000);

        embed.addFields(
            { name: '📅 Ngày thi đấu:', value: schedule.targetDate, inline: true },
            { name: '⏰ Thời gian còn lại:', value: this.formatDuration(minutesLeft), inline: true },
            { name: '📊 Người tham gia:', value: `${schedule.participants.size} người`, inline: true }
        );

        // Thêm thông tin về từng khung giờ
        schedule.timeSlots.forEach(slot => {
            const playersInSlot = [];
            schedule.participants.forEach((userSlots, userId) => {
                if (userSlots.has(slot.value)) {
                    playersInSlot.push(`<@${userId}>`);
                }
            });
            
            if (playersInSlot.length > 0) {
                embed.addFields({
                    name: `${slot.emoji} ${slot.fullDisplay}`,
                    value: `👥 ${playersInSlot.join(', ')} (${playersInSlot.length} người)`,
                    inline: false
                });
            }
        });

        // Sử dụng timeSlots từ schedule
        this.timeSlots = schedule.timeSlots;
        const buttons = this.createButtons();
        await interaction.editReply({
            embeds: [embed],
            components: buttons
        });
    }

    async finalizeSchedule(channelId, client) {
        const schedule = this.activeSchedules.get(channelId);
        if (!schedule) return;

        const channel = client.channels.cache.get(channelId);
        if (!channel) return;

        // Tạo các trận đấu
        const matches = this.createMatches(schedule);
        const embed = this.createFinalResultEmbed(matches, schedule.targetDate);

        await channel.send({ embeds: [embed] });

        // Xóa lịch đấu khỏi bộ nhớ
        this.activeSchedules.delete(channelId);
    }

    createMatches(schedule) {
        const matches = [];
        
        schedule.timeSlots.forEach(slot => {
            const playersInSlot = [];
            schedule.participants.forEach((userSlots, userId) => {
                if (userSlots.has(slot.value)) {
                    playersInSlot.push(userId);
                }
            });

            if (playersInSlot.length > 0) {
                // Chia thành các trận 4 người
                const matchesForSlot = [];
                for (let i = 0; i < playersInSlot.length; i += 4) {
                    const playersInMatch = playersInSlot.slice(i, i + 4);
                    matchesForSlot.push(playersInMatch);
                }

                matches.push({
                    slot: slot,
                    matches: matchesForSlot
                });
            }
        });

        return matches;
    }

    createFinalResultEmbed(matches, targetDate) {
        const embed = new EmbedBuilder()
            .setTitle('🏆 Kết Quả Chia Trận')
            .setDescription(`Các trận đấu đã được chia cho ngày **${targetDate}**:`)
            .setColor('#FFD700')
            .setTimestamp();

        if (matches.length === 0) {
            embed.setDescription(`❌ Không có trận đấu nào được tạo cho ngày **${targetDate}** do không có người tham gia!`);
            return embed;
        }

        matches.forEach((slotData, index) => {
            const { slot, matches: slotMatches } = slotData;
            
            slotMatches.forEach((match, matchIndex) => {
                const playerList = match.map(userId => `<@${userId}>`).join(', ');
                embed.addFields({
                    name: `${slot.emoji} ${slot.fullDisplay} - Trận ${matchIndex + 1}`,
                    value: `👥 ${playerList} (${match.length} người)`,
                    inline: false
                });
            });
        });

        embed.setFooter({ text: 'Chúc các bạn chơi vui vẻ!' });
        return embed;
    }

    getSlotInfo(slotValue, timeSlots) {
        const slot = timeSlots.find(s => s.value === slotValue);
        return slot ? `${slot.emoji} ${slot.fullDisplay}` : slotValue;
    }

    getActiveSchedule(channelId) {
        return this.activeSchedules.get(channelId);
    }

    hasActiveSchedule(channelId) {
        return this.activeSchedules.has(channelId);
    }
}

module.exports = SlotManager;
