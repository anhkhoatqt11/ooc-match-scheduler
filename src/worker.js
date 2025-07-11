import { Client, Collection, GatewayIntentBits } from 'discord.js';
import { SlotManager } from './utils/slotManager';

// Import commands
import scheduleCommand from './commands/schedule';
import cancelCommand from './commands/cancel';
import statusCommand from './commands/status';
import slotsCommand from './commands/slots';
import helpCommand from './commands/help';

// Import events
import readyEvent from './events/ready';
import interactionCreateEvent from './events/interactionCreate';

export default {
    async fetch(request, env, ctx) {
        // Handle HTTP requests to the worker
        const url = new URL(request.url);
        
        if (url.pathname === '/health') {
            return new Response(JSON.stringify({
                status: 'healthy',
                timestamp: new Date().toISOString(),
                version: '1.0.0'
            }), {
                headers: { 'Content-Type': 'application/json' }
            });
        }

        if (url.pathname === '/webhook' && request.method === 'POST') {
            // Handle Discord webhook interactions
            return handleDiscordWebhook(request, env);
        }

        return new Response('OOC Match Scheduler Bot is running!', {
            headers: { 'Content-Type': 'text/plain' }
        });
    },

    async scheduled(event, env, ctx) {
        // Handle scheduled tasks (cron jobs)
        console.log('Scheduled task triggered:', event.cron);
        
        // You can add scheduled tasks here, for example:
        // - Clean up old schedules
        // - Send reminder messages
        // - Update bot statistics
        
        return new Response('Scheduled task completed');
    }
};

async function handleDiscordWebhook(request, env) {
    try {
        const body = await request.json();
        
        // Verify Discord webhook signature
        const signature = request.headers.get('X-Signature-Ed25519');
        const timestamp = request.headers.get('X-Signature-Timestamp');
        
        if (!signature || !timestamp) {
            return new Response('Missing signature headers', { status: 401 });
        }

        // Handle interaction
        return await processDiscordInteraction(body, env);
        
    } catch (error) {
        console.error('Error handling webhook:', error);
        return new Response('Internal Server Error', { status: 500 });
    }
}

async function processDiscordInteraction(interaction, env) {
    // Initialize Discord client for this interaction
    const client = new Client({ 
        intents: [
            GatewayIntentBits.Guilds, 
            GatewayIntentBits.GuildMessages, 
            GatewayIntentBits.GuildMessageReactions
        ] 
    });

    client.commands = new Collection();
    
    // Load commands
    const commands = {
        schedule: scheduleCommand,
        cancel: cancelCommand,
        status: statusCommand,
        slots: slotsCommand,
        help: helpCommand
    };

    Object.values(commands).forEach(command => {
        client.commands.set(command.data.name, command);
    });

    // Process the interaction
    if (interaction.type === 1) {
        // PING interaction
        return new Response(JSON.stringify({ type: 1 }), {
            headers: { 'Content-Type': 'application/json' }
        });
    }

    if (interaction.type === 2) {
        // APPLICATION_COMMAND interaction
        const command = client.commands.get(interaction.data.name);
        
        if (!command) {
            return new Response(JSON.stringify({
                type: 4,
                data: {
                    content: 'Unknown command!',
                    flags: 64 // EPHEMERAL
                }
            }), {
                headers: { 'Content-Type': 'application/json' }
            });
        }

        try {
            await command.execute(interaction);
            
            return new Response(JSON.stringify({
                type: 4,
                data: {
                    content: 'Command executed successfully!',
                    flags: 64 // EPHEMERAL
                }
            }), {
                headers: { 'Content-Type': 'application/json' }
            });
        } catch (error) {
            console.error('Command execution error:', error);
            
            return new Response(JSON.stringify({
                type: 4,
                data: {
                    content: 'There was an error executing this command!',
                    flags: 64 // EPHEMERAL
                }
            }), {
                headers: { 'Content-Type': 'application/json' }
            });
        }
    }

    if (interaction.type === 3) {
        // MESSAGE_COMPONENT interaction (buttons)
        try {
            await interactionCreateEvent.execute(interaction, client);
            
            return new Response(JSON.stringify({
                type: 4,
                data: {
                    content: 'Button interaction handled!',
                    flags: 64 // EPHEMERAL
                }
            }), {
                headers: { 'Content-Type': 'application/json' }
            });
        } catch (error) {
            console.error('Button interaction error:', error);
            
            return new Response(JSON.stringify({
                type: 4,
                data: {
                    content: 'There was an error handling this interaction!',
                    flags: 64 // EPHEMERAL
                }
            }), {
                headers: { 'Content-Type': 'application/json' }
            });
        }
    }

    return new Response('Unknown interaction type', { status: 400 });
}
