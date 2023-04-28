import { Feed } from "node-feed-rss";
import { cosmicReader } from '../server.js';

export async function outputFeed(req, res) {
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

    const getPosts = await cosmicReader.objects
        .find(postsQuery)
        .props(props.toString())
        .sort("modified_at")
        .status("published")
        .limit(10)

    let posts = getPosts.objects;

    const feed = new Feed({
        title: "Sinfully Coded BLog",
        description: "Feed of my blog content",
        id: "http://example.com/",
        link: "http://example.com/",
        language: "en", // optional, used only in RSS 2.0, possible values: http://www.w3.org/TR/REC-html40/struct/dirlang.html#langcodes
        image: "http://example.com/image.png",
        favicon: "http://example.com/favicon.ico",
        copyright: "All rights reserved 2023, Shakima Franklin",
        updated: new Date(posts[0].modified_at),
        generator: "awesome", // optional, default = 'Feed for Node.js'
        feedLinks: {
            json: "https://sinfullycoded.com/json",
            atom: "https://sinfullycoded.com/atom"
        },
        author: {
            name: "Shakima Franklin",
            email: "shakima@sinfullycoded.com",
            link: "https://sinfullycoded.com/johndoe"
        }
    });

    posts.forEach(post => {
        feed.addItem({
            title: post.title,
            id: post.slug,
            link: 'https://sinfullycoded.com' + post.slug,
            description: post.content,
            content: post.content,
            author: [
                {
                    name: "Shakima Franklin",
                    email: "shakima@sinfullycoded.com",
                    link: "https://sinfullycoded.com/johndoe"
                }
            ],
            date: new Date(post.created_at),
            image: post.thumb
        });
    });

    let output;
    switch (req.params.feed) {
        case 'rss':
            // Output: RSS 2.0
            res.set('Content-Type', 'text/xml');
            output = feed.rss2();
            break;
        case 'json':
            // Output: JSON Feed 1.0
            res.set('Content-Type', 'text/json');
            output = feed.json1();
            break;
        case 'atom':
            // Output: Atom 1.0
            res.set('Content-Type', 'text/xml');
            output = feed.atom1();
            break;
    }

    res.send(output)
}