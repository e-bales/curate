import 'dotenv/config';
import argon2 from 'argon2';
import express from 'express';
import errorMiddleware from './lib/error-middleware.js';
import ClientError from './lib/client-error.js';
import jwt from 'jsonwebtoken';
import pg from 'pg';

// eslint-disable-next-line no-unused-vars -- Remove when used
const db = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

const app = express();

// Create paths for static directories
const reactStaticDir = new URL('../client/build', import.meta.url).pathname;
const uploadsStaticDir = new URL('public', import.meta.url).pathname;

app.use(express.static(reactStaticDir));
// Static directory for file uploads server/public/
app.use(express.static(uploadsStaticDir));
app.use(express.json());

app.get('/api/hello', (req, res) => {
  res.json({ message: 'Boom POW!' });
});

app.post('/api/auth/sign-up', async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      throw new ClientError(400, 'username and password are required fields');
    }
    const hashedPW = await argon2.hash(password);
    const checkSql = `
    select *
      from "users"
    where "username" = $1
    `;
    const checkParams = [username];
    const checkResult = await db.query(checkSql, checkParams);
    if (checkResult.rowCount > 0) {
      throw new ClientError(400, 'username is taken');
    }
    const sql = `
    insert into "users" ("username", "password")
    values ($1, $2)
    returning "username", "userId"
    `;
    const params = [username, hashedPW];
    const result = await db.query(sql, params);
    const [user] = result.rows;
    res.status(201).json(user);
  } catch (err) {
    next(err);
  }
});

app.post('/api/auth/sign-in', async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      throw new ClientError(401, 'invalid login');
    }
    const sql = `
    select "userId", "password"
      from "users"
    where "username" = $1
    `;
    const params = [username];
    const result = await db.query(sql, params);
    const [user] = result.rows;
    if (!user) {
      throw new ClientError(401, 'invalid login');
    }
    if (!(await argon2.verify(user.password, password))) {
      throw new ClientError(401, 'invalid login');
    }
    const userId = user.userId;
    const payload = { userId, username };
    const token = jwt.sign(payload, process.env.TOKEN_SECRET);
    res.json({ token, user: payload });
  } catch (err) {
    next(err);
  }
});

app.delete('/api/auth/:userId', async (req, res, next) => {
  try {
    const deleteId = Number(req.params.userId);
    if (!Number.isInteger(deleteId)) {
      throw new ClientError(400, 'not a valid Id');
    }
    const sql = `
    delete from "users"
      where "userId" = $1
    returning *
    `;
    const params = [deleteId];
    const result = await db.query(sql, params);
    const [deleted] = result.rows;
    if (!deleted) {
      throw new ClientError(404, `UserId of ${deleteId} was not found.`);
    }
    res.sendStatus(204);
  } catch (err) {
    next(err);
  }
});
/**
 * Serves React's index.html if no api route matches.
 *
 * Implementation note:
 * When the final project is deployed, this Express server becomes responsible
 * for serving the React files. (In development, the Create React App server does this.)
 * When navigating in the client, if the user refreshes the page, the browser will send
 * the URL to this Express server instead of to React Router.
 * Catching everything that doesn't match a route and serving index.html allows
 * React Router to manage the routing.
 */
app.get('*', (req, res) => res.sendFile(`${reactStaticDir}/index.html`));

app.use(errorMiddleware);

app.listen(process.env.PORT, () => {
  process.stdout.write(`\n\napp listening on port ${process.env.PORT}\n\n`);
});
