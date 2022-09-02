<script>
    import { Link } from "svelte-routing";
    export let data = [];
</script>

{#each data as nav}
    <li><Link class="link" to={nav.path}>{nav.text}</Link></li>
{/each}
