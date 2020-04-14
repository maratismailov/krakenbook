<script>
  export let segment;
</script>

<style>
  .first_item {
    /* margin-left: 50px; */
    padding-left: 50px;
  }
  .second_item {
    padding-left: 80px;
  }
  .third_item {
    padding-left: 80px;
  }
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

  li {
    display: block;
    float: left;
  }

  [aria-current] {
    position: relative;
    display: inline-block;
  }

  [aria-current]::after {
    position: absolute;
    content: "";
    width: calc(100% - 1em);
    height: 2px;
    background-color: rgb(255, 62, 0);
    display: block;
    bottom: -1px;
  }

  a {
    text-decoration: none;
    padding: 1em 0.5em;
    display: block;
  }
</style>

<nav>
  <ul>
    <li class="first_item">
      <a aria-current={segment === undefined ? 'page' : undefined} href=".">
        <svg
          aria-current={segment === undefined ? 'page' : undefined}
          href="."
          class="bi bi-search"
          width="1em"
          height="1em"
          viewBox="0 0 16 16"
          fill="currentColor"
          xmlns="http://www.w3.org/2000/svg">
          <path
            fill-rule="evenodd"
            d="M10.442 10.442a1 1 0 011.415 0l3.85 3.85a1 1 0 01-1.414
            1.415l-3.85-3.85a1 1 0 010-1.415z"
            clip-rule="evenodd" />
          <path
            fill-rule="evenodd"
            d="M6.5 12a5.5 5.5 0 100-11 5.5 5.5 0 000 11zM13 6.5a6.5 6.5 0 11-13
            0 6.5 6.5 0 0113 0z"
            clip-rule="evenodd" />
          <a aria-current={segment === undefined ? 'page' : undefined} href=".">
            home
          </a>
        </svg>
      </a>
    </li>
    <li class="second_item">
      <a aria-current={segment === 'library' ? 'page' : undefined} href="library">
        <svg
          class="bi bi-book"
          width="1em"
          height="1em"
          viewBox="0 0 16 16"
          fill="currentColor"
          xmlns="http://www.w3.org/2000/svg">
          <path
            fill-rule="evenodd"
            d="M3.214 1.072C4.813.752 6.916.71 8.354 2.146A.5.5 0 018.5
            2.5v11a.5.5 0
            01-.854.354c-.843-.844-2.115-1.059-3.47-.92-1.344.14-2.66.617-3.452
            1.013A.5.5 0 010 13.5v-11a.5.5 0 01.276-.447L.5
            2.5l-.224-.447.002-.001.004-.002.013-.006a5.017 5.017 0 01.22-.103
            12.958 12.958 0 012.7-.869zM1 2.82v9.908c.846-.343 1.944-.672
            3.074-.788 1.143-.118 2.387-.023
            3.426.56V2.718c-1.063-.929-2.631-.956-4.09-.664A11.958 11.958 0 001
            2.82z"
            clip-rule="evenodd" />
          <path
            fill-rule="evenodd"
            d="M12.786 1.072C11.188.752 9.084.71 7.646 2.146A.5.5 0 007.5
            2.5v11a.5.5 0 00.854.354c.843-.844 2.115-1.059 3.47-.92 1.344.14
            2.66.617 3.452 1.013A.5.5 0 0016 13.5v-11a.5.5 0 00-.276-.447L15.5
            2.5l.224-.447-.002-.001-.004-.002-.013-.006-.047-.023a12.582 12.582
            0 00-.799-.34 12.96 12.96 0 00-2.073-.609zM15
            2.82v9.908c-.846-.343-1.944-.672-3.074-.788-1.143-.118-2.387-.023-3.426.56V2.718c1.063-.929
            2.631-.956 4.09-.664A11.956 11.956 0 0115 2.82z"
            clip-rule="evenodd" />
        </svg>
      </a>
    </li>
    <li class="third_item">
      <a
        rel="prefetch"
        aria-current={segment === 'settings' ? 'page' : undefined}
        href="settings">
        <svg
          class="bi bi-gear"
          width="1em"
          height="1em"
          viewBox="0 0 16 16"
          fill="currentColor"
          xmlns="http://www.w3.org/2000/svg">
          <path
            fill-rule="evenodd"
            d="M8.837 1.626c-.246-.835-1.428-.835-1.674 0l-.094.319A1.873 1.873
            0 014.377 3.06l-.292-.16c-.764-.415-1.6.42-1.184
            1.185l.159.292a1.873 1.873 0 01-1.115 2.692l-.319.094c-.835.246-.835
            1.428 0 1.674l.319.094a1.873 1.873 0 011.115
            2.693l-.16.291c-.415.764.42 1.6 1.185 1.184l.292-.159a1.873 1.873 0
            012.692 1.116l.094.318c.246.835 1.428.835 1.674 0l.094-.319a1.873
            1.873 0 012.693-1.115l.291.16c.764.415 1.6-.42
            1.184-1.185l-.159-.291a1.873 1.873 0
            011.116-2.693l.318-.094c.835-.246.835-1.428 0-1.674l-.319-.094a1.873
            1.873 0
            01-1.115-2.692l.16-.292c.415-.764-.42-1.6-1.185-1.184l-.291.159A1.873
            1.873 0 018.93 1.945l-.094-.319zm-2.633-.283c.527-1.79 3.065-1.79
            3.592 0l.094.319a.873.873 0 001.255.52l.292-.16c1.64-.892 3.434.901
            2.54 2.541l-.159.292a.873.873 0 00.52 1.255l.319.094c1.79.527 1.79
            3.065 0 3.592l-.319.094a.873.873 0 00-.52 1.255l.16.292c.893
            1.64-.902 3.434-2.541 2.54l-.292-.159a.873.873 0
            00-1.255.52l-.094.319c-.527 1.79-3.065 1.79-3.592
            0l-.094-.319a.873.873 0
            00-1.255-.52l-.292.16c-1.64.893-3.433-.902-2.54-2.541l.159-.292a.873.873
            0 00-.52-1.255l-.319-.094c-1.79-.527-1.79-3.065
            0-3.592l.319-.094a.873.873 0
            00.52-1.255l-.16-.292c-.892-1.64.902-3.433
            2.541-2.54l.292.159a.873.873 0 001.255-.52l.094-.319z"
            clip-rule="evenodd" />
          <path
            fill-rule="evenodd"
            d="M8 5.754a2.246 2.246 0 100 4.492 2.246 2.246 0 000-4.492zM4.754
            8a3.246 3.246 0 116.492 0 3.246 3.246 0 01-6.492 0z"
            clip-rule="evenodd" />
        </svg>
      </a>
    </li>
    <!-- <li>
      <a
        rel="prefetch"
        aria-current={segment === 'blog' ? 'page' : undefined}
        href="blog">
        blog
      </a>
    </li> -->

  </ul>
</nav>
