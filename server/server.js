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

/**
 * General function for querying museum api and returning response.
 * @param {string} url
 * @returns json'ed museum api response
 */
async function getMuseumData(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Unable to retrieve data...');
    }
    const data = await response.json();
    return data;
  } catch (err) {
    throw new Error(err.message);
  }
}

/**
 * Sign-up endpoint. Attempts to add user to the db. Will throw an error
 * if the username already exists.
 */
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

/**
 * Sign-In endpoint. Will throw an error if the provided username and password
 * do not match enything in our db.
 */
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

/**
 * User delete end-point. CURRENTLY not reachable client-side. Only for
 * development purposes only.
 */
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
 * Endpoint that retrieves a username given a userId.
 */
app.get('/api/db/:userId', async (req, res, next) => {
  try {
    const userId = Number(req.params.userId);
    if (!Number.isInteger(userId)) {
      throw new ClientError(404, 'Not a valid userId');
    }
    const sql = `
    select "username"
      from "users"
    where "userId" = $1
    `;
    const params = [userId];
    const result = await db.query(sql, params);
    const [user] = result.rows;
    if (!user) {
      throw new ClientError(404, 'Could not find the requested user.');
    }
    res.status(201).json(user);
  } catch (err) {
    next(err);
  }
});

/**
 * Endpoint for the homepage, retrieves 6 random images to display.
 */
app.get('/api/museum/random', async (req, res, next) => {
  try {
    const url =
      'https://collectionapi.metmuseum.org/public/collection/v1/search?departmentId=11&q=painting&hasImage=true';
    let data = await getMuseumData(url);
    data = data.objectIDs;
    const artData = [];
    const usedAlready = [];
    const init = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    };
    while (artData.length < 6) {
      const item = data[Math.floor(Math.random() * data.length)];
      if (usedAlready.includes(item)) {
        continue;
      }
      const art = await fetch(
        `https://collectionapi.metmuseum.org/public/collection/v1/objects/${item}`,
        init
      );
      const json = await art.json();
      if (json.primaryImageSmall.length === 0) {
        continue;
      }
      usedAlready.push(item);
      const artObj = { id: item, imageUrl: json.primaryImageSmall };
      artData.push(artObj);
    }
    res.status(201).json(artData);
  } catch (err) {
    next(err);
  }
});

/**
 * Endpoint for MultiDisplay. Retrieves the the 'page'th 10 art objectID's.
 */
