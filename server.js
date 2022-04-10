import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { toHTML } from '@portabletext/to-html';
import dotenv from 'dotenv';
import sanityClient from '@sanity/client';
import { highlightCode, formatDate } from './utils.js';

// ===============================
// General path & view config
// ================================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
app.set('views', path.join(__dirname, './views'));
app.set('view engine', 'twig');
app.use(express.static(path.join(__dirname, 'public')))

const PORT = process.env.PORT || 3000

// ===============================
// Sanity content config
// ================================
let addlSanityConfig;
if (!process.env.NODE_ENV) {
  dotenv.config({ path: '.env.production' })
  process.env.NODE_ENV = "production";
  addlSanityConfig = {
    dataset: "production",
    useCdn: true
  };
} else {
  dotenv.config({ path: '.env.development' })
  addlSanityConfig = {
    dataset: "development",
    useCdn: false // CDN not needed in development
  };
}

const sanityConfig = {
  projectId: '9e74j303',
  apiVersion: '2021-10-21',
  token: process.env.SANITY_AUTH_TOKEN
};

const sanity = sanityClient({ ...sanityConfig, ...addlSanityConfig })

// ===============================
// Imports for router controllers
// ===============================
import getSinglePostBySlug from './controllers/GetSinglePostBySlug.js';

// ===============================
// Routes
// ===============================

app.get('/', async (req, res) => {
  res.render('index', { page_title: 'Sinfully coded - building & breaking things as I go', page: 'index' });
})

// Show a single blog post
app.get('/blog/:category/:slug', async (req, res) => {
  getSinglePostBySlug(req, res, sanity)
})

// show multiple blog posts
// TODO: Move logic out of server file
app.get('/blog', async (req, res) => {
  const postsQuery =
    `*[_type == 'post' && !(_id in path("drafts.**"))]|order(publishedAt desc){ 
      "published": publishedAt, 
      "updated": _updatedAt, 
      title, 
      slug, 
      snippet,  
      "category": lower(categories[0]->title),
      tags
    }[0...10]`;

  const posts = await sanity.fetch(postsQuery)

  // Format dates
  for (let i = 0; i < posts.length; i++) {
    posts[i]["updated"] = formatDate(posts[i].updated);
    posts[i]["published"] = formatDate(posts[i].published);
  }
  res.render('posts', { posts: posts, page_title: 'Blog - sinfullycoded.com', page: 'blog' })
})

app.get('/projects', async (req, res) => {
  const projectsQuery =
    `*[_type == 'project']|order(title asc){ 
      _updatedAt,
      title, 
      slug, 
      summary,  
      languages,
      tech,
      "image": mainImage.asset->url
    }[0...10]`;

  const projects = await sanity.fetch(projectsQuery)

  res.render('projects', { projects: projects, page_title: 'Projects - sinfullycoded.com', env: process.env.NODE_ENV, page: 'projects' });
})

app.get('/about', async (req, res, next) => {
  res.render('about', { page_title: 'About - sinfullycoded.com', page: 'about'});
})

// Everything else, show a 404 error
app.get('*', async (req, res) => {
  res.render('errors/404');
})

// development error handler
if (process.env.NODE_ENV === 'development') {
  app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render('errors/500', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
app.use(function (err, req, res, next) {
  res.status(err.status || 500);
  res.render('errors/500', {
    message: err.message,
    error: {}
  });
});

app.listen(PORT, () => {
  console.log('Your app is running at http://localhost:' + PORT)
})