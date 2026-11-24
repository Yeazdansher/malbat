-- Raise family-memories bucket limit to 10 MB (matches app validation).

update storage.buckets
set file_size_limit = 10485760
where id = 'family-memories';
