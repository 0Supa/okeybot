<script>
    let data;
    let commands;

    let categories = [];
    let td = [];

    let searchInput;
    let command;
    let category;

    const changeCategory = (el) => {
        category = el.target.value;
        searchInput = "";
        td = data[category];
        expand();
    };

    const search = () => {
        const r = searchInput.toLowerCase();
        if (!r.length) return (td = data[category]);
        td = commands.filter((c) => [c.name, c.description, c.aliases.join(" ")].find((s) => s.toLowerCase().includes(r)));
        expand();
    };

    const expand = (name) => {
        let path = "/commands";
        if (!name) {
            if (!command) return;
            command = null;
        } else {
            command = commands.find((c) => c.name === name);
            if (command) path += `/${encodeURIComponent(command.name)}`;
        }

        window.history.pushState({}, null, path);
    };

    const parseParams = () => {
        const cmdName = window.location.pathname.split("/")[2];
        if (cmdName) expand(decodeURIComponent(cmdName));
    };

    const fetchCommands = async () => {
        const res = await fetch("/api/commands");
        data = await res.json();

        commands = Object.values(data).reduce((a, b) => a.concat(b));
        categories = Object.keys(data);
        category = categories[0];
        td = data[category];
        parseParams();
    };
    fetchCommands();
</script>

<svelte:head>
    <title>Commands / Okeybot</title>
</svelte:head>

<div class="container">
    <div class="filter">
        {#each categories as text}
            <button value={text} class:active={!searchInput && text === category} on:click={changeCategory}>{text}</button>
        {/each}
        <input bind:value={searchInput} on:input={search} class="search" type="text" placeholder="🔎 Search..." />
    </div>

    <div class="data">
        {#if command}
            <div class="details" on:click={() => expand()}>
                <table>
                    <tr>
                        <th>Name</th>
                        <td>{command.name}</td>
                    </tr>
                    <tr>
                        <th>Aliases</th>
                        <td>{command.aliases.length ? command.aliases.join(", ") : "N/A"}</td>
                    </tr>
                    <tr>
                        <th>Access</th>
                        <td>{command.access ?? "everyone"}</td>
                    </tr>
                    <tr>
                        <th>Cooldown</th>
                        <td>{command.cooldown ? `${command.cooldown} seconds` : "N/A"}</td>
                    </tr>
                    <tr>
                        <th>Usage</th>
                        <td>?{command.name} {command.usage ?? ""}</td>
                    </tr>
                    <tr>
                        <th>Description</th>
                        <td>{command.description}</td>
                    </tr>
                    <tr>
                        <th>Code</th>
                        <td>
                            <a on:click={(e) => e.stopPropagation()} target="_blank" href="https://github.com/0Supa/okeybot/blob/main/lib/commands/{encodeURIComponent(command.name)}.js">GitHub</a>
                        </td>
                    </tr>
                </table>
                {#if command.extended}
                    <div on:click={(e) => e.stopPropagation()} class="extended">
                        {@html command.extended}
                    </div>
                {/if}
            </div>
        {:else if td.length}
            <table class="commands">
                <thead>
                    <tr>
                        <th>Command</th>
                        <th>Description</th>
                        <th>Cooldown</th>
                    </tr>
                </thead>
                <tbody>
                    {#each td as command}
                        <tr on:click={expand(command.name)}>
                            <td class="center bold">{command.name}</td>
                            <td class="desc">{command.description}</td>
                            <td class="center">{command.cooldown} seconds</td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        {:else if data}
            <h1>Nothing found :(</h1>
        {/if}
    </div>
</div>

<style>
    table.commands {
        width: 100%;
        border-spacing: 1px;
    }

    th,
    td {
        padding: 0.5em;
        background-color: rgba(145, 145, 145, 0.1);
    }

    td {
        word-break: break-word;
    }

    th {
        background-color: #121212;
        padding: 10px;
    }

    tr {
        transition: all 0.1s linear;
        border: 10px solid white;
    }

    tbody tr:hover {
        background-color: rgba(145, 145, 145, 0.1);
        cursor: zoom-in;
    }

    button,
    input {
        font-size: 1.2em;
        color: #ababab;
        margin-bottom: 5px;
        padding: 5px;
        border: 1px solid transparent;
        border-radius: 5px;
        color: white;
        background-color: #121212;
        transition: all 0.25s linear;
    }

    input {
        width: 10em;
    }

    input[type="text"]:focus {
        border: 1px solid #555;
        outline: none;
    }

    button {
        min-width: 4.5em;
        text-align: center;
        margin-right: 5px;
    }

    button.active,
    button:hover {
        cursor: pointer;
        background-color: #333;
    }

    button.active {
        border: 1px solid white;
        font-weight: bold;
    }

    .filter {
        padding: 0 5px;
        overflow: hidden;
    }

    .search {
        float: right;
    }

    .details {
        max-width: max-content;
        margin: auto;
        padding: 5px;
        border: 1px solid #555;
        border-radius: 10px;
    }

    .details:hover {
        cursor: zoom-out;
    }

    .details th,
    .details td {
        padding: 0;
        background-color: inherit;
    }

    .details th {
        text-align: left;
        padding-right: 10px;
    }

    .extended {
        margin-top: 5px;
        cursor: auto;
    }

    .center {
        text-align: center;
    }

    .bold {
        font-weight: bold;
    }
</style>
