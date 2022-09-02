<script>
    let stats = {};

    const request = async () => {
        const res = await fetch("/api/stats");
        stats = await res.json();
    };
    request();
</script>

<div class="container">
    <h1>Description</h1>
    <blockquote>
        <p>Okeybot provides a variety of fun and utility commands<br />If you have any questions or suggestions you can use the <b>?suggest</b> command</p>
    </blockquote>

    <h1>Usage</h1>
    <blockquote>
        <p>The default command prefix is "<b>?</b>"<br />The prefix can be changed per channel by using the <b>?prefix</b> command<br />You can run commands by typing the prefix followed by the command name, for example you would run the ping command by typing <b>?ping</b></p>
        <p>Some commands have pre-defined user cooldowns to prevent spam</p>
    </blockquote>

    <h1>Add the bot</h1>
    <blockquote>
        <p>Use the following commands if you want Okeybot added in a channel</p>
        <ul>
            <li><b>?addbot</b> for adding the bot in your chat</li>
            <li><b>?addbot <u>(channel name)</u></b> for adding the bot in a chat that you moderate</li>
        </ul>
        <p>The bot will automatically rejoin after a name change or a Twitch suspension, this process will take up to 30 minutes</p>
        <p>If you want the bot removed from your channel, you can just ban it <img class="emote" alt="4Head" src="4Head.png" /></p>
    </blockquote>

    <h1>Stats</h1>
    <blockquote>
        <table>
            <tr>
                <th>Active Channels</th>
                <td>{stats.channelCount ?? "..."}</td>
            </tr>
            <tr>
                <th>Issued Commands</th>
                <td>{stats.issuedCommands?.total ?? "..."}</td>
            </tr>
        </table>
    </blockquote>
</div>

<style>
    p,
    li {
        font-size: 1.3em;
        margin: 0;
    }

    h1 {
        margin: 0;
    }

    ul {
        margin-top: 0;
        margin-bottom: 10px;
    }

    blockquote {
        margin: 0 5px 20px;
        padding: 0 10px;
        border-left: 2px solid gray;
        border-radius: 10px;
    }

    .emote {
        height: 1.3em;
    }

    .container {
        max-width: 800px;
    }
</style>
