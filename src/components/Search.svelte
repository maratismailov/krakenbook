<script>
  import axios from "axios";
  import { parse } from "node-html-parser";

  let querie = null;
  let page_number = 0;
  let result = "";
  let results = "";
  let series_checked = false;
  let author_checked = false;
  let book_checked = true;
  function handleEnter(event) {
    // key = event.key;
    let key_code = event.keyCode;
    if (key_code === 13) {
      document.getElementById("search_input").blur();
      handleNewSearch();
    }
  }

  export function handleSearch() {
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

  export function refineResult() {
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
    let pagesTotal = array2.filter(elem => {
      if (
        elem.includes('class="pager"') ||
        elem.includes('<li class="pager-item"')
      ) {
        return true;
      }
    });
    // console.log(pagesTotal.length);
    // console.log(pagesTotal);

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

      if (elem.includes("flibusta.is/b")) {
        // elem = elem + elem.replace(elem.indexOf('/b/')+3, (elem.indexOf('/b/')+3)+'/fb2')

        elem =
          elem +
          elem.substring(elem.indexOf("<a href"), elem.indexOf('">')) +
          '/fb2">fb2 </a>' +
          elem.substring(elem.indexOf("<a href"), elem.indexOf('">')) +
          '/epub">epub </a>' +
          elem.substring(elem.indexOf("<a href"), elem.indexOf('">')) +
          '/mobi">mobi</a>';

        // + <a href="http://flibusta.is/b/530436/fb2">fb2</a>)
      }

      return elem;
    });

    const array6 = array5.map(elem => {
      elem = parse(elem);
      return elem.structuredText;
    });
    // console.log('array6 is', array6);
    // result = parse(array5)
    results = array6;
    // this.setState({ result2: array6, pagesTotal: pagesTotal.length / 2 });
    // result2 = array6
    pagesTotal = pagesTotal.length / 2;
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
</style>

<svelte:head>
  <title>kraken book</title>
</svelte:head>
<svelte:window on:keydown={handleEnter} />

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

</div>

<!-- <table>
<tr>
<td>
 <label class="switch">
    <input type="checkbox" />
    <span class="slider round" />
  </label>
</td>
<td>
Серии
</td>
<td>
ch2
</td>
<td>
Авторы
</td>

<td>
ch3
</td>
<td>
Книги
</td>
<td>
ch4
</td>
<td>
Жанры
</td>
</tr>

</table> -->
<div class="text-maintxt">
  {#each results as result}
    <div>{result}</div>
  {/each}
</div>
