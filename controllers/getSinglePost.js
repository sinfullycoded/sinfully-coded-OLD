import { formatDate, customTextComponents, slugify, checkPageTheme, getEstimatedReadingTime, generateOgImage, wrapText } from "../utils.js";
import { toHTML } from "@portabletext/to-html";
import { sanity } from '../server.js';
import {fs, __dirname} from '../server.js';

export default function getSinglePostBySlug(req, res) {

    let includeDrafts = false;
    if(req.query.preview) {
        includeDrafts = true;
    }

    const singlePostQuery =
        `*[_type == 'post' ${!includeDrafts ? '&& !(_id in path("drafts.**"))' : ''} && slug.current == $slug]{ 
            _id,
            "published": publishedAt, 
            "updated": _updatedAt,
            "created": _createdAt, 
            title, 
            "slug": slug.current, 
            body, 
            snippet,
            author->
                {
                    name, 
                    "image": image.asset->url, 
                    bio,
                    twitter_handle
                }, 
            "category": lower(categories[0]->title),
            tags,
            "comments": *[_type == 'comment' && references(^._id) && !(_id in path("drafts.**")) && type == 'parent']|order(_createdAt desc){
                _createdAt,
                _id,
                comment,
                "commenter_id": commenter->_id,
                "twitter_handle": commenter->twitter_handle,
                "website_url": commenter->website_url,
                "avatar": commenter->avatar_url,
                replies[]->{
                    _createdAt,
                    _id,
                    comment,
                    "commenter_id": commenter->_id,
                    "twitter_handle": commenter->twitter_handle,
                    "website_url": commenter->website_url,
                    "avatar": commenter->avatar_url
                }
              }[0..10]
        }[0]`;

    const params = { slug: req.params.slug }
    sanity.fetch(singlePostQuery, params).then((post) => {

        // Format dates
        if(req.query.preview) {
            post.published = formatDate(post.created);  
        } else {
            post.published = formatDate(post.published);
        }
        post.updated = formatDate(post.updated);

       
        // Configure table of contents links for the blog post
        let toc = [];
        post.body.forEach(body => {
            const headings = ["h1", "h2", "h3", "h4", "h5", "h6"];
            if (headings.includes(body.style)) {
                toc.push({ title: body.children[0].text, anchor: slugify(body.children[0].text) })
            }
        })

        // Configure breadcrumbs menu
        const breadcrumbs = [];
        const path = req.path.split("/").splice(1);
        for (let s = 0; s < path.length; s++) {
            let basePath = path[0];
            switch (s) {
                case 0:
                    breadcrumbs.push({ name: basePath, path: basePath })
                    break;
                case 1:
                    breadcrumbs.push({ name: path[s], path: `${basePath}/categories/${path[s]}` })
                    break;
                case 2:
                    breadcrumbs.push({ name: path[s], path: `${basePath}/categories/${path[s - 1]}/${path[s]}` })
                    break;
                case 3:
                    breadcrumbs.push({ name: path[s], path: `${basePath}/categories/${path[s - 2]}/${path[s - 1]}/${path[s]}` })
                    break;
            }
        }

        post.readingTime = getEstimatedReadingTime(post.body);

        const tags = post.tags;
        const tagsWithHastags = tags.map(tag => '#' + tag);
        post.tags = tagsWithHastags;

        const pageMeta = {
            title: `${post.title} (sinfullycoded.com)`,
            og_title: post.title,
            og_url: `${process.env.BASE_URL}/blog/${post.category}/${post.slug}`,
            og_description: post.snippet,
            og_type: 'article',
            og_image: ''
        };

        const ogImgOpts = {
            post_id: post._id,
            category: post.category,
            title: post.title,
            tags: tagsWithHastags,
            name: post.author.name,
        }

        fs.access(__dirname + `/public/assets/images/blog/${post._id}.png`, fs.F_OK, (err) => {
            if (err) {
                generateOgImage(ogImgOpts)
                pageMeta.og_image = `${process.env.BASE_URL}/assets/images/blog/${post._id}.png`;
                return;
            }
        });

        pageMeta.og_image = `${process.env.BASE_URL}/assets/images/blog/${post._id}.png`;

        for (let i = 0; i < post.comments.length; i++) {
            post.comments[i]["_createdAt"] = formatDate(post.comments[i]._createdAt);
          }

        const content = toHTML(post.body, { components: customTextComponents });
        const nonce = res.locals.nonce;

        res.render('post', { post: post, body: content, toc: toc, meta: pageMeta, path: breadcrumbs, page: 'blog', theme: checkPageTheme(req), nonce: nonce })
    })
}