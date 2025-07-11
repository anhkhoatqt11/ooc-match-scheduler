import { SlashCommandBuilder } from 'discord.js';

const helpCommand = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Xem hướng dẫn sử dụng bot'),
    
    async execute(interaction) {
        const helpText = `
🤖 **Hướng Dẫn Sử Dụng Bot Lập Lịch Trận Đấu**

**Các lệnh có sẵn:**
📅 \`/schedule <dates> [duration]\` - Tạo lịch đấu cho ngày cụ thể
❌ \`/cancel\` - Hủy lịch đấu hiện tại
📊 \`/status\` - Xem trạng thái lịch đấu hiện tại
🕐 \`/slots\` - Xem tất cả khung giờ có sẵn
❓ \`/help\` - Xem hướng dẫn này

**Cách Sử Dụng:**
1. Admin dùng \`/schedule 15/07/2025\` hoặc \`/schedule 15/07/2025,16/07/2025\`
2. Người chơi có thể chọn nhiều khung giờ (20h và/hoặc 22h)
3. Bot tự động chia trận khi hết thời gian
4. **Xếp trận hoàn toàn ngẫu nhiên** - mỗi người chỉ được xếp vào 1 trận

**Khung Giờ Cố Định:**
🌆 **20:00** - Tối
🌙 **22:00** - Khuya

**Cơ Chế Xếp Trận:**
• Bạn có thể chọn cả 20h và 22h
• **Bot xếp trận hoàn toàn ngẫu nhiên** để đảm bảo công bằng
• Một khi đã được xếp trận, bạn sẽ không xuất hiện ở khung giờ khác
• Mỗi người chỉ chơi 1 trận, tránh tình trạng ai đó phải chơi nhiều trận
        `;

        await interaction.reply({ content: helpText, ephemeral: true });
    },
};

export default helpCommand;
