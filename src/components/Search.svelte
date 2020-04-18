<script>
  import axios from "axios";
  import { parse } from "node-html-parser";
  import { beforeUpdate, afterUpdate, onMount } from "svelte";
  import { fly } from "svelte/transition";
  import Modal from "svelte-simple-modal";

  let querie = null;
  let page_number = 0;
  let result = "";
  let results = "";
  let series_checked = false;
  let author_checked = false;
  let book_checked = true;
  let pages_total = 0;
  let prev_button = "Hidden";
  let next_button = "Hidden";
  let is_pages = "Hidden";
  let loading = "Hidden";
  let loading_details = "Hidden";
  let results_css = "Hidden";
  let book_menu = [];
  let details = [];
  let details_text = "";
  let show_details = [];
  let allbooks = [];
  let show_details_btn = null;
  let show_details_img = null;
  let show_download_options = null;
  let download_links = [];

  function handleEnter(event) {
    // key = event.key;
    let key_code = event.keyCode;
    if (key_code === 13) {
      document.getElementById("search_input").blur();
      handleNewSearch();
    }
  }

  beforeUpdate(() => {
    show_details_btn = document.getElementById("show_details_btn");
    show_details_img = document.getElementById("show_details_img");
    prev_button = "Hidden";
    if (page_number > 0) {
      prev_button =
        "focus:outline-none bg-mainbtn m-2 static rounded-lg py-2 px-4";
    }

    next_button =
      "focus:outline-none bg-mainbtn m-2 static rounded-lg py-2 px-4";
    if (page_number >= pages_total - 1) {
      next_button = "Hidden";
    }

    is_pages = "Hidden";
    if (pages_total !== 0) {
      is_pages =
        "focus:outline-none bg-mainbtn m-2 static rounded-lg py-2 px-4";
    }
    // determine whether we should auto-scroll
    // once the DOM is updated...
  });

  export function changePageNumber(arg) {
    page_number += arg;
    handleSearch();
  }

  export function handleSearch() {
    results_css = "Hidden";
    loading = null;
    let pre_querie = querie.replace(/ /g, "+");
    if (series_checked) {
      pre_querie = pre_querie + "&chs=on";
    }
    if (author_checked) {
      pre_querie = pre_querie + "&cha=on";
    }
    if (book_checked) {
      pre_querie = pre_querie + "&chb=on";
    }
    if (book_checked || series_checked || author_checked) {
      const search_querie =
        "https://flibustasearch.herokuapp.com/http://flibusta.is/booksearch?page=" +
        page_number +
        "&ask=" +
        pre_querie;
      axios.get(search_querie).then(response => {
        result = response.data;
        refineResult();
        // this.setState({ result: response.data }, () => this.refineResult());
      });
    }

    // pre_querie = pre_querie + "&chb=on";
  }

  export function handleNewSearch() {
    page_number = 0;
    handleSearch();
  }

  export function hideDetails(event) {
    if (
      event.target !== show_details_btn &&
      event.target !== show_details_img
    ) {
      show_details = [];
    }
  }

  export function showDetails(index) {
    show_details[index] = !show_details[index];
    let pre_details_link = parse(allbooks[index]).firstChild.firstChild
      .rawAttrs;
    pre_details_link = pre_details_link.substr(6);
    let details_link = pre_details_link.slice(0, -1);
    const details_querie =
      "https://flibustasearch.herokuapp.com/" + details_link;
    let details_body = "";
    axios.get(details_querie).then(response => {
      details_body = response.data;
      refineDetails(details_body);
    });
  }

  export function showDownloadOptions(index) {
    show_download_options[index] = !show_download_options[index];
    let download_link = parse(allbooks[index])
      .firstChild.firstChild.rawAttrs.substr(6)
      .slice(0, -1);
    download_links[index] = {
      fb2: download_link + "/fb2",
      epub: download_link + "/epub",
      mobi: download_link + "/mobi"
    };
  }

  export function downloadBook(index, type) {
    let download_link =
      parse(allbooks[index])
        .firstChild.firstChild.rawAttrs.substr(6)
        .slice(0, -1) + type;
    const link = document.createElement("a");
    link.href = download_link;
    link.click();

    console.log(download_link);
  }

  export function refineDetails(details) {
    loading_details = "Hidden";
    const details0 = String(details);
    const result1 = details0.substring(details0.indexOf('<h1 class="title">'));
    const result2 = result1.substring(
      0,
      result1.indexOf("<hr/><div id='newann'")
    );
    // details_text = parse(result2).text

    const url = "http://flibusta.is";
    const result3 = result2.replace(/<a\b[^>]*>(.*?)<\/a>/g, "");
    const result5 = result3.replace(
      /<[a-zA-Z]+(\s+[a-zA-Z]+\s*=\s*("([^"]*)"|'([^']*)'))*\s*\/>/,
      ""
    );
    const position = result5.indexOf('<img src="') + 10;
    const result6 = [
      result5.slice(0, position),
      url,
      result5.slice(position)
    ].join("");
    details_text = result6;
    console.log(details_text);
  }

  export function refineResult() {
    loading = "Hidden";
    const result0 = String(result);
    const result1 = result0.substring(
      result.indexOf('<h1 class="title">Поиск книг</h1>') + 0
    );
    const result2 = result1.substring(
      0,
      result1.indexOf('<div id="sidebar-right" class="sidebar">')
    );
    const array1 = result2.split("\n");
    const array2 = array1.filter(String);
    pages_total = array2.filter(elem => {
      if (
        elem.includes('class="pager"') ||
        elem.includes('<li class="pager-item"')
      ) {
        return true;
      }
    });

    const array3 = array2.filter(elem => {
      if (elem.includes('h1 class="title"')) {
        return false;
      }
      if (elem.includes("input type=submit value")) {
        return false;
      }
      if (elem.includes('<input type="checkbox"')) {
        return false;
      }
      if (elem.includes('<a href="http://fbsearch.ru">')) {
        return false;
      }
      if (elem.includes('class="pager')) {
        return false;
      }

      return true;
    });
    // const array6 = array3.map

    const array5 = array3.map((elem, index) => {
      if (elem.includes("<ul>")) {
        elem = elem.substr(elem.indexOf("<ul>") + 4);
        // console.log('found!')
      }
      elem = elem.replace(/<span style="background-color: #FFFCBB">/g, "");
      elem = elem.replace(/<\/span>/g, "");
      elem = elem.replace("<b>", "");
      elem = elem.replace("</b>", "");
      elem = elem.replace(/<a href="\//g, '<a href="http://flibusta.is/');

      // if (elem.includes("flibusta.is/b")) {
      //   elem =
      //     elem +
      //     elem.substring(elem.indexOf("<a href"), elem.indexOf('">')) +
      //     '/fb2">fb2 </a>' +
      //     elem.substring(elem.indexOf("<a href"), elem.indexOf('">')) +
      //     '/epub">epub </a>' +
      //     elem.substring(elem.indexOf("<a href"), elem.indexOf('">')) +
      //     '/mobi">mobi</a>';
      // }

      return elem;
    });

    const array6 = array5.map(elem => {
      elem = parse(elem);
      return elem.structuredText;
    });
    book_menu = array5.map(() => {
      return null;
    });
    show_details = array5.map(() => {
      return null;
    });
    show_download_options = array5.map(() => {
      return null;
    });
    details = array5.map(() => {
      return null;
    });
    allbooks = array5.map(elem => {
      return elem;
    });

    // console.log('array6 is', array6);
    // result = parse(array5)
    results = array6;
    results_css = "text-maintxt m-2";
    // this.setState({ result2: array6, pagesTotal: pagesTotal.length / 2 });
    // result2 = array6
    pages_total = pages_total.length / 2;
  }
  export function showBookMenu(index) {
    book_menu[index] = !book_menu[index];
  }
</script>

<style>
  .switch {
    position: relative;
    display: inline-block;
    width: 2em;
    height: 1.1em;
  }

  .switch input {
    opacity: 0;
    width: 0;
    height: 0;
  }

  .slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #ccc;
    -webkit-transition: 0.4s;
    transition: 0.4s;
  }

  .slider:before {
    position: absolute;
    content: "";
    height: 1.1em;
    width: 1em;
    /* left: 4px; */
    /* bottom:4px; */
    background-color: white;
    -webkit-transition: 0.4s;
    transition: 0.4s;
  }

  input:checked + .slider {
    background-color: #2196f3;
  }

  input:focus + .slider {
    box-shadow: 0 0 1px #2196f3;
  }

  input:checked + .slider:before {
    -webkit-transform: translateX(1em);
    -ms-transform: translateX(1em);
    transform: translateX(1em);
  }

  /* Rounded sliders */
  .slider.round {
    border-radius: 1em;
  }

  .slider.round:before {
    border-radius: 50%;
  }

  .Pages {
    display: flex;
  }

  .Hidden {
    display: none;
  }

  .Button {
    height: 50%;
    margin: 1%;
  }

  hr {
    background-color: #375a7f;
    height: 1px;
  }

  .outer_details_div {
    margin-left: 2vw;
    margin-right: 2vw;
    width: 90vw;
    height: 50vh;
    z-index: 1;
    position: absolute;
    overflow: auto;
    background-color: #0b3a32;
  }

  .div_for_button {
    text-align: center;
  }
