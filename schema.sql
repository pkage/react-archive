DROP TABLE IF EXISTS Posts;
DROP TABLE IF EXISTS Services;

CREATE VIRTUAL TABLE Posts USING fts5(text, id, img, time, author_id, author_name);
