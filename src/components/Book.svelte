<script>
  import { parse } from "node-html-parser";

  export let book;

  let parsed_book = parse(book) 
  console.log(book)

  //   parser(book)
</script>

<div class="m-2 text-maintxt">
  <!-- {@html book} -->
  {parsed_book.structure}
</div>
