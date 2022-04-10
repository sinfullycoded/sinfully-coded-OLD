import { formatDate, customTextComponents, slugify } from "../utils.js";
import { toHTML } from "@portabletext/to-html";

export default function getSinglePostBySlug(req, res, sanity) {
    const singlePostQuery =
        `*[_type == 'post' && slug.current == $slug]{ 
            "published": publishedAt, 
            "updated": _updatedAt, 
            title, 
            slug, 
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
            tags
        }`;

    const params = { slug: req.params.slug }
    sanity.fetch(singlePostQuery, params).then((post) => {

        // Format dates
        post[0].published = formatDate(post[0].published);
        post[0].updated = formatDate(post[0].updated);

        // Configure table of contents links for the blog post
        let toc = [];
        post[0].body.forEach(body => {
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
                    breadcrumbs.push({ name: path[s], path: `${basePath}/${path[s]}` })
                    break;
                case 2:
                    breadcrumbs.push({ name: path[s], path: `${basePath}/${path[s - 1]}/${path[s]}` })
                    break;
                case 3:
                    breadcrumbs.push({ name: path[s], path: `${basePath}/${path[s - 2]}/${path[s - 1]}/${path[s]}` })
                    break;
            }
        }

        const pageMeta = {
            title: `${post[0].title} (sinfullycoded.com)`,
            og_title: post[0].title,
            og_url: `https://sinfullcoded.com/blog/${post[0].category}/${post[0].slug.current}`,
            og_description: post[0].snippet,
            og_type: 'article',
            og_image: ''
        };

        const content = toHTML(post[0].body, { components: customTextComponents });
        res.render('post', { post: post[0], body: content, toc: toc, meta: pageMeta, path: breadcrumbs, page: 'blog' })
    })
}