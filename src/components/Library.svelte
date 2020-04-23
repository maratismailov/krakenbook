<script>
  import { beforeUpdate, afterUpdate, onMount } from "svelte";

  let book_list = [];

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
  {#each book_list as book}
    <div>{book}</div>
    <hr />
  {/each}
</div>
