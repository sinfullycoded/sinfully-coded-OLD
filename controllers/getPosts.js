import { formatDate, checkPageTheme, getEstimatedReadingTime } from "../utils.js";
import { sanity } from '../server.js';

async function getPosts(req, res) {
  const postsQuery =
    `*[_type == 'post' && !(_id in path("drafts.**"))]|order(publishedAt desc){ 
  "published": publishedAt, 
  "updated": _updatedAt, 
  title, 
  "slug": slug.current, 
  body,
  snippet,  
  "category": lower(categories[0]->title),
  tags,
  "image": mainImage.asset->url,
}[0...9]`;

  const posts = await sanity.fetch(postsQuery);
  
    // Format dates
    for (let i = 0; i < posts.length; i++) {
      posts[i]["updated"] = formatDate(posts[i].updated);
      posts[i]["published"] = formatDate(posts[i].published);
      posts[i]["readingTime"] = getEstimatedReadingTime(posts[i].body);
    }
    res.render('posts', { posts: posts, page_title: 'Blog (sinfullycoded.com)', page: 'blog', theme: checkPageTheme(req), nonce: res.locals.nonce })
}

function getPostsByCat(req, res) {
  const postsbyCatQuery =
    `*[_type == "category" && title == $cat]{
        "category": lower(title),
        "posts": *[_type == "post" && references(^._id) && !(_id in path("drafts.**"))]{
          "published": publishedAt, 
            "updated": _updatedAt, 
            title, 
            "slug": slug.current, 
            snippet,  
            tags,
            "image": mainImage.asset->url,
        }
      }`;

  const cat = req.params.cat.toLowerCase();
  const capitalizedCategoryName = cat.charAt(0).toUpperCase() + cat.slice(1)
  const param = { cat: capitalizedCategoryName }

  sanity.fetch(postsbyCatQuery, param).then((category) => {
    // Format dates

    const posts = category[0].posts;
    posts['category'] = category[0].category;
    for (let i = 0; i < posts.length; i++) {
      posts[i]["updated"] = formatDate(posts[i].updated);
      posts[i]["published"] = formatDate(posts[i].published);
      posts[i]["readingTime"] = getEstimatedReadingTime(posts[i].body);
    }

    res.render('postsByCat', { posts: posts, page_title: `${posts.category} (sinfullycoded.com blog)`, page: 'blog', theme: checkPageTheme(req), nonce: res.locals.nonce })

  })

}

function getPostsByTag(req, res) {
  const postsbyTagQuery =
    `*[_type == "post" && $tag in tags && !(_id in path("drafts.**"))]{
            "published": publishedAt, 
            "updated": _updatedAt, 
            title, 
            "slug": slug.current, 
            snippet,  
            "category": lower(categories[0]->title),
            tags,
            "image": mainImage.asset->url,
            }`;

  const param = { tag: req.params.tag }

  sanity.fetch(postsbyTagQuery, param).then((posts) => {
    // Format dates
    posts['tag'] = param.tag;
    for (let i = 0; i < posts.length; i++) {
      posts[i]["updated"] = formatDate(posts[i].updated);
      posts[i]["published"] = formatDate(posts[i].published);
      posts[i]["readingTime"] = getEstimatedReadingTime(posts[i].body);
    }

    res.render('postsByTag', { posts: posts, page_title: `Posts tagged with: ${req.params.tag} (sinfullycoded.com blog)`, page: 'blog', theme: checkPageTheme(req), nonce: res.locals.nonce })

  })
}

export { getPosts, getPostsByCat, getPostsByTag }