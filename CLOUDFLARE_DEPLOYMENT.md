# Cloudflare Workers Deployment Guide

## Prerequisites
1. Install Wrangler CLI: `npm install -g wrangler`
2. Have a Cloudflare account
3. Have your Discord bot token, client ID, and guild ID ready

## Setup Steps

### 1. Install Dependencies
```bash
npm install -D wrangler
```

### 2. Login to Cloudflare
```bash
wrangler login
```

### 3. Set Environment Variables
```bash
# Set your Discord bot token
wrangler secret put DISCORD_TOKEN

# Set your Discord client ID
wrangler secret put CLIENT_ID

# Set your Discord guild ID (optional, for guild-specific commands)
wrangler secret put GUILD_ID
```

### 4. Deploy Commands to Discord
First, you need to deploy your slash commands. You can do this from your local environment or create a separate script.

### 5. Deploy to Cloudflare Workers
```bash
# Deploy to production
npm run wrangler:deploy

# Or deploy to staging
wrangler deploy --env staging
```

### 6. Set up Discord Webhook
1. Go to your Discord Application in the Developer Portal
2. Navigate to "General Information"
3. Set "Interactions Endpoint URL" to: `https://your-worker-name.your-subdomain.workers.dev/webhook`
4. Discord will verify the endpoint with a PING request

## Configuration

### wrangler.toml
The configuration file is already set up with:
- Environment variables for tokens
- Optional KV namespaces for data persistence
- Optional R2 buckets for file storage
- Optional cron triggers for scheduled tasks

### Environment Variables
- `DISCORD_TOKEN`: Your Discord bot token
- `CLIENT_ID`: Your Discord application client ID
- `GUILD_ID`: Your Discord guild ID (optional)

## Usage

### Development
```bash
npm run wrangler:dev
```

### Production Deployment
```bash
npm run wrangler:deploy
```

### View Logs
```bash
wrangler tail
```

## Features

### HTTP Endpoints
- `/health` - Health check endpoint
- `/webhook` - Discord webhook endpoint for interactions

### Scheduled Tasks
You can uncomment the cron configuration in `wrangler.toml` to enable scheduled tasks.

### Data Persistence
- Use KV namespaces for storing schedule data
- Use R2 buckets for file storage if needed
- Use Durable Objects for stateful operations

## Migration from Traditional Bot

The Worker-based bot processes Discord interactions via webhooks instead of maintaining a persistent connection. This means:

1. **No persistent state**: Use KV or external storage for data
2. **Stateless operations**: Each interaction is handled independently
3. **Better scalability**: Automatic scaling with Cloudflare's edge network
4. **Lower costs**: Pay only for what you use

## Troubleshooting

### Common Issues
1. **Environment variables not set**: Use `wrangler secret put` to set them
2. **Discord webhook verification**: Ensure your endpoint URL is correct
3. **Import/export issues**: Make sure you're using ES modules syntax

### Debugging
```bash
# View real-time logs
wrangler tail

# View deployment logs
wrangler logs
```
