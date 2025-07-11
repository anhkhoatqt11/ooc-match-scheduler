# 🎮 OOC Match Scheduler Bot

Bot Discord tự động lập lịch trận đấu với chức năng vote khung giờ và chia trận tự động.

## ✨ Tính năng

- **Tạo lịch đấu**: Admin có thể tạo lịch đấu với thời gian vote tùy chỉnh
- **Vote khung giờ**: Người chơi chọn khung giờ phù hợp bằng cách nhấn nút
- **Chia trận tự động**: Bot tự động chia thành các trận 4 người khi hết thời gian vote
- **Quản lý lịch**: Xem trạng thái, hủy lịch, và nhiều tính năng khác

## 🚀 Cài đặt

### 1. Cài đặt dependencies

```bash
npm install
```

### 2. Cấu hình bot

1. Sao chép file `.env.example` thành `.env`
2. Điền thông tin bot Discord:
   - `DISCORD_TOKEN`: Token của bot
   - `CLIENT_ID`: ID của bot
   - `GUILD_ID`: ID của server Discord

### 3. Deploy commands

```bash
npm run deploy
```

### 4. Chạy bot

```bash
npm start
```

Hoặc chạy ở chế độ development:

```bash
npm run dev
```

## 🎯 Cách sử dụng

### Lệnh dành cho Admin:

- `/schedule [duration]` - Tạo lịch đấu mới (duration: thời gian vote tính bằng phút)
- `/cancel` - Hủy lịch đấu hiện tại

### Lệnh dành cho mọi người:

- `/status` - Xem trạng thái lịch đấu hiện tại
- `/help` - Xem hướng dẫn sử dụng

### Quy trình sử dụng:

1. **Admin tạo lịch**: Sử dụng `/schedule` để tạo lịch đấu
2. **Người chơi vote**: Nhấn các nút emoji để chọn khung giờ phù hợp
3. **Bot chia trận**: Khi hết thời gian vote, bot tự động chia thành các trận 4 người
4. **Kết quả**: Bot hiển thị danh sách các trận đấu với thành viên

## 🕐 Khung giờ có sẵn

- 🌅 6:00 AM
- 🌄 8:00 AM  
- ☀️ 10:00 AM
- 🌞 12:00 PM
- 🌤️ 2:00 PM
- 🌇 4:00 PM
- 🌆 6:00 PM
- 🌃 8:00 PM
- 🌙 10:00 PM

## 🔧 Cấu hình

Bạn có thể điều chỉnh cấu hình trong file `config.json`:

- `maxPlayersPerMatch`: Số người tối đa mỗi trận (mặc định: 4)
- `defaultVoteDuration`: Thời gian vote mặc định (phút)
- `timeSlots`: Danh sách khung giờ và emoji tương ứng

## 🛠️ Cấu trúc dự án

```
ooc-match-scheduler/
├── commands/           # Các lệnh slash command
│   ├── schedule.js    # Lệnh tạo lịch đấu
│   ├── cancel.js      # Lệnh hủy lịch
│   ├── status.js      # Lệnh xem trạng thái
│   └── help.js        # Lệnh hướng dẫn
├── events/            # Xử lý sự kiện Discord
│   ├── ready.js       # Khi bot sẵn sàng
│   └── interactionCreate.js  # Xử lý tương tác
├── utils/             # Tiện ích
│   └── slotManager.js # Quản lý lịch đấu
├── config.json        # Cấu hình bot
├── index.js           # File chính
├── deploy-commands.js # Deploy lệnh
└── package.json       # Dependencies
```

## 📝 Giấy phép

ISC License

## 🤝 Đóng góp

Mọi đóng góp đều được chào đón! Vui lòng tạo issue hoặc pull request.

## 🆘 Hỗ trợ

Nếu gặp vấn đề, vui lòng tạo issue trên GitHub hoặc liên hệ admin.
