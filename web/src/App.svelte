<script>
    import { Router, Route } from "svelte-routing";
    import Nav from "./Nav.svelte";
    import Home from "./routes/Home.svelte";
    import Commands from "./routes/Commands.svelte";
    import Spotify from "./routes/Spotify.svelte";
    import SpotifyCallback from "./routes/SpotifyCallback.svelte";

    const navSrc = [
        { path: "/", text: "Home" },
        { path: "/commands", text: "Commands" },
        { path: "/spotify", text: "Spotify" },
    ];
</script>

<Router url={window.location.pathname}>
    <nav>
        <img class="logo" alt="logo" src="/logo.png" />
        <ul class="nav">
            <Nav data={navSrc} />
        </ul>
        <a class="m-l" target="_blank" href="https://github.com/0supa/okeybot">
            <img class="link" alt="github" src="/github.png" />
        </a>
    </nav>

    <main>
        <Route path="/"><Home /></Route>
        <Route path="/commands"><Commands /></Route>
        <Route path="/spotify"><Spotify /></Route>
        <Route path="/spotify/callback"><SpotifyCallback /></Route>
    </main>
</Router>
