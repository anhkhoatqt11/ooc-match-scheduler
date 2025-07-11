module.exports = {
    name: 'ready',
    once: true,
    execute(client) {
        console.log(`Bot online as ${client.user.tag}`);
    },
};