</style>

<svelte:head>
  <title>kraken book</title>
</svelte:head>
<svelte:window on:keydown={handleEnter} on:click={hideDetails} />

<div class="">
  <input
    id="search_input"
    class="bg-white focus:outline-none border border-gray-300 rounded-lg py-2
    px-4 w-9 static m-2"
    type="search"
    placeholder="Enter book name"
    bind:value={querie} />
  <button
    class="focus:outline-none bg-mainbtn m-2 static rounded-lg py-2 px-4"
    on:click={handleNewSearch}>
    Search
  </button>
</div>

<div class="m-2 text-maintxt">
  <label class="switch">
    <input type="checkbox" bind:checked={series_checked} />
    <span class="slider round" />
  </label>
  <span>Серии</span>
  <span>&nbsp;</span>
  <label class="switch">
    <input type="checkbox" bind:checked={author_checked} />
    <span class="slider round" />
  </label>
  <span>Авторы</span>
  <span>&nbsp;</span>
  <label class="switch">
    <input type="checkbox" bind:checked={book_checked} />
    <span class="slider round" />
  </label>
  <span>Книги</span>
  <span>&nbsp;</span>

  <div class="Pages">
    <button class={prev_button} on:click={() => changePageNumber(-1)}>
      Предыдущая
    </button>
    <p class={is_pages}>Страница {page_number + 1} из {pages_total}</p>
    <button class={next_button} on:click={() => changePageNumber(1)}>
      Следующая
    </button>
  </div>

