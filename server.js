import express from 'express';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import sanityClient from '@sanity/client';

// ===============================
// General path, view config & other middleware
// ================================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
app.use(cookieParser());
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
  };
} else {
  dotenv.config({ path: '.env.development' })
  addlSanityConfig = {
    dataset: "development",
  };
}

const sanityConfig = {
  projectId: '9e74j303',
  apiVersion: '2021-10-21',
  token: process.env.SANITY_AUTH_TOKEN,
  useCdn: true
};

export const sanity = sanityClient({ ...sanityConfig, ...addlSanityConfig })

// ===============================
// Imports for router controllers
// ===============================
import getSinglePostBySlug from './controllers/getSinglePost.js';
import { getPosts, getPostsByCat, getPostsByTag } from './controllers/getPosts.js';
import { addComment } from './controllers/addComment.js';
import { checkPageTheme } from './utils.js';

// ===============================
// API Routes
// ===============================

app.post('/api/add-comment', express.json(), async (req, res) => { 
  addComment(req, res)
})

// ===============================
// Page Routes
// ===============================

app.get('/', async (req, res) => {
  res.render('index', { page_title: 'Sinfully coded a personal site & dev blog', page: 'index', theme: checkPageTheme(req) });
})

app.get('/about', async (req, res) => {
  res.render('about', { page_title: 'About (sinfullycoded.com)', page: 'about', theme: checkPageTheme(req)});
})


// Show blog posts by category
app.get('/blog/categories/:cat', async (req, res) => {
  getPostsByCat(req, res)
})

// Show blog posts by tag
app.get('/blog/tags/:tag', async (req, res) => {
  getPostsByTag(req, res)
})

// Show a single blog post
app.get('/blog/:category/:slug', async (req, res) => {
  getSinglePostBySlug(req, res)
})

// show multiple blog posts
app.get('/blog', async (req, res) => {
  getPosts(req, res)
})

// TODO: Move main function logic out of server file and import
app.get('/projects', async (req, res) => {
  const projectsQuery =
    `*[_type == 'project']|order(_updatedAt desc){ 
      _updatedAt,
      title, 
      slug, 
      status,
      summary,  
      languages,
      tech,
      "image": mainImage.asset->url
    }[0...10]`;

  const projects = await sanity.fetch(projectsQuery)

  res.render('projects', { projects: projects, page_title: 'Projects (sinfullycoded.com)', page: 'projects', theme: checkPageTheme(req) });
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

process.on('SIGTERM', () => {
  debug('SIGTERM signal received: closing HTTP server')
  server.close(() => {
    process.exit()
    debug('HTTP server closed')
  })
})