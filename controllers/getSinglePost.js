import { formatDate, slugify, checkPageTheme, generateOgImage } from "../utils.js";
import { cosmicReader } from '../server.js';
import { fs, __dirname } from '../server.js';

/* 
 * Tools for processing markdown
 *
 * Why so many imports? Rehype/Remark relies on plugins for specific functionality 🤷🏾‍♀️
 */
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import rehypeStringify from 'rehype-stringify';
import rehypeHighlight from 'rehype-highlight';
import rehypeSlug from 'rehype-slug';
import readingTime from "remark-reading-time";

export default async function getSinglePostBySlug(req, res) {

    // Get posts from Cosmic JS SDK
    const singlePostQuery = {type: "posts", slug: req.params.slug};

    const props = [
        "id",
        "created_at",
        "published_at",
        "modified_at",
        "status",
        "slug",
        "title",
        "content",
        "metadata"
    ];

    const getPost = await cosmicReader.objects
        .find(singlePostQuery)
        .props(props.toString())
        .status("published")
        .limit(1)

    let post = getPost.objects[0];

    // Format dates from post data
    if (post.status !== "published") {
        post.published = formatDate(post.created_at);
    } else {
        post.published = formatDate(post.published_at);
    }
    post.updated = formatDate(post.modified_at);

    // Whitelists HTML attributes that are allowed from markdown
    const rehypeSanitizeOptions = {
        ...defaultSchema,
        attributes: {
            ...defaultSchema.attributes,
            div: [
                ...(defaultSchema.attributes.div || []),
                ['className']
            ],
            span: [
                ...(defaultSchema.attributes.span || []),
                ['className']
            ],
            code: [
                ...(defaultSchema.attributes.code || []),
                // List of all allowed languages:
                ['className', 'language-js', 'language-css', 'language-md', 'language-php', 'language-json', 'language-bash']
            ]
        }
    };

    // Process markdown, highlight code snippets, slugify heading names
    const markdownProcessor = unified()
        .use(remarkParse)
        .use(remarkRehype, { allowDangerousHtml: true })
        .use(rehypeRaw)
        .use(rehypeSanitize, rehypeSanitizeOptions)
        .use(rehypeHighlight)
        .use(rehypeSlug)
        .use(readingTime)

    const markdownData = post.metadata.md;
    const html = await markdownProcessor.use(rehypeStringify).process(markdownData);
    post["readingTime"] = html.data.readingTime.text;

    // Create table of contents for blog post
    let tableOfConents = [];
    const markdownDocumentTree = markdownProcessor.parse(markdownData)["children"]

    markdownDocumentTree
    .filter((branch) => branch.type === "heading")
    .map(heading => {
        tableOfConents.push({
            title: heading.children[0].value, 
            anchor: slugify(heading.children[0].value)
        })
    })

    // Create breadcrumbs menu for blog post
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


    // Generate blog meta tag data and OG image
    const pageMeta = {
        title: `${post.title} (sinfullycoded.com)`,
        og_title: post.title,
        og_url: `${process.env.BASE_URL}/blog/${post.metadata.category.title}/${post.slug}`,
        og_description: post.content,
        og_type: 'article',
        og_image: ''
    };

    const ogImgOpts = {
        post_id: post.id,
        category: post.metadata.category.title,
        title: post.title,
        tags: post.metadata.tags.map(tag => `#${tag.title}`)
    }

    fs.access(__dirname + `/public/assets/images/blog/${post.id}.png`, fs.F_OK, (err) => {
        if (err) {
            generateOgImage(ogImgOpts)
            pageMeta.og_image = `${process.env.BASE_URL}/assets/images/blog/${post.id}.png`;
            return;
        }
    });

    pageMeta.og_image = `${process.env.BASE_URL}/assets/images/blog/${post.id}.png`;

    // Prepare page data and render post view
    const nonce = res.locals.nonce;
    const pageData = { 
        post: post, 
        body: html, 
        toc: tableOfConents, 
        page: 'blog-post', 
        meta: pageMeta,
        theme: checkPageTheme(req), 
        path: breadcrumbs,
        nonce: nonce
    }

    res.render('post', pageData)

}