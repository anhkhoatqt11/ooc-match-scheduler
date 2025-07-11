const readyEvent = {
    name: 'ready',
    once: true,
    execute(client) {
        console.log(`Bot online as ${client.user.tag}`);
    },
};

export default readyEvent;