</div>
<div class={loading}>
  <img src="./assets/loading.svg" alt="Loading..." />
</div>

<div class={results_css}>
  {#each results as result, index}
    {#if result.includes('Найденные книги') || result.includes('Найденные писатели') || result.includes('Найденные серии')}
      <h2 style="font-size: 1.5em">{result}</h2>
    {:else if result.length > 0}
      <div on:click={() => showBookMenu(index)}>{result}</div>
      {#if book_menu[index]}
        <div
          transition:fly={{ y: -25, duration: 500 }}
          style="color: green; display: flex">
          <button
            id="show_details_btn"
            class="focus:outline-none bg-mainbtn m-2 static rounded-lg py-2 px-4"
            on:click={() => showDetails(index)}>
            <img
              id="show_details_img"
              style="max-height: 1em"
              src="./assets/details.svg"
              alt="details" />
          </button>
          <button
            style="display: flex"
            class="focus:outline-none bg-mainbtn m-2 static rounded-lg py-2 px-4"
            on:click={() => showDetails(index)}>
            <img
              style="max-height: 1em"
              src="./assets/library.svg"
              alt="library" />
          </button>
          <button
            class="focus:outline-none bg-mainbtn m-2 static rounded-lg py-2 px-4"
            on:click={() => showDownloadOptions(index)}>
            <img
              style="max-height: 1em"
              src="./assets/download.svg"
              alt="download" />
          </button>
          {#if show_download_options[index]}
            <!-- <button
              class="text-maintxt focus:outline-none bg-mainbtn m-2 static
              rounded-lg py-2 px-4"
              on:click={() => downloadBook(index, '/fb2')}>
              fb2
            </button>
            <button
              class="text-maintxt focus:outline-none bg-mainbtn m-2 static
              rounded-lg py-2 px-4"
              on:click={() => downloadBook(index, '/epub')}>
              epub
            </button>
            <button
              type="button"
              class="text-maintxt focus:outline-none bg-mainbtn m-2 static
              rounded-lg py-2 px-4"
              on:click={() => downloadBook(index, '/mobi')}>
              mobi
            </button>
            <form action={download_links[index].mobi}>
              <input type="submit" value="Go to Google" />
            </form> -->
            <a
              class="text-maintxt focus:outline-none bg-mainbtn m-2 static
              rounded-lg py-2 px-4"
              href={download_links[index].fb2} download>
              fb2
            </a>
            <a
              class="text-maintxt focus:outline-none bg-mainbtn m-2 static
              rounded-lg py-2 px-4"
              href={download_links[index].epub} download>
              epub
            </a>
            <a
              class="text-maintxt focus:outline-none bg-mainbtn m-2 static
              rounded-lg py-2 px-4"
              href={download_links[index].mobi} download>
              mobi
            </a>
          {/if}
        </div>
        {#if show_details[index]}
          <div class="outer_details_div">
            <div class="div_for_button">
              <button
                class="focus:outline-none bg-mainbtn m-2 static rounded-lg py-2
                px-4"
                on:click={() => showDetails(index)}>
                Закрыть
              </button>
            </div>
            <div>
              {@html details_text}
            </div>
            <div class="div_for_button">
              <button
                class="focus:outline-none bg-mainbtn m-2 static rounded-lg py-2
                px-4"
                on:click={() => showDetails(index)}>
                Закрыть
              </button>
            </div>
          </div>
        {/if}
      {/if}
      <hr />
    {/if}
  {/each}
</div>
<div style="padding-bottom: 80px;" />
