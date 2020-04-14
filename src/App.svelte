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
  nav {
    border-bottom: 1px solid rgba(255, 62, 0, 0.1);
    font-weight: 300;
    padding: 0 1em;
    bottom: 0;
    position: fixed;
    background-color: #1e1e1e;
    width: 100%;
    opacity: 1;
  }

   li {
    display: block;
    float: left;
  }

   ul {
    margin: 0;
    padding: 0;
    opacity: 1;
  }

  /* clearfix */
  ul::after {
    content: "";
    display: block;
    clear: both;
  }
</style>

<main class="overflow-hidden ">
  <!-- <Router/> -->
  <!-- <HelloWorld/> -->
  <!-- <Search/> -->
</main>

<Router {url}>
  <nav>
    <ul>
      <li>
        <Link to="/">
          <img
            style="max-height: 2.5em; margin-left: 5vw; padding-bottom: 8px; padding-top: 8px"
            src="assets/search.svg"
            alt="Search"
            align="middle" />
        </Link>
      </li>

      <li>
        <Link to="library">
          <img
            style="max-height: 2.5em; margin-left: 32vw; padding-bottom: 8px; padding-top: 8px"
            src="assets/library.svg"
            alt="Search" />
        </Link>
      </li>

      <li>
        <Link to="settings">
          <img
            style="max-height: 2.5em; margin-left: 30vw; padding-bottom: 8px; padding-top: 8px"
            src="assets/settings.svg"
            alt="Search" />
        </Link>
      </li>
    </ul>
  </nav>

  <!-- <nav style="display: flex">
    <Link to="/">
      <img
        style="max-height: 2em; width: 30%;"
        src="assets/search.svg"
        alt="Search"
        align="middle" />
    </Link>
    <Link to="library">
      <img
        style="max-height: 2em; width: 30%;"
        src="assets/library.svg"
        alt="Search" />
    </Link>
    <Link to="settings">
      <img
        style="max-height: 2em; width: 30%;"
        src="assets/settings.svg"
        alt="Search" />
    </Link>
  </nav> -->
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
