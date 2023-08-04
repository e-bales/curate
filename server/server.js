import 'dotenv/config';
import argon2 from 'argon2';
import express from 'express';
import errorMiddleware from './lib/error-middleware.js';
import ClientError from './lib/client-error.js';
import authorizationMiddleware from './lib/authorization-middleware.js';
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

// app.get('/api/hello', (req, res) => {
//   res.json({ message: 'Boom POW!' });
// });

async function getMuseumData(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.log(response);
      throw new Error('Unable to retrieve data...');
    }
    const data = await response.json();
    return data;
  } catch (err) {
    throw new Error(err.message);
  }
}

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
 * Loads all the data server side, so we don't have to re-query the api multiple times.
 */
// app.get('/api/museum/:departmentId', async (req, res, next) => {
//   try {
//     console.log('Attempting to cache data...');
//     const id = Number(req.params.departmentId);
//     if (!Number.isInteger(id)) {
//       throw new ClientError(400, 'not a valid Id');
//     }
//     const url = `https://collectionapi.metmuseum.org/public/collection/v1/search?departmentId=${id}&q=painting&hasImage=true`;
//     const data = await getMuseumData(url);
//     currentDataRequest = data;
//     console.log(`Data cached as ${currentDataRequest}`);
//     console.log(currentDataRequest);
//     res.sendStatus(204);
//   } catch (err) {
//     next(err);
//   }
// });

/**
 * Retrieves the the 'page'th 10 art objectID's
 */
app.get(
  '/api/museum/department/:departmentId/:page',
  authorizationMiddleware,
  async (req, res, next) => {
    try {
      console.log('Attempting to pull multi-data...');
      const id = Number(req.params.departmentId);
      const page = Number(req.params.page);
      if (!Number.isInteger(page) || !Number.isInteger(id)) {
        throw new ClientError(400, 'not a valid address');
      }
      // server side pagination, returns arrays of length 10, if available.
      const url = `https://collectionapi.metmuseum.org/public/collection/v1/search?departmentId=${id}&q=painting&hasImage=true`;
      const data = await getMuseumData(url);
      const retrievedData = data.objectIDs.slice((page - 1) * 10, page * 10);
      let moreData = true;
      // console.log('Next spot = :', data.objectIDs[page * 10]);
      if (!data.objectIDs[page * 10]) {
        moreData = false;
      }
      // console.log('retrieved data: ', retrievedData);
      if (retrievedData.length === 0) {
        throw new ClientError(404, 'No art pieces found of that specification');
      }
      const init = {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      };
      const artData = [];
      for (let i = 0; i < retrievedData.length; i++) {
        const art = await fetch(
          `https://collectionapi.metmuseum.org/public/collection/v1/objects/${retrievedData[i]}`,
          init
        );
        const json = await art.json();
        // console.log('json: ', json);
        artData.push(json);
      }
      const returningData = {
        data: artData,
        more: moreData,
      };
      // console.log('Final objects: ', artData);
      res.status(201).json(returningData);
    } catch (err) {
      next(err);
    }
  }
);

app.get('/api/museum/object/:objectId', async (req, res, next) => {
  try {
    console.log('Attempting to pull single data...');
    const id = Number(req.params.objectId);
    if (!Number.isInteger(id)) {
      throw new ClientError(400, 'not a valid address');
    }
    console.log(`Getting data for id: ${id}`);
    const url = `https://collectionapi.metmuseum.org/public/collection/v1/objects/${id}`;
    const data = await getMuseumData(url);
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
});

app.delete(
  '/api/favorites/delete/:userId/:objectId',
  async (req, res, next) => {
    try {
      console.log('Attempting to delete favorited image...');
      const userId = Number(req.params.userId);
      const artId = Number(req.params.objectId);
      const sql = `
    delete
      from "favorites"
    where "userId" = $1 AND "artId" = $2
    returning *
    `;
      const params = [userId, artId];
      const result = await db.query(sql, params);
      if (result.rowCount < 1) {
        throw new ClientError(
          404,
          `Could not delete ${artId} from user ${userId}'s favorites.`
        );
      }
      console.log(result);
      res.sendStatus(204);
    } catch (err) {
      next(err);
    }
  }
);

app.post('/api/favorites/add/:userId/:objectId', async (req, res, next) => {
  try {
    console.log('Attempting to add favorited image...');
    const userId = Number(req.params.userId);
    const artId = Number(req.params.objectId);
    if (!Number.isInteger(userId) || !Number.isInteger(artId)) {
      throw new ClientError(
        404,
        `Could not add ${artId} to user ${userId}'s favorites.`
      );
    }
    const sql = `
    insert into "favorites" ("userId", "artId")
    values ($1, $2)
    returning *
    `;
    const params = [userId, artId];
    const result = await db.query(sql, params);
    if (result.rowCount < 1) {
      throw new ClientError(
        404,
        `Could not add ${artId} to user ${userId}'s favorites.`
      );
    }
    res.sendStatus(204);
  } catch (err) {
    next(err);
  }
});

app.get('/api/favorites/:userId', async (req, res, next) => {
  try {
    const userId = Number(req.params.userId);
    console.log(`Retrieving favorites for ${userId}`);
    const sql = `
    select "artId"
      from "favorites"
    where "userId" = $1
    `;
    const params = [userId];
    const result = await db.query(sql, params);
    const rows = result.rows;
    if (rows.length > 0) {
      const newRows = rows.map((element) => element.artId);
      res.status(201).json(newRows);
    } else {
      res.status(201).json([]);
    }

    // console.log('Returned favorites are: ', newRows);

    // res.status(201).json(result);
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
