import { SlashCommandBuilder } from 'discord.js';

const slotsCommand = {
    data: new SlashCommandBuilder()
        .setName('slots')
        .setDescription('Xem tất cả khung giờ có sẵn'),
    
    async execute(interaction) {
        const slotsText = `
🕐 **Khung Giờ Có Sẵn:**

🌆 **20:00** - Tối
🌙 **22:00** - Khuya

**Lưu ý:**
• Bạn có thể chọn 1 hoặc nhiều khung giờ
• Bot sẽ xếp trận ngẫu nhiên để đảm bảo công bằng
• Mỗi người chỉ được xếp vào 1 trận duy nhất
• Mỗi trận tối đa 4 người chơi
        `;
        
        await interaction.reply({ content: slotsText, ephemeral: true });
    },
};

export default slotsCommand;
