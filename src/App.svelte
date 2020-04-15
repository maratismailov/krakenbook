<script>
  import HelloWorld from "./components/HelloWorld.svelte";
  import Search from "./components/Search.svelte";
  import Library from "./components/Library.svelte";
  import Settings from "./components/Settings.svelte";
  import { Router, Link, Route } from "svelte-routing";

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/service-worker.js");
  }

  export let url = "";
</script>

<style lang="postcss">
  .navbar {
    width: 100%;
    bottom: 0;
    position: fixed;
    background-color: #1e1e1e;
  }
  img {
    max-height: 1.2em;
    display: block;
    margin-left: auto;
    margin-right: auto;
  }
</style>

<main class="overflow-hidden ">
  <!-- <Router/> -->
  <!-- <HelloWorld/> -->
  <!-- <Search/> -->
</main>

<Router {url}>
  <div class="navbar">
    <Link to="/">
      <img src="assets/search.svg" alt="Search" />
    </Link>
    <Link to="library">
      <img src="assets/library.svg" alt="library" />
    </Link>
    <Link to="settings">
      <img src="assets/settings.svg" alt="settings" />
    </Link>

  </div>

  <div>
    <!-- <Route path="blog/:id" component="{BlogPost}" /> -->
    <!-- <Route path="blog" component="{Blog}" /> -->
    <Route path="library" component={Library} />
    <Route path="settings" component={Settings} />
    <Route path="/">
      <Search />
    </Route>
  </div>
</Router>