app.get(
  '/api/museum/department/:departmentId/:page',
  authorizationMiddleware,
  async (req, res, next) => {
    try {
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
      if (!data.objectIDs[page * 10]) {
        moreData = false;
      }
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
        artData.push(json);
      }
      const returningData = {
        data: artData,
        more: moreData,
      };
      res.status(201).json(returningData);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * Endpoint for retrieving object's actual information from the MET api. Used
 * in many places, including SingleDisplay.
 */
app.get(
  '/api/museum/object/:objectId',
  authorizationMiddleware,
  async (req, res, next) => {
    try {
      const id = Number(req.params.objectId);
      if (!Number.isInteger(id)) {
        throw new ClientError(400, 'not a valid address');
      }
      const url = `https://collectionapi.metmuseum.org/public/collection/v1/objects/${id}`;
      const data = await getMuseumData(url);
      res.status(201).json(data);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * Endpoint for when a user unfavorites a piece of art. Connect to the Heart component.
 */
app.delete(
  '/api/favorites/delete/:userId/:objectId',
  authorizationMiddleware,
  async (req, res, next) => {
    try {
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
      res.sendStatus(204);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * Endpoint for adding an object to a user's favorites. Connected to the Heart Component.
 */
app.post(
  '/api/favorites/add/:userId/:objectId',
  authorizationMiddleware,
  async (req, res, next) => {
    try {
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
  }
);

/**
 * Endpoint for retrieving and displaying the user's Favorites page. Pagination
 * is included in this endpoint, given a page number.
 */
app.get(
  '/api/favorites/:userId/:page',
  authorizationMiddleware,
  async (req, res, next) => {
    try {
      const userId = Number(req.params.userId);
      const page = Number(req.params.page);
      const sql = `
    select "artId",
           "description"
      from "favorites"
    where "userId" = $1
    order by "timeAdded" desc
    `;
      const params = [userId];
      const result = await db.query(sql, params);
      const rows = result.rows;
      let moreData = true;
      if (!rows[page * 10]) {
        moreData = false;
      }
      let data = [];
      if (rows.length > 0) {
        const slicedRows = rows.slice((page - 1) * 10, page * 10);
        const newRows = slicedRows.map((element) => ({
          artId: element.artId,
          isGallery: element.description !== null,
        }));
        data = newRows;
      }
      const init = {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      };
      const artData = [];
      for (let i = 0; i < data.length; i++) {
        const art = await fetch(
          `https://collectionapi.metmuseum.org/public/collection/v1/objects/${data[i].artId}`,
          init
        );
        const json = await art.json();
        json.isGallery = data[i].isGallery;
        artData.push(json);
      }

      const sqlCount = `
    select count(*) as "totalGallery"
      from "favorites"
    where "userId" = $1 AND "description" IS NOT NULL
    `;
      const totalResult = await db.query(sqlCount, params);
      const total = totalResult.rows[0]?.totalGallery;

      const returningData = {
        data: artData,
        more: moreData,
        galleryFull: total >= 5,
      };

      res.status(201).json(returningData);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * Endpoint for retrieving JUST the art ID's for localStorage. Does NOT retrieve
 * and of the actual information about the art pieces.
 */
app.get('/api/favorites/:userId', async (req, res, next) => {
  try {
    const userId = Number(req.params.userId);
    const sql = `
    select "artId"
      from "favorites"
    where "userId" = $1
    `;
    const params = [userId];
    const result = await db.query(sql, params);
    const rows = result.rows;
    const newRows = rows.map((element) => element.artId);
    res.status(201).json(newRows);
  } catch (err) {
    next(err);
  }
});

/**
 * Endpoint for retrieving all the user's that userId follows
 */
app.get(
  '/api/followers/:userId',
  authorizationMiddleware,
  async (req, res, next) => {
    try {
      const userId = Number(req.params.userId);
      const sql = `
        select "followedUserId"
          from "followers"
        where "userId" = $1
        `;
      const params = [userId];
      const result = await db.query(sql, params);
      const rows = result.rows;
      const newRows = [];
      for (let i = 0; i < rows.length; i++) {
        const usernameSql = `
        select "username"
          from "users"
        where "userId" = $1
        `;
        const usernameParams = [rows[i].followedUserId];
        const result = await db.query(usernameSql, usernameParams);
        const newObj = {
          userId: rows[i].followedUserId,
          username: result.rows[0].username,
        };
        newRows.push(newObj);
      }
      res.status(201).json(newRows);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * Endpoint for when the user searches for other user's on their Profile page.
 * Ensures that the user's own name does not appear.
 */
app.get('/api/user/search/:userId/:search', async (req, res, next) => {
  try {
    const search = req.params.search;
    const userId = Number(req.params.userId);
    const sql = `
      select "username",
             "userId"
        from "users"
      where "username" LIKE $2 AND NOT "userId" = $1
      `;
    const searchPlus = '%' + search + '%';
    const params = [userId, searchPlus];
    const result = await db.query(sql, params);
    res.status(201).json(result.rows);
  } catch (err) {
    next(err);
  }
});

/**
 * Endpoint for when the user wants to follow another user.
 */
app.post('/api/followers/add/:userId/:requestId', async (req, res, next) => {
  try {
    const userId = Number(req.params.userId);
    const requestId = Number(req.params.requestId);
    if (!Number.isInteger(userId) || !Number.isInteger(requestId)) {
      throw new ClientError(
        404,
        `Could not add ${requestId} to user ${userId}'s followed list.`
      );
    }
    const sql = `
    insert into "followers" ("userId", "followedUserId")
    values ($1, $2)
    returning *
    `;
    const params = [userId, requestId];
    const result = await db.query(sql, params);
    if (result.rows.length < 1) {
      throw new ClientError(
        404,
        `Could not add ${requestId} to user ${userId}'s followed list.`
      );
    }
    res.status(201).json(result.rows);
  } catch (err) {
    next(err);
  }
});

/**
 * Endpoint for when the user removes another user from their follow list.
 */
app.delete(
  '/api/followers/delete/:userId/:requestId',
  async (req, res, next) => {
    try {
      const userId = Number(req.params.userId);
      const requestId = Number(req.params.requestId);
      if (!Number.isInteger(userId) || !Number.isInteger(requestId)) {
        throw new ClientError(
          404,
          `Could not add ${requestId} to user ${userId}'s followed list.`
        );
      }
      const sql = `
    delete
      from "followers"
      where "userId" = $1 and "followedUserId" = $2
    returning *
    `;
      const params = [userId, requestId];
      const result = await db.query(sql, params);
      if (result.rows.length < 1) {
        throw new ClientError(
          404,
          `Could not remove ${requestId} to user ${userId}'s followed list.`
        );
      }
      res.status(201).json(result.rows);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * Endpoint for when the user wants to add an art-piece to their Gallery.
 */
app.post(
  '/api/gallery/:userId/:artId',
  authorizationMiddleware,
  async (req, res, next) => {
    try {
      const userId = Number(req.params.userId);
      const artId = Number(req.params.artId);
      if (!Number.isInteger(userId) || !Number.isInteger(artId)) {
        throw new ClientError(
          404,
          `Could not add ${artId} to user ${userId}'s gallery due to bad request params.`
        );
      }
      const galleryText = req.body['gallery-text'];
      const sql = `
    update "favorites"
      set "description" = $3
    where "userId" = $1 AND "artId" = $2
    returning *;
    `;
      const params = [userId, artId, galleryText];
      const result = await db.query(sql, params);
      if (result.rowCount < 1) {
        throw new ClientError(404, `${artId} not in ${userId}'s favorites.`);
      }
      res.sendStatus(204);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * Endpoint for when the user wants to delete a piece from their Gallery.
 */
app.delete(
  '/api/gallery/:userId/:artId',
  authorizationMiddleware,
  async (req, res, next) => {
    try {
      const userId = Number(req.params.userId);
      const artId = Number(req.params.artId);
      if (!Number.isInteger(userId) || !Number.isInteger(artId)) {
        throw new ClientError(
          404,
          `Could not remove ${artId} from user ${userId}'s gallery due to bad request params.`
        );
      }
      const sql = `update "favorites"
      set "description" = NULL
    where "userId" = $1 AND "artId" = $2
    returning *;
    `;
      const params = [userId, artId];
      const result = await db.query(sql, params);
      if (result.rowCount < 1) {
        throw new ClientError(404, `${artId} not in ${userId}'s favorites.`);
      }
      res.sendStatus(204);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * Endpoint for retrieving the art Id's and the user's critiques for a Gallery.
 */
app.get(
  '/api/gallery/:userId',
  authorizationMiddleware,
  async (req, res, next) => {
    try {
      const userId = Number(req.params.userId);
      if (!Number.isInteger(userId)) {
        throw new ClientError(
          404,
          `Could not read user ${userId}'s gallery due to bad request params.`
        );
      }
      const sql = `
    select *
      from "favorites"
    where "userId" = $1 AND "description" IS NOT NULL
    `;
      const params = [userId];
      const result = await db.query(sql, params);
      const rows = result.rows;
      res.status(201).json(rows);
    } catch (err) {
      next(err);
    }
  }
);

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
