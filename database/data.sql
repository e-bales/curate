-- Use SQL insert statements to add any
-- starting/dummy data to your database tables

-- EXAMPLE:

--  insert into "todos"
--    ("task", "isCompleted")
--    values
--      ('Learn to code', false),
--      ('Build projects', false),
--      ('Get a job', false);

insert into "users" ("username", "password")
  values ('dbTest', 'abc123'),
         ('person2', 'password123');

insert into "favorites" ("userId", "artId")
  values ('1', '436964'),
         ('2', '436829');

insert into "followers" ("userId", "followedUserId")
  values ('1', '2'),
         ('2', '1');
