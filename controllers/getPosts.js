import { formatDate, checkPageTheme } from "../utils.js";
import { cosmicReader } from '../server.js';

/* 
 * Tools for processing markdown
 */
import { unified } from 'unified';
import readingTime from "remark-reading-time";
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';

async function getPosts(req, res) {

  const postsQuery = {
    type: "posts"
  };

  const props = [
    "id",
    "created_at",
    "published_at",
    "modified_at",
    "status",
    "slug",
    "title",
    "content",
    "thumbnail",
    "metadata"
  ];

  let status = req.query.preview ? "published" : "all";

  const getPosts = await cosmicReader.objects
  .find(postsQuery)
  .props(props.toString())
  .sort("created_at")
  .status(status)
  .limit(10)

  let posts = getPosts.objects;

  const markdownProcessor = unified().use(remarkParse).use(remarkRehype);

    // Format dates
    for (let i = 0; i < posts.length; i++) {

      const processedMarkdown = await markdownProcessor.use(readingTime).use(rehypeStringify).process(posts[i].metadata.md)

      posts[i]["readingTime"] = processedMarkdown.data.readingTime.text;
      posts[i]["updated"] = formatDate(posts[i].modified_at);
      posts[i]["published"] = formatDate(posts[i].published_at);
    }
    res.render('posts', { posts: posts, page_title: 'Blog (sinfullycoded.com)', page: 'blog', theme: checkPageTheme(req), nonce: res.locals.nonce })
}

function getPostsByCat(req, res) {
  
  res.render('postsByCat', {page_title: `(sinfullycoded.com blog)`, page: 'blog', theme: checkPageTheme(req), nonce: res.locals.nonce })
  // res.render('postsByCat', { posts: posts, page_title: `${posts.category} (sinfullycoded.com blog)`, page: 'blog', theme: checkPageTheme(req), nonce: res.locals.nonce })

}

function getPostsByTag(req, res) {

  res.render('postsByTag', {page_title: `(sinfullycoded.com blog)`, page: 'blog', theme: checkPageTheme(req), nonce: res.locals.nonce })
  // res.render('postsByTag', { posts: posts, page_title: `Posts tagged with: ${req.params.tag} (sinfullycoded.com blog)`, page: 'blog', theme: checkPageTheme(req), nonce: res.locals.nonce })

}

export { getPosts, getPostsByCat, getPostsByTag }