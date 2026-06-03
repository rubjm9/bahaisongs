-- seed.sql
-- Seed data inserted on `supabase db reset`. Only the category vocabulary
-- (idempotent via on conflict). Track content is loaded by the ETL script
-- `scripts/import-wordpress.ts`, not by this seed.

insert into public.categories (slug, name_es, name_en, kind) values
  ('cancion',             'Canciones',         'Songs',           'genre'),
  ('oracion',             'Oraciones',         'Prayers',         'theme'),
  ('texto-sagrado',       'Texto Sagrado',     'Sacred Text',     'theme'),
  ('palabra-oculta',      'Palabra Oculta',    'Hidden Word',     'theme'),
  ('bab',                 'El Báb',            'The Báb',         'theme'),
  ('bahaullah',           'Bahá''u''lláh',      'Bahá''u''lláh',    'theme'),
  ('abdulbaha',           '''Abdu''l-Bahá',     '''Abdu''l-Bahá',   'theme'),
  ('tranquila',           'Tranquila',          'Calm',           'mood'),
  ('ritmica',             'Rítmica',            'Rhythmic',       'mood'),
  ('muy-ritmica',         'Muy rítmica',        'Very rhythmic',  'mood'),
  ('reflexiva',           'Reflexiva',          'Reflective',     'mood'),
  ('infantil',            'Infantil',           'Children',       'theme'),
  ('jovenes',             'Jóvenes',            'Youth',          'theme'),
  ('feliz',               'Feliz',              'Joyful',         'mood'),
  ('con-acordes',         'Con acordes',        'With chords',    'tag'),
  ('con-audio',           'Con audio',          'With audio',     'tag'),
  ('bicentenario-bab',    'Bicentenario del Báb','Báb bicentenary','theme'),
  ('bahaiblog-studio',    'Baha''i Blog studio', 'Baha''i Blog studio', 'tag'),
  ('bahaiblog-recording', 'Baha''i Blog recording artist', 'Baha''i Blog recording artist', 'tag'),
  ('bahaiblog-community', 'Baha''i Blog community', 'Baha''i Blog community', 'tag'),
  ('bahaiblog-hip-hop',   'Baha''i Blog hip hop', 'Baha''i Blog hip hop', 'tag')
on conflict (slug) do update set
  name_es = excluded.name_es,
  name_en = excluded.name_en,
  kind    = excluded.kind;
