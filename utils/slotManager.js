const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

class SlotManager {
    constructor() {
        this.activeSchedules = new Map(); // Lưu trữ các lịch đang hoạt động
        this.timeSlots = []; // Sẽ được tạo khi admin set ngày
    }

    generateTimeSlots(targetDates) {
        const slots = [];
        
        // Hỗ trợ nhiều ngày
        const dates = Array.isArray(targetDates) ? targetDates : [targetDates];
        let slotCounter = 0; // Counter để tạo ID unique
        
        dates.forEach(dateData => {
            // Xử lý cả Date object và string
            let baseDate, dateStr;
            
            if (typeof dateData === 'object' && dateData.dateObject) {
                // Dữ liệu từ schedule command (có cả dateObject và formattedDate)
                baseDate = dateData.dateObject;
                dateStr = dateData.formattedDate;
            } else if (typeof dateData === 'string') {
                // Dữ liệu string (fallback)
                baseDate = new Date(dateData);
                dateStr = baseDate.toLocaleDateString('vi-VN', { 
                    day: '2-digit', 
                    month: '2-digit',
                    year: 'numeric'
                });
            } else {
                // Dữ liệu Date object trực tiếp
                baseDate = dateData;
                dateStr = baseDate.toLocaleDateString('vi-VN', { 
                    day: '2-digit', 
                    month: '2-digit',
                    year: 'numeric'
                });
            }
            
            // Chỉ có 2 khung giờ: 20h và 22h
            const timeSlots = [
                { time: '20:00', emoji: '🌆' },
                { time: '22:00', emoji: '🌙' }
            ];
            
            timeSlots.forEach((slot, index) => {
                slotCounter++;
                
                slots.push({
                    emoji: slot.emoji,
                    time: `${slot.time}`,
                    date: dateStr,
                    value: `slot_${slotCounter}`, // Đơn giản hóa custom_id
                    fullDisplay: `${dateStr} - ${slot.time}`,
                    sortKey: baseDate.getTime() + parseInt(slot.time.replace(':', ''))
                });
            });
        });
        
        // Sắp xếp theo thời gian
        slots.sort((a, b) => a.sortKey - b.sortKey);
        
        return slots;
    }

