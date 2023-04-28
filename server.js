import express from 'express';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import compression from 'compression';
import crypto from 'crypto';
import fs from 'fs';
import Cosmic from 'cosmicjs';

// ===============================
// General path, view config & other middleware
// ================================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
app.use(compression());
app.use(cookieParser());
app.set('views', path.join(__dirname, './views'));
app.set('view engine', 'twig');
app.use(express.static(path.join(__dirname, 'public')))
app.use(function(req, res, next) {
  let nonce = crypto.randomBytes(16).toString('base64');
  res.locals.nonce = nonce;
  if (process.env.NODE_ENV === "production") {
  res.setHeader("Content-Security-Policy", `default-src 'self' 'nonce-${nonce}'`);
  res.setHeader("Content-Security-Policy", `script-src 'self' 'nonce-${nonce}'`);
  res.setHeader("Content-Security-Policy", `style-src-elem 'self' fonts.googleapis.com fonts.gstatic.com 'nonce-${nonce}'`);
  }
  return next();
});

const PORT = process.env.PORT || 3000
export {fs, __dirname};

// ===============================
// Set enviornment appropiate variables
// ================================
let bucketSlug;
if (!process.env.NODE_ENV) {
  dotenv.config({ path: '.env.production' })
  process.env.NODE_ENV = "production";
  bucketSlug = 'sinfully-coded-production';
} else {
  dotenv.config({ path: '.env.development' })
  bucketSlug = 'sinfully-coded-staging';
}

// ===============================
// Cosmic CMS config
// ================================
const cosmicClient = Cosmic();

export const cosmicReader = cosmicClient.bucket({
  slug: bucketSlug,
  read_key: process.env.COSMIC_RK
});

export const cosmicWriter = cosmicClient.bucket({
  slug: bucketSlug,
  write_key: process.env.COSMIC_WK
});

// ===============================
// API Routes
// ===============================

app.post('/api/add-comment', express.json(), addComment)

// ===============================
// Imports for router controllers
// ===============================
import getSinglePostBySlug from './controllers/getSinglePost.js';
import { getPosts, getPostsByCat, getPostsByTag } from './controllers/getPosts.js';
import { getProjects } from './controllers/getProjects.js';
import { addComment } from './controllers/addComment.js';
import { outputFeed } from './controllers/generateFeed.js';
import { checkPageTheme } from './utils.js';


// ===============================
// Page Routes
// ===============================

app.get('/', async (req, res) => {
  res.render('index', { page_title: 'Sinfully Coded - A personal site & dev blog', page: 'index', theme: checkPageTheme(req), nonce: res.locals.nonce });
})

/* app.get('/about', async (req, res) => {
  res.render('about', { page_title: 'About (sinfullycoded.com)', page: 'about', theme: checkPageTheme(req), nonce: res.locals.nonce});
}) */

app.get('/projects', getProjects)

app.get('/resume', async (req, res) => {
  let allowedIps = ['68.183.134.79', '::1'];

  if(!allowedIps.includes(req.ip)) {
    return res.status(404).render('errors/404');
  }

  let resumeData;

  async function getResumeData() {
    return new Promise(function (resolve, reject) {
      fs.readFile('src/assets/resume.json', 'utf-8', (error, data) => {
        if (error) reject(error)
        else resolve(JSON.parse(data));
      })
    })
  }

  resumeData = await getResumeData();

  res.render('resume', { data: resumeData, page_title: 'Shakima F. - Resume (sinfullycoded.com)', page: 'resume', theme: checkPageTheme(req), nonce: res.locals.nonce});
})


// ===============================
// URL Redirects
// ===============================
app.get("/do", (req, res) => {
  res.status(301).redirect("https://m.do.co/c/07590f95adbe")
})

app.get("/p/ftrdv1", (req, res) => {
  res.status(301).redirect("https://web.archive.org/web/20211028031147/https://featrd.io/")
})

// ===============================
// Blog Routes
// ===============================

// Feeds for readers
app.get('/blog/:feed(rss|json|atom)', outputFeed)

//  posts by category
app.get('/blog/categories/:cat', getPostsByCat)

// posts by tag
app.get('/blog/tags/:tag', getPostsByTag)

// single blog post for previewing documents
if(process.env.NODE_ENV === "development") {
app.get('/blog/:slug', getSinglePostBySlug)
}

// single blog post
app.get('/blog/:category/:slug', getSinglePostBySlug)

// multiple blog posts
app.get('/blog', getPosts)

// catchall, show a 404 error
app.get('*', async (req, res) => {
  res.status(404).render('errors/404');
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
  console.log('Your app is running at ' + process.env.BASE_URL)
})

process.on('SIGTERM', () => {
  debug('SIGTERM signal received: closing HTTP server')
  server.close(() => {
    process.exit()
  })
})