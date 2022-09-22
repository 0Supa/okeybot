<script>
    let input;

    let id;
    let prompt = "Loading...";
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");

    const copy = () => {
        input.select();
        input.setSelectionRange(0, 99999);
        navigator.clipboard.writeText(input.value);
    };

    const request = async () => {
        try {
            const res = await fetch(`/api/spotify?code=${code}`, { method: "POST" });
            const json = await res.json();
            id = json.id;
        } catch (e) {
            console.error(e);
            prompt = "An unexpected error occurred";
        }
    };

    if (!code) {
        const error = params.get("error");
        if (error) prompt = `Spotify: ${error}`;
        else prompt = "No code returned";
    } else request();
</script>

<div class="container">
    {#if id}
        <p>Whisper <b>Okey_bot</b> this message on Twitch to link your Spotify account</p>
        <input bind:this={input} value={id} type="text" readonly />
        <button on:click={copy}>Copy</button>
    {:else}
        <h1>{prompt}</h1>
    {/if}
</div>

<style>
    .container {
        text-align: center;
    }

    button,
    input {
        font-size: 1.2em;
        color: #ababab;
        margin: 0;
        padding: 5px;
        border: 1px solid transparent;
        border-radius: 5px;
        color: white;
        background-color: #121212;
        transition: all 0.25s linear;
    }

    input {
        width: 15em;
    }

    input[type="text"]:focus {
        border: 1px solid #555;
        outline: none;
    }

    button {
        min-width: 4em;
        text-align: center;
    }

    button:hover {
        cursor: pointer;
        background-color: #333;
    }
</style>
