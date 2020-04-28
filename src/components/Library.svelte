<script>
  import { beforeUpdate, afterUpdate, onMount } from "svelte";
  import Book from "./Book.svelte";

  let book_list = [];
  let book = null;
  let reader = new FileReader();
  let book_selected = false;

  onMount(() => {
    var db;
    //check for support
    if (!("indexedDB" in window)) {
      console.log("This browser doesn't support IndexedDB");
      return;
    }
    // var idb = window.indexedDB
    var db_books = indexedDB.open("books_db", 1);

    db_books.onsuccess = function(e) {
      db = e.target.result;
      getBooks();
    };
    db_books.onerror = function(e) {
      console.log("onerror!");
      console.dir(e);
    };

    function getBooks() {
      var transaction = db.transaction(["book_names"], "readonly");
      var store = transaction.objectStore("book_names");

      var request = store.getAll();

      request.onerror = function(e) {
        console.log("Error", e.target.error.name);
      };
      request.onsuccess = function(e) {
        book_list = e.target.result;
      };
    }
  });

  export function readFile(file) {
    // нужно, что бы функция была вызвана в контексте file
    // так что готовим ее прямо сейчас
    reader.onload = (function(file) {
      return function() {
        // есть шанс, что содержимое здесь )
        book = this.result
        book_selected = true;
        return this.result;
      };
    })(file);

    reader.readAsText(file);
  }

  export function readBookFromBlob(index) {
    var db;
    //check for support
    if (!("indexedDB" in window)) {
      console.log("This browser doesn't support IndexedDB");
      return;
    }
    // var idb = window.indexedDB
    var db_books = indexedDB.open("books_db", 1);
    db_books.onupgradeneeded = function(e) {
      var db = e.target.result;
      if (!db.objectStoreNames.contains("books_store")) {
        var books_store = db.createObjectStore("books_store", {
          autoIncrement: true
        });
      }
      if (!db.objectStoreNames.contains("book_names")) {
        var books_store = db.createObjectStore("book_names", {
          autoIncrement: true
        });
      }
    };

    db_books.onsuccess = function(e) {
      db = e.target.result;
      readBook();
    };
    db_books.onerror = function(e) {
      console.log("onerror!");
      console.dir(e);
    };

    function readBook() {
      var transaction = db.transaction(["books_store"], "readonly");
      var store = transaction.objectStore("books_store");

      var request = store.get(index);

      request.onerror = function(e) {
        console.log("Error", e.target.error.name);
      };
      request.onsuccess = function(e) {
        readFile(e.target.result);
      };
    }
  }
</script>

<style>

</style>

<svelte:head>
  <title>library</title>
</svelte:head>

<div class="m-2 text-maintxt">
  <!-- <button
    class="focus:outline-none bg-mainbtn m-2 static rounded-lg py-2 px-4"
    on:click={() => readBlob()}>
    blob
  </button> -->
  {#each book_list as book, index}
    <div on:click={() => readBookFromBlob(index + 1)}>{book}</div>
    <hr />
  {/each}
  <!-- <div>{book}</div> -->
</div>
{#if book_selected}
  <Book {book} />
{/if}