    createScheduleEmbed(channelId, duration = 60, targetDates) {
        const datesStr = Array.isArray(targetDates) ? 
            targetDates.map(d => typeof d === 'object' ? d.formattedDate : d).join(', ') : 
            (typeof targetDates === 'object' ? targetDates.formattedDate : targetDates);
        
        const embed = new EmbedBuilder()
            .setTitle('🎮 Lập Lịch Trận Đấu')
            .setDescription(`Chọn khung thời gian bạn có thể chơi cho các ngày: **${datesStr}**`)
            .setColor('#00FF00')
            .addFields(
                { name: '📅 Ngày thi đấu:', value: datesStr, inline: true },
                { name: '⏰ Thời gian vote:', value: this.formatDuration(duration), inline: true },
                { name: '👥 Tối đa mỗi trận:', value: '4 người chơi', inline: true },
                { name: '🕐 Khung giờ:', value: '🌆 20:00 và 🌙 22:00', inline: true },
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
        
        // Tạo nút cho tất cả slots, nhóm 2 nút mỗi hàng
        const buttonsPerRow = 2;
        
        for (let i = 0; i < this.timeSlots.length; i += buttonsPerRow) {
            const row = new ActionRowBuilder();
            const slotsInRow = this.timeSlots.slice(i, i + buttonsPerRow);
            
            slotsInRow.forEach(slot => {
                row.addComponents(
                    new ButtonBuilder()
                        .setCustomId(slot.value)
                        .setLabel(`${slot.emoji} ${slot.fullDisplay}`)
                        .setStyle(ButtonStyle.Primary)
                );
            });
            
            rows.push(row);
            
            // Discord giới hạn 5 hàng
            if (rows.length >= 5) break;
        }
        
        return rows;
    }

    async createSchedule(interaction, duration = 60, targetDates) {
        const channelId = interaction.channel.id;
        
        // Tạo time slots cho các ngày được chỉ định
        this.timeSlots = this.generateTimeSlots(targetDates);
        
        const scheduleData = {
            channelId,
            createdBy: interaction.user.id,
            createdAt: Date.now(),
            duration: duration * 60000, // Convert to milliseconds
            participants: new Map(), // Map<userId, Set<slotValue>>
            endTime: Date.now() + (duration * 60000),
            targetDates: targetDates,
            timeSlots: this.timeSlots
        };

        this.activeSchedules.set(channelId, scheduleData);

        const embed = this.createScheduleEmbed(channelId, duration, targetDates);
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

        const datesStr = Array.isArray(schedule.targetDates) ? 
            schedule.targetDates.map(d => typeof d === 'object' ? d.formattedDate : d).join(', ') : 
            (typeof schedule.targetDates === 'object' ? schedule.targetDates.formattedDate : schedule.targetDates);

        const embed = new EmbedBuilder()
            .setTitle('🎮 Lập Lịch Trận Đấu')
            .setDescription(`Chọn khung thời gian bạn có thể chơi cho các ngày: **${datesStr}**`)
            .setColor('#00FF00')
            .setFooter({ text: 'Bot sẽ tự động chia trận khi hết thời gian vote. Mỗi khung giờ có thể có nhiều trận.' })
            .setTimestamp();

        // Tính toán thời gian còn lại
        const timeLeft = Math.max(0, schedule.endTime - Date.now());
        const minutesLeft = Math.ceil(timeLeft / 60000);

        embed.addFields(
            { name: '📅 Ngày thi đấu:', value: datesStr, inline: true },
            { name: '⏰ Thời gian còn lại:', value: this.formatDuration(minutesLeft), inline: true },
            { name: '📊 Người tham gia:', value: `${schedule.participants.size} người`, inline: true }
        );

        // Nhóm slots theo ngày
        const slotsByDate = {};
        schedule.timeSlots.forEach(slot => {
            if (!slotsByDate[slot.date]) {
                slotsByDate[slot.date] = [];
            }
            slotsByDate[slot.date].push(slot);
        });

        // Thêm thông tin về từng ngày
        Object.keys(slotsByDate).forEach(date => {
            const daySlots = slotsByDate[date];
            const dayInfo = [];
            
            daySlots.forEach(slot => {
                const playersInSlot = [];
                schedule.participants.forEach((userSlots, userId) => {
                    if (userSlots.has(slot.value)) {
                        playersInSlot.push(`<@${userId}>`);
                    }
                });
                
                if (playersInSlot.length > 0) {
                    dayInfo.push(`${slot.emoji} **${slot.time}**: ${playersInSlot.join(', ')}`);
                }
            });
            
            if (dayInfo.length > 0) {
                embed.addFields({
                    name: `📅 ${date}`,
                    value: dayInfo.join('\n'),
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
        const embed = this.createFinalResultEmbed(matches, schedule.targetDates);

        await channel.send({ embeds: [embed] });

        // Xóa lịch đấu khỏi bộ nhớ
        this.activeSchedules.delete(channelId);
    }

    createMatches(schedule) {
        const matches = [];
        const assignedPlayers = new Set(); // Theo dõi người đã được xếp trận
        
        // Tạo trận cho từng slot theo thứ tự thời gian
        schedule.timeSlots.forEach(slot => {
            const playersInSlot = [];
            
            // Tìm tất cả người chọn slot này và chưa được xếp trận
            schedule.participants.forEach((userSlots, userId) => {
                if (userSlots.has(slot.value) && !assignedPlayers.has(userId)) {
                    playersInSlot.push(userId);
                }
            });

            if (playersInSlot.length > 0) {
                const matchesForSlot = [];
                
                // Chia thành các trận 4 người
                for (let i = 0; i < playersInSlot.length; i += 4) {
                    const playersInMatch = playersInSlot.slice(i, i + 4);
                    matchesForSlot.push(playersInMatch);
                    
                    // Đánh dấu những người đã được xếp trận
                    playersInMatch.forEach(userId => assignedPlayers.add(userId));
                }

                if (matchesForSlot.length > 0) {
                    matches.push({
                        slot: slot,
                        matches: matchesForSlot
                    });
                }
            }
        });

        // Xử lý người dư: gộp vào các trận chưa đủ 4 người
        const remainingPlayers = [];
        schedule.participants.forEach((userSlots, userId) => {
            if (!assignedPlayers.has(userId)) {
                remainingPlayers.push(userId);
            }
        });

        if (remainingPlayers.length > 0) {
            // Tìm các trận chưa đủ 4 người để gộp vào
            let remainingIndex = 0;
            
            for (let matchGroup of matches) {
                for (let match of matchGroup.matches) {
                    while (match.length < 4 && remainingIndex < remainingPlayers.length) {
                        match.push(remainingPlayers[remainingIndex]);
                        assignedPlayers.add(remainingPlayers[remainingIndex]);
                        remainingIndex++;
                    }
                }
            }

            // Nếu vẫn còn người dư, tạo trận mới cho slot đầu tiên có sẵn
            if (remainingIndex < remainingPlayers.length && matches.length > 0) {
                const firstSlot = matches[0].slot;
                const newMatch = [];
                
                while (remainingIndex < remainingPlayers.length && newMatch.length < 4) {
                    newMatch.push(remainingPlayers[remainingIndex]);
                    assignedPlayers.add(remainingPlayers[remainingIndex]);
                    remainingIndex++;
                }
                
                if (newMatch.length > 0) {
                    matches[0].matches.push(newMatch);
                }
            }
        }

        return matches;
    }

    createFinalResultEmbed(matches, targetDates) {
        const datesStr = Array.isArray(targetDates) ? 
            targetDates.map(d => typeof d === 'object' ? d.formattedDate : d).join(', ') : 
            (typeof targetDates === 'object' ? targetDates.formattedDate : targetDates);
        
        const embed = new EmbedBuilder()
            .setTitle('🏆 Kết Quả Chia Trận')
            .setDescription(`Các trận đấu đã được chia cho các ngày: **${datesStr}**`)
            .setColor('#FFD700')
            .setTimestamp();

        if (matches.length === 0) {
            embed.setDescription(`❌ Không có trận đấu nào được tạo cho các ngày **${datesStr}** do không có người tham gia!`);
            return embed;
        }

        // Thống kê tổng số người tham gia
        let totalPlayers = 0;
        let totalMatches = 0;
        
        matches.forEach((slotData, index) => {
            const { slot, matches: slotMatches } = slotData;
            
            slotMatches.forEach((match, matchIndex) => {
                totalMatches++;
                totalPlayers += match.length;
                
                const playerList = match.map(userId => `<@${userId}>`).join(', ');
                const matchStatus = match.length === 4 ? '✅' : '⚠️';
                
                embed.addFields({
                    name: `${matchStatus} ${slot.emoji} ${slot.fullDisplay} - Trận ${matchIndex + 1}`,
                    value: `👥 ${playerList} (${match.length}/4 người)`,
                    inline: false
                });
            });
        });

        // Thêm thông tin tổng quan
        embed.addFields({
            name: '📊 Thống Kê',
            value: `🎮 Tổng số trận: ${totalMatches}\n👥 Tổng số người chơi: ${totalPlayers}\n⚡ Mỗi người chỉ tham gia 1 trận duy nhất`,
            inline: false
        });

        embed.setFooter({ text: 'Chúc các bạn chơi vui vẻ! (✅ = đủ 4 người, ⚠️ = chưa đủ 4 người)' });
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
