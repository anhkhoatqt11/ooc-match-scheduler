const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const SlotManager = require('../utils/slotManager');

const slotManager = new SlotManager();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('schedule')
        .setDescription('Tạo lịch đấu cho các ngày cụ thể')
        .addStringOption(option =>
            option.setName('dates')
                .setDescription('Ngày thi đấu (dd/mm/yyyy hoặc dd/mm/yyyy,dd/mm/yyyy cho nhiều ngày)')
                .setRequired(true)
        )
        .addIntegerOption(option =>
            option.setName('duration')
                .setDescription('Thời gian vote (phút - tối đa 7 ngày)')
                .setRequired(false)
                .setMinValue(1)
                .setMaxValue(10080) // 7 ngày = 10080 phút
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
    
    async execute(interaction) {
        // Kiểm tra quyền admin
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
            return interaction.reply({ 
                content: '❌ Bạn không có quyền sử dụng lệnh này! Cần quyền "Manage Messages".', 
                ephemeral: true 
            });
        }

        // Kiểm tra xem đã có lịch đấu hoạt động chưa
        if (slotManager.hasActiveSchedule(interaction.channel.id)) {
            return interaction.reply({ 
                content: '❌ Đã có lịch đấu đang hoạt động trong kênh này!', 
                ephemeral: true 
            });
        }

        const datesInput = interaction.options.getString('dates');
        const duration = interaction.options.getInteger('duration') || 60; // Mặc định 60 phút
        
        // Tách các ngày (có thể là 1 hoặc nhiều ngày)
        const dateStrings = datesInput.split(',').map(d => d.trim());
        const validDates = [];
        const dateRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
        
        for (const dateStr of dateStrings) {
            const match = dateStr.match(dateRegex);
            
            if (!match) {
                return interaction.reply({ 
                    content: `❌ Định dạng ngày không đúng: "${dateStr}"!\nVui lòng sử dụng định dạng dd/mm/yyyy\nVí dụ: 15/07/2025 hoặc 15/07/2025,16/07/2025`, 
                    ephemeral: true 
                });
            }
            
            const [, day, month, year] = match;
            const targetDate = new Date(year, month - 1, day);
            
            // Kiểm tra ngày có hợp lệ không
            if (targetDate.getDate() != day || targetDate.getMonth() != month - 1 || targetDate.getFullYear() != year) {
                return interaction.reply({ 
                    content: `❌ Ngày không hợp lệ: "${dateStr}"! Vui lòng kiểm tra lại ngày/tháng/năm.`, 
                    ephemeral: true 
                });
            }
            
            // Kiểm tra ngày không được trong quá khứ
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (targetDate < today) {
                return interaction.reply({ 
                    content: `❌ Không thể tạo lịch đấu cho ngày trong quá khứ: "${dateStr}"!`, 
                    ephemeral: true 
                });
            }
            
            // Lưu cả Date object và formatted string
            validDates.push({
                dateObject: targetDate,
                formattedDate: targetDate.toLocaleDateString('vi-VN', {
                    day: '2-digit',
                    month: '2-digit', 
                    year: 'numeric'
                })
            });
        }
        
        // Giới hạn tối đa 7 ngày
        if (validDates.length > 7) {
            return interaction.reply({ 
                content: '❌ Tối đa chỉ có thể tạo lịch cho 7 ngày!', 
                ephemeral: true 
            });
        }
        
        try {
            await slotManager.createSchedule(interaction, duration, validDates);
        } catch (error) {
            console.error('Error creating schedule:', error);
            await interaction.reply({ 
                content: '❌ Có lỗi xảy ra khi tạo lịch đấu!', 
                ephemeral: true 
            });
        }
    },

    // Export slotManager để các file khác có thể sử dụng
    slotManager
};
