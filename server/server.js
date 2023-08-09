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
    // console.log('Db user is: ', user);
    if (!user) {
      throw new ClientError(404, 'Could not find the requested user.');
    }
    res.status(201).json(user);
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

app.get('/api/museum/random', async (req, res, next) => {
  try {
    console.log('Attempting to pull random data...');
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

app.get(
  '/api/museum/object/:objectId',
  authorizationMiddleware,
  async (req, res, next) => {
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
  }
);

app.delete(
  '/api/favorites/delete/:userId/:objectId',
  authorizationMiddleware,
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

app.post(
  '/api/favorites/add/:userId/:objectId',
  authorizationMiddleware,
  async (req, res, next) => {
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
  }
);

app.get(
  '/api/favorites/:userId/:page',
  authorizationMiddleware,
  async (req, res, next) => {
    try {
      const userId = Number(req.params.userId);
      const page = Number(req.params.page);
      console.log(`Retrieving favorites, page: ${page}, for ${userId}`);
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
      // console.log('Next spot = :', data.objectIDs[page * 10]);
      if (!rows[page * 10]) {
        moreData = false;
      }
      let data = [];
      if (rows.length > 0) {
        const slicedRows = rows.slice((page - 1) * 10, page * 10);
        // console.log('slicedRows: ', slicedRows);
        const newRows = slicedRows.map((element) => ({
          artId: element.artId,
          isGallery: element.description !== null,
        }));
        // console.log('newRows: ', newRows);
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
        // console.log('json: ', json);
        artData.push(json);
      }

      const sqlCount = `
    select count(*) as "totalGallery"
      from "favorites"
    where "userId" = $1 AND "description" IS NOT NULL
    `;
      const totalResult = await db.query(sqlCount, params);
      const total = totalResult.rows[0]?.totalGallery;
      console.log('Total is: ', total);

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

// Just gets the id's for localStorage, not retrieving api data
app.get('/api/favorites/:userId', async (req, res, next) => {
  try {
    const userId = Number(req.params.userId);
    console.log(`Retrieving all favorites for ${userId}`);
    const sql = `
    select "artId"
      from "favorites"
    where "userId" = $1
    `;
    const params = [userId];
    const result = await db.query(sql, params);
    const rows = result.rows;
    const newRows = rows.map((element) => element.artId);
    // console.log('newRows is: ', newRows);
    res.status(201).json(newRows);
  } catch (err) {
    next(err);
  }
});

app.get(
  '/api/followers/:userId',
  authorizationMiddleware,
  async (req, res, next) => {
    try {
      const userId = Number(req.params.userId);
      console.log(`Retrieving followers for ${userId}`);
      // const sql = `
      //   select "f"."followedUserId",
      //          "u"."username"
      //     from "followers" as "f"
      //   join "users" as "u" using ("userId")
      //   where "userId" = $1
      // `;
      const sql = `
        select "followedUserId"
          from "followers"
        where "userId" = $1
        `;
      // NEED TO WRITE A JOIN!
      const params = [userId];
      const result = await db.query(sql, params);
      const rows = result.rows;
      console.log('Rows is: ', rows);
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

      // if (rows.length > 0) {
      //   const newRows = rows.map((element) => element.artId);
      //   res.status(201).json(newRows);
      // } else {
      //   res.status(201).json([]);
      // }
    } catch (err) {
      next(err);
    }
  }
);

app.get('/api/user/search/:userId/:search', async (req, res, next) => {
  try {
    const search = req.params.search;
    const userId = Number(req.params.userId);
    console.log(`User ${userId} is searching for ${search}...`);
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
    console.log(`Attempting to send follower request to db`);
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
      console.log(`Attempting to send follower DELETE request to db`);
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

app.post(
  '/api/gallery/:userId/:artId',
  authorizationMiddleware,
  async (req, res, next) => {
    try {
      const userId = Number(req.params.userId);
      const artId = Number(req.params.artId);
      console.log('userID: ', userId);
      console.log('artId: ', artId);
      if (!Number.isInteger(userId) || !Number.isInteger(artId)) {
        throw new ClientError(
          404,
          `Could not add ${artId} to user ${userId}'s gallery due to bad request params.`
        );
      }
      const galleryText = req.body['gallery-text'];
      console.log('Gallery submission info is: ', galleryText);
      const sql = `
    update "favorites"
      set "description" = $3
    where "userId" = $1 AND "artId" = $2
    returning *;
    `;
      const params = [userId, artId, galleryText];
      const result = await db.query(sql, params);
      if (result.rowCount < 1) {
        console.log(result);
        throw new ClientError(404, `${artId} not in ${userId}'s favorites.`);
      }
      res.sendStatus(204);
    } catch (err) {
      next(err);
    }
  }
);

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
        console.log(result);
        throw new ClientError(404, `${artId} not in ${userId}'s favorites.`);
      }
      res.sendStatus(204);
    } catch (err) {
      next(err);
    }
  }
);

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
