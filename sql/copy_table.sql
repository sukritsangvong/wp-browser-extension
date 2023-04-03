COPY click_count FROM 'YOUR_FILE_PATH' WITH CSV DELIMITER E'\t' QUOTE '}' ESCAPE '\';
ALTER TABLE click_count ALTER count TYPE integer USING count::int;