-- noted! demo seed: one city (Atlanta), three friends, repeat visits.
-- Run with:  psql "$DATABASE_URL" -f sql/seed.sql
-- Re-running is safe: it deletes the demo users' data first.
-- Run AFTER schema.sql and aggregates.sql.
--
-- Seeded photos are remote placeholder URLs. Photos added from the app are
-- base64 JPEG data URLs; the app renders either.

begin;

delete from users where id in ('google-oauth2|900000000000000000101', 'google-oauth2|900000000000000000102', 'google-oauth2|900000000000000000103');

insert into users (id, name, email, avatar_url, is_demo) values
  ('google-oauth2|900000000000000000101', 'Maya Okonkwo (demo)', 'maya.demo@noted.app', 'https://i.pravatar.cc/200?img=47', true),
  ('google-oauth2|900000000000000000102', 'Theo Alvarez (demo)', 'theo.demo@noted.app', 'https://i.pravatar.cc/200?img=12', true),
  ('google-oauth2|900000000000000000103', 'Ren Fujita (demo)', 'ren.demo@noted.app', 'https://i.pravatar.cc/200?img=33', true);

-- Friendships are symmetric: both directions are stored.
insert into friendships (user_id, friend_id) values
  ('google-oauth2|900000000000000000101', 'google-oauth2|900000000000000000102'),
  ('google-oauth2|900000000000000000102', 'google-oauth2|900000000000000000101'),
  ('google-oauth2|900000000000000000101', 'google-oauth2|900000000000000000103'),
  ('google-oauth2|900000000000000000103', 'google-oauth2|900000000000000000101'),
  ('google-oauth2|900000000000000000102', 'google-oauth2|900000000000000000103'),
  ('google-oauth2|900000000000000000103', 'google-oauth2|900000000000000000102')
on conflict do nothing;

insert into places (id, name, lat, lng, created_by, created_at) values
  ('86ac5c90-84b1-4591-ac0e-0422a60725a4', 'Hodgepodge Coffee', 33.7404, -84.3486, 'google-oauth2|900000000000000000101', now() - interval '45 days' + interval '9 hours'),
  ('852c847d-ac31-4dfa-83ac-a0fd030306d8', 'Krog Street Market', 33.7544, -84.363, 'google-oauth2|900000000000000000102', now() - interval '45 days' + interval '9 hours'),
  ('4e35fae8-8258-442d-a13c-072c7a468099', 'Ponce City Market Roof', 33.7726, -84.3657, 'google-oauth2|900000000000000000103', now() - interval '45 days' + interval '9 hours'),
  ('4f0962b0-841b-4372-8849-1e17972ba31b', 'Piedmont Park Active Oval', 33.7857, -84.3733, 'google-oauth2|900000000000000000101', now() - interval '45 days' + interval '9 hours'),
  ('76bfb844-9c4f-4f43-971a-554f44a470cc', 'Eastside Beltline Mural Wall', 33.77, -84.365, 'google-oauth2|900000000000000000102', now() - interval '45 days' + interval '9 hours'),
  ('b59dd40b-c058-491b-8047-ee685a67f3f7', 'Octopus Bar', 33.7417, -84.3414, 'google-oauth2|900000000000000000103', now() - interval '45 days' + interval '9 hours'),
  ('c3fcbc1e-6105-43d8-80e9-89519674a3f8', 'Java Lords', 33.7399, -84.3474, 'google-oauth2|900000000000000000101', now() - interval '45 days' + interval '9 hours'),
  ('b1339e03-5c8e-4f23-afb7-2f85e9f7252f', 'Fox Theatre Marquee', 33.7726, -84.3857, 'google-oauth2|900000000000000000102', now() - interval '45 days' + interval '9 hours'),
  ('563aa4f6-1447-43f9-b417-fff0dcca119f', 'Oakland Cemetery Hill', 33.7489, -84.3715, 'google-oauth2|900000000000000000103', now() - interval '45 days' + interval '9 hours'),
  ('b54afb51-4c34-4a7e-a249-7139fc4f7029', 'Grant Park Farmers Market', 33.736, -84.37, 'google-oauth2|900000000000000000101', now() - interval '45 days' + interval '9 hours'),
  ('6da651ff-ae73-4d3e-b6d4-deb56be5f915', 'Sweet Auburn Curb Market', 33.7536, -84.3772, 'google-oauth2|900000000000000000102', now() - interval '45 days' + interval '9 hours'),
  ('873d214d-06f1-4772-acc1-32c83d70c13f', 'The Earl', 33.7405, -84.3493, 'google-oauth2|900000000000000000103', now() - interval '45 days' + interval '9 hours'),
  ('97429a45-dca1-4a47-8ce3-2d081eb79a40', 'Chrome Yellow Trading Co.', 33.7557, -84.3647, 'google-oauth2|900000000000000000101', now() - interval '45 days' + interval '9 hours'),
  ('92dd9f04-3061-4d20-ab11-930d50c7c29e', 'Argosy', 33.7405, -84.3463, 'google-oauth2|900000000000000000102', now() - interval '45 days' + interval '9 hours'),
  ('8a5471ea-eb57-4817-a54b-223e0784fc2c', 'Freedom Park Trail Bench', 33.764, -84.348, 'google-oauth2|900000000000000000103', now() - interval '45 days' + interval '9 hours');

insert into entries (place_id, user_id, caption, story, tags, postcard_text, photo_urls, created_at) values
  ('86ac5c90-84b1-4591-ac0e-0422a60725a4', 'google-oauth2|900000000000000000101', 'The corner table where the afternoon went missing.', 'We ducked in out of the heat and stayed three hours. The barista remembered our order from last time.', array['coffee','slow morning','corner table']::text[], 'Found your kind of place - tiny, loud, great cortado.', array['https://picsum.photos/seed/hodgepodge-oauth2|9000000000000000001010/900/1200']::text[], now() - interval '42 days' + interval '18 hours'),
  ('86ac5c90-84b1-4591-ac0e-0422a60725a4', 'google-oauth2|900000000000000000102', 'Second time this week, not sorry.', 'Maya was right about this one. I came back alone on a Tuesday just to sit in the back with a notebook.', array['coffee','notebook hours','eav']::text[], 'I have a usual order now. It happened fast.', array['https://picsum.photos/seed/hodgepodge-oauth2|9000000000000000001020/900/1200','https://picsum.photos/seed/hodgepodge-oauth2|9000000000000000001021/900/1200']::text[], now() - interval '35 days' + interval '18 hours'),
  ('86ac5c90-84b1-4591-ac0e-0422a60725a4', 'google-oauth2|900000000000000000103', 'Porch light on, laptop closed.', 'Got here before the rush and watched the whole street wake up. The cinnamon thing is not optional.', array['coffee','porch','early']::text[], 'Saving you the seat by the window on Sunday.', array['https://picsum.photos/seed/hodgepodge-oauth2|9000000000000000001030/900/1200','https://picsum.photos/seed/hodgepodge-oauth2|9000000000000000001031/900/1200','https://picsum.photos/seed/hodgepodge-oauth2|9000000000000000001032/900/1200']::text[], now() - interval '28 days' + interval '18 hours'),
  ('86ac5c90-84b1-4591-ac0e-0422a60725a4', 'google-oauth2|900000000000000000101', 'Still the best thirty minutes of my week.', 'Brought Ren this time. We argued about the best pastry and settled nothing.', array['coffee','ritual','friends']::text[], 'Our table is holding up. Come back soon.', array['https://picsum.photos/seed/hodgepodge-oauth2|9000000000000000001010/900/1200']::text[], now() - interval '14 days' + interval '18 hours'),
  ('86ac5c90-84b1-4591-ac0e-0422a60725a4', 'google-oauth2|900000000000000000102', 'Rain outside, condensation on the window.', 'The kind of place that is better when the weather is bad. Stayed until the mugs went cold.', array['coffee','rainy day','eav']::text[], 'It rained and this was exactly the right call.', array['https://picsum.photos/seed/hodgepodge-oauth2|9000000000000000001020/900/1200','https://picsum.photos/seed/hodgepodge-oauth2|9000000000000000001021/900/1200']::text[], now() - interval '6 days' + interval '18 hours'),
  ('852c847d-ac31-4dfa-83ac-a0fd030306d8', 'google-oauth2|900000000000000000102', 'Elbow to elbow and worth it.', 'Ate standing up because every stool was taken. The tacos were the reason we skipped dinner plans.', array['market','tacos','crowded']::text[], 'Come hungry, there is nowhere to sit and it does not matter.', array['https://picsum.photos/seed/krog-oauth2|9000000000000000001020/900/1200','https://picsum.photos/seed/krog-oauth2|9000000000000000001021/900/1200','https://picsum.photos/seed/krog-oauth2|9000000000000000001022/900/1200']::text[], now() - interval '40 days' + interval '18 hours'),
  ('852c847d-ac31-4dfa-83ac-a0fd030306d8', 'google-oauth2|900000000000000000101', 'Found the quiet stall at the back.', 'Theo dragged me here on a Saturday and I finally get it. The bread counter at closing time is a scene.', array['market','bread','saturday']::text[], 'The back corner is the secret. Do not tell everyone.', array['https://picsum.photos/seed/krog-oauth2|9000000000000000001010/900/1200']::text[], now() - interval '25 days' + interval '18 hours'),
  ('852c847d-ac31-4dfa-83ac-a0fd030306d8', 'google-oauth2|900000000000000000103', 'Dumplings, then the tunnel.', 'Walked here off the Beltline and ended up staying for a second round. Good light around six.', array['market','dumplings','beltline']::text[], 'Met the others here. Easiest plan we have ever made.', array['https://picsum.photos/seed/krog-oauth2|9000000000000000001030/900/1200','https://picsum.photos/seed/krog-oauth2|9000000000000000001031/900/1200']::text[], now() - interval '9 days' + interval '18 hours'),
  ('4e35fae8-8258-442d-a13c-072c7a468099', 'google-oauth2|900000000000000000103', 'Up on the roof with the whole skyline.', 'Paid for the mini golf and then just stood at the railing instead. Worth the elevator wait.', array['rooftop','skyline','sunset']::text[], 'The city looks unreasonably good from up here at seven.', array['https://picsum.photos/seed/poncecity-oauth2|9000000000000000001030/900/1200','https://picsum.photos/seed/poncecity-oauth2|9000000000000000001031/900/1200','https://picsum.photos/seed/poncecity-oauth2|9000000000000000001032/900/1200']::text[], now() - interval '38 days' + interval '18 hours'),
  ('4e35fae8-8258-442d-a13c-072c7a468099', 'google-oauth2|900000000000000000101', 'Sunset round two.', 'Came back for the view and stayed for the terrible putting. Ren still won.', array['rooftop','sunset','minigolf']::text[], 'Second time up here and still not over it.', array['https://picsum.photos/seed/poncecity-oauth2|9000000000000000001010/900/1200']::text[], now() - interval '20 days' + interval '18 hours'),
  ('4f0962b0-841b-4372-8849-1e17972ba31b', 'google-oauth2|900000000000000000101', 'Blanket, bagels, no plans.', 'The oval fills up by noon so we got there at nine. Nobody checked a phone for two hours.', array['park','picnic','morning']::text[], 'Blanket weather. Bring the bagels next time.', array['https://picsum.photos/seed/piedmont-oauth2|9000000000000000001010/900/1200','https://picsum.photos/seed/piedmont-oauth2|9000000000000000001011/900/1200']::text[], now() - interval '36 days' + interval '18 hours'),
  ('4f0962b0-841b-4372-8849-1e17972ba31b', 'google-oauth2|900000000000000000102', 'Ran the loop, regretted the loop.', 'Did three laps and then collapsed on the hill with everyone else. The skyline framing from here is perfect.', array['park','running','skyline']::text[], 'The hill at the north end is the best seat in the city.', array['https://picsum.photos/seed/piedmont-oauth2|9000000000000000001020/900/1200','https://picsum.photos/seed/piedmont-oauth2|9000000000000000001021/900/1200','https://picsum.photos/seed/piedmont-oauth2|9000000000000000001022/900/1200']::text[], now() - interval '18 days' + interval '18 hours'),
  ('4f0962b0-841b-4372-8849-1e17972ba31b', 'google-oauth2|900000000000000000103', 'Dog watching as a sport.', 'Sat on the same bench for an hour. Counted eleven corgis, which is a personal record.', array['park','bench','dogs']::text[], 'Eleven corgis. I am not exaggerating.', array['https://picsum.photos/seed/piedmont-oauth2|9000000000000000001030/900/1200']::text[], now() - interval '4 days' + interval '18 hours'),
  ('76bfb844-9c4f-4f43-971a-554f44a470cc', 'google-oauth2|900000000000000000102', 'The wall changed again.', 'Every month there is something new here. Took the same photo as last time to compare.', array['mural','beltline','walk']::text[], 'The mural is different again. Come see before it goes.', array['https://picsum.photos/seed/beltline-oauth2|9000000000000000001020/900/1200','https://picsum.photos/seed/beltline-oauth2|9000000000000000001021/900/1200']::text[], now() - interval '33 days' + interval '18 hours'),
  ('76bfb844-9c4f-4f43-971a-554f44a470cc', 'google-oauth2|900000000000000000103', 'Golden hour on the trail.', 'Walked from Krog to Ponce and barely noticed the distance. The buskers near the bridge were good.', array['beltline','golden hour','walk']::text[], 'Walked the whole thing. Do it at six, not noon.', array['https://picsum.photos/seed/beltline-oauth2|9000000000000000001030/900/1200','https://picsum.photos/seed/beltline-oauth2|9000000000000000001031/900/1200','https://picsum.photos/seed/beltline-oauth2|9000000000000000001032/900/1200']::text[], now() - interval '16 days' + interval '18 hours'),
  ('76bfb844-9c4f-4f43-971a-554f44a470cc', 'google-oauth2|900000000000000000101', 'Same wall, new paint.', 'Third time standing in front of this. It is becoming a thing we do.', array['mural','ritual','beltline']::text[], 'Our wall got repainted. Still ours.', array['https://picsum.photos/seed/beltline-oauth2|9000000000000000001010/900/1200']::text[], now() - interval '3 days' + interval '18 hours'),
  ('b59dd40b-c058-491b-8047-ee685a67f3f7', 'google-oauth2|900000000000000000103', 'Open late, loud, perfect.', 'Showed up after midnight with no expectations and left fully converted. Sat at the end of the bar.', array['late night','bar','seafood']::text[], 'Nothing good happens before midnight here.', array['https://picsum.photos/seed/octopus-oauth2|9000000000000000001030/900/1200','https://picsum.photos/seed/octopus-oauth2|9000000000000000001031/900/1200']::text[], now() - interval '30 days' + interval '18 hours'),
  ('b59dd40b-c058-491b-8047-ee685a67f3f7', 'google-oauth2|900000000000000000102', 'Back at the end of the bar.', 'Same seat as last time. The kitchen was still going at one in the morning.', array['late night','bar','regular']::text[], 'Same stool, same order. I am consistent.', array['https://picsum.photos/seed/octopus-oauth2|9000000000000000001020/900/1200','https://picsum.photos/seed/octopus-oauth2|9000000000000000001021/900/1200','https://picsum.photos/seed/octopus-oauth2|9000000000000000001022/900/1200']::text[], now() - interval '11 days' + interval '18 hours'),
  ('c3fcbc1e-6105-43d8-80e9-89519674a3f8', 'google-oauth2|900000000000000000101', 'Cheap coffee, good noise.', 'No wifi password on the wall, which I think is on purpose. Read forty pages.', array['coffee','reading','eav']::text[], 'Zero wifi and that is the point.', array['https://picsum.photos/seed/javalords-oauth2|9000000000000000001010/900/1200']::text[], now() - interval '27 days' + interval '18 hours'),
  ('c3fcbc1e-6105-43d8-80e9-89519674a3f8', 'google-oauth2|900000000000000000101', 'Forty more pages.', 'Finished the book in the window seat. Ordered a second cup to justify the chair.', array['coffee','reading','window seat']::text[], 'Finished the book here. Needed somewhere good for it.', array['https://picsum.photos/seed/javalords-oauth2|9000000000000000001010/900/1200','https://picsum.photos/seed/javalords-oauth2|9000000000000000001011/900/1200']::text[], now() - interval '13 days' + interval '18 hours'),
  ('b1339e03-5c8e-4f23-afb7-2f85e9f7252f', 'google-oauth2|900000000000000000102', 'Under the marquee in the rain.', 'Did not even have tickets. Just stood across the street while the lights came on.', array['marquee','night','midtown']::text[], 'Stood under the lights with no tickets. Still a night out.', array['https://picsum.photos/seed/fox-oauth2|9000000000000000001020/900/1200','https://picsum.photos/seed/fox-oauth2|9000000000000000001021/900/1200','https://picsum.photos/seed/fox-oauth2|9000000000000000001022/900/1200']::text[], now() - interval '31 days' + interval '18 hours'),
  ('b1339e03-5c8e-4f23-afb7-2f85e9f7252f', 'google-oauth2|900000000000000000103', 'Lights on at eight.', 'Caught the marquee switching on. Everybody on the sidewalk stopped at the same moment.', array['marquee','lights','midtown']::text[], 'Be on Peachtree at eight. Trust me.', array['https://picsum.photos/seed/fox-oauth2|9000000000000000001030/900/1200']::text[], now() - interval '7 days' + interval '18 hours'),
  ('563aa4f6-1447-43f9-b417-fff0dcca119f', 'google-oauth2|900000000000000000103', 'Quietest hill in the city.', 'Walked the paths for an hour without talking much. The magnolias at the top are enormous.', array['quiet','walk','history']::text[], 'The quietest place downtown, somehow.', array['https://picsum.photos/seed/oakland-oauth2|9000000000000000001030/900/1200','https://picsum.photos/seed/oakland-oauth2|9000000000000000001031/900/1200']::text[], now() - interval '34 days' + interval '18 hours'),
  ('563aa4f6-1447-43f9-b417-fff0dcca119f', 'google-oauth2|900000000000000000101', 'Back for the quiet.', 'Needed an hour away from everything and knew exactly where to go. Same bench near the top.', array['quiet','bench','ritual']::text[], 'Went back for the quiet. It was still there.', array['https://picsum.photos/seed/oakland-oauth2|9000000000000000001010/900/1200','https://picsum.photos/seed/oakland-oauth2|9000000000000000001011/900/1200','https://picsum.photos/seed/oakland-oauth2|9000000000000000001012/900/1200']::text[], now() - interval '10 days' + interval '18 hours'),
  ('b54afb51-4c34-4a7e-a249-7139fc4f7029', 'google-oauth2|900000000000000000101', 'Peaches and a terrible impulse buy.', 'Sunday market, got there late and still found good peaches. Also bought a plant I cannot keep alive.', array['market','sunday','peaches']::text[], 'Peaches, a plant, zero regrets about one of those.', array['https://picsum.photos/seed/grantpark-oauth2|9000000000000000001010/900/1200']::text[], now() - interval '29 days' + interval '18 hours'),
  ('b54afb51-4c34-4a7e-a249-7139fc4f7029', 'google-oauth2|900000000000000000102', 'Sunday as a routine.', 'Third Sunday in a row. The tamale stand knows me now, which is the entire point of a neighborhood.', array['market','sunday','routine']::text[], 'Sundays are spoken for now. Join us.', array['https://picsum.photos/seed/grantpark-oauth2|9000000000000000001020/900/1200','https://picsum.photos/seed/grantpark-oauth2|9000000000000000001021/900/1200']::text[], now() - interval '8 days' + interval '18 hours'),
  ('6da651ff-ae73-4d3e-b6d4-deb56be5f915', 'google-oauth2|900000000000000000102', 'Lunch counter, no menu needed.', 'Ate at the counter and talked to the guy next to me for twenty minutes. Old building, great light.', array['lunch','counter','downtown']::text[], 'Sit at the counter. Talk to whoever is there.', array['https://picsum.photos/seed/sweetauburn-oauth2|9000000000000000001020/900/1200','https://picsum.photos/seed/sweetauburn-oauth2|9000000000000000001021/900/1200','https://picsum.photos/seed/sweetauburn-oauth2|9000000000000000001022/900/1200']::text[], now() - interval '26 days' + interval '18 hours'),
  ('873d214d-06f1-4772-acc1-32c83d70c13f', 'google-oauth2|900000000000000000103', 'Ears still ringing.', 'Stood too close to the stage on purpose. The burger after was non negotiable.', array['music','loud','eav']::text[], 'Great show. Cannot hear you, sorry.', array['https://picsum.photos/seed/theearl-oauth2|9000000000000000001030/900/1200']::text[], now() - interval '22 days' + interval '18 hours'),
  ('97429a45-dca1-4a47-8ce3-2d081eb79a40', 'google-oauth2|900000000000000000101', 'Coffee next to the clothes rack.', 'Half shop, half cafe, entirely my aesthetic. Bought nothing, stayed an hour.', array['coffee','shop','inman park']::text[], 'A cafe inside a clothing store. It works.', array['https://picsum.photos/seed/chromeyellow-oauth2|9000000000000000001010/900/1200','https://picsum.photos/seed/chromeyellow-oauth2|9000000000000000001011/900/1200']::text[], now() - interval '19 days' + interval '18 hours'),
  ('92dd9f04-3061-4d20-ab11-930d50c7c29e', 'google-oauth2|900000000000000000102', 'Long table, longer night.', 'Pizza and the big table in the back. Ren showed up two hours late and we were still there.', array['pizza','bar','long table']::text[], 'The back table holds eight. We will need it.', array['https://picsum.photos/seed/argosy-oauth2|9000000000000000001020/900/1200','https://picsum.photos/seed/argosy-oauth2|9000000000000000001021/900/1200','https://picsum.photos/seed/argosy-oauth2|9000000000000000001022/900/1200']::text[], now() - interval '15 days' + interval '18 hours'),
  ('8a5471ea-eb57-4817-a54b-223e0784fc2c', 'google-oauth2|900000000000000000103', 'One bench, whole sky.', 'Biked out here with nothing to do. Stayed until the mosquitoes won.', array['bench','bike','evening']::text[], 'Found a bench with a view of nothing in particular. Perfect.', array['https://picsum.photos/seed/freedompark-oauth2|9000000000000000001030/900/1200']::text[], now() - interval '5 days' + interval '18 hours');

-- Every entry is a visit...
insert into visits (user_id, place_id, visited_at)
select user_id, place_id, created_at from entries
where user_id in ('google-oauth2|900000000000000000101', 'google-oauth2|900000000000000000102', 'google-oauth2|900000000000000000103')
on conflict do nothing;

-- ...plus the return trips nobody wrote an entry for. Hodgepodge Coffee is
-- the runaway winner: all three friends, 20+ separate days.
insert into visits (user_id, place_id, visited_at) values
  ('google-oauth2|900000000000000000101', '86ac5c90-84b1-4591-ac0e-0422a60725a4', now() - interval '41 days' + interval '13 hours'),
  ('google-oauth2|900000000000000000101', '86ac5c90-84b1-4591-ac0e-0422a60725a4', now() - interval '39 days' + interval '13 hours'),
  ('google-oauth2|900000000000000000101', '86ac5c90-84b1-4591-ac0e-0422a60725a4', now() - interval '37 days' + interval '13 hours'),
  ('google-oauth2|900000000000000000101', '86ac5c90-84b1-4591-ac0e-0422a60725a4', now() - interval '30 days' + interval '13 hours'),
  ('google-oauth2|900000000000000000101', '86ac5c90-84b1-4591-ac0e-0422a60725a4', now() - interval '23 days' + interval '13 hours'),
  ('google-oauth2|900000000000000000101', '86ac5c90-84b1-4591-ac0e-0422a60725a4', now() - interval '17 days' + interval '13 hours'),
  ('google-oauth2|900000000000000000101', '86ac5c90-84b1-4591-ac0e-0422a60725a4', now() - interval '12 days' + interval '13 hours'),
  ('google-oauth2|900000000000000000101', '86ac5c90-84b1-4591-ac0e-0422a60725a4', now() - interval '5 days' + interval '13 hours'),
  ('google-oauth2|900000000000000000101', '86ac5c90-84b1-4591-ac0e-0422a60725a4', now() - interval '2 days' + interval '13 hours'),
  ('google-oauth2|900000000000000000102', '86ac5c90-84b1-4591-ac0e-0422a60725a4', now() - interval '34 days' + interval '13 hours'),
  ('google-oauth2|900000000000000000102', '86ac5c90-84b1-4591-ac0e-0422a60725a4', now() - interval '29 days' + interval '13 hours'),
  ('google-oauth2|900000000000000000102', '86ac5c90-84b1-4591-ac0e-0422a60725a4', now() - interval '21 days' + interval '13 hours'),
  ('google-oauth2|900000000000000000102', '86ac5c90-84b1-4591-ac0e-0422a60725a4', now() - interval '15 days' + interval '13 hours'),
  ('google-oauth2|900000000000000000102', '86ac5c90-84b1-4591-ac0e-0422a60725a4', now() - interval '10 days' + interval '13 hours'),
  ('google-oauth2|900000000000000000102', '86ac5c90-84b1-4591-ac0e-0422a60725a4', now() - interval '4 days' + interval '13 hours'),
  ('google-oauth2|900000000000000000102', '86ac5c90-84b1-4591-ac0e-0422a60725a4', now() - interval '1 days' + interval '13 hours'),
  ('google-oauth2|900000000000000000103', '86ac5c90-84b1-4591-ac0e-0422a60725a4', now() - interval '27 days' + interval '13 hours'),
  ('google-oauth2|900000000000000000103', '86ac5c90-84b1-4591-ac0e-0422a60725a4', now() - interval '24 days' + interval '13 hours'),
  ('google-oauth2|900000000000000000103', '86ac5c90-84b1-4591-ac0e-0422a60725a4', now() - interval '18 days' + interval '13 hours'),
  ('google-oauth2|900000000000000000103', '86ac5c90-84b1-4591-ac0e-0422a60725a4', now() - interval '9 days' + interval '13 hours'),
  ('google-oauth2|900000000000000000103', '86ac5c90-84b1-4591-ac0e-0422a60725a4', now() - interval '3 days' + interval '13 hours'),
  ('google-oauth2|900000000000000000101', 'c3fcbc1e-6105-43d8-80e9-89519674a3f8', now() - interval '26 days' + interval '13 hours'),
  ('google-oauth2|900000000000000000101', 'c3fcbc1e-6105-43d8-80e9-89519674a3f8', now() - interval '21 days' + interval '13 hours'),
  ('google-oauth2|900000000000000000101', 'c3fcbc1e-6105-43d8-80e9-89519674a3f8', now() - interval '12 days' + interval '13 hours'),
  ('google-oauth2|900000000000000000101', 'c3fcbc1e-6105-43d8-80e9-89519674a3f8', now() - interval '6 days' + interval '13 hours'),
  ('google-oauth2|900000000000000000101', '4f0962b0-841b-4372-8849-1e17972ba31b', now() - interval '35 days' + interval '13 hours'),
  ('google-oauth2|900000000000000000101', '4f0962b0-841b-4372-8849-1e17972ba31b', now() - interval '24 days' + interval '13 hours'),
  ('google-oauth2|900000000000000000101', '4f0962b0-841b-4372-8849-1e17972ba31b', now() - interval '11 days' + interval '13 hours'),
  ('google-oauth2|900000000000000000102', '4f0962b0-841b-4372-8849-1e17972ba31b', now() - interval '17 days' + interval '13 hours'),
  ('google-oauth2|900000000000000000102', '4f0962b0-841b-4372-8849-1e17972ba31b', now() - interval '8 days' + interval '13 hours'),
  ('google-oauth2|900000000000000000103', '4f0962b0-841b-4372-8849-1e17972ba31b', now() - interval '3 days' + interval '13 hours'),
  ('google-oauth2|900000000000000000101', 'b54afb51-4c34-4a7e-a249-7139fc4f7029', now() - interval '28 days' + interval '13 hours'),
  ('google-oauth2|900000000000000000101', 'b54afb51-4c34-4a7e-a249-7139fc4f7029', now() - interval '15 days' + interval '13 hours'),
  ('google-oauth2|900000000000000000102', 'b54afb51-4c34-4a7e-a249-7139fc4f7029', now() - interval '22 days' + interval '13 hours'),
  ('google-oauth2|900000000000000000102', 'b54afb51-4c34-4a7e-a249-7139fc4f7029', now() - interval '15 days' + interval '13 hours'),
  ('google-oauth2|900000000000000000102', 'b54afb51-4c34-4a7e-a249-7139fc4f7029', now() - interval '1 days' + interval '13 hours'),
  ('google-oauth2|900000000000000000102', '76bfb844-9c4f-4f43-971a-554f44a470cc', now() - interval '32 days' + interval '13 hours'),
  ('google-oauth2|900000000000000000102', '76bfb844-9c4f-4f43-971a-554f44a470cc', now() - interval '19 days' + interval '13 hours'),
  ('google-oauth2|900000000000000000102', '76bfb844-9c4f-4f43-971a-554f44a470cc', now() - interval '2 days' + interval '13 hours'),
  ('google-oauth2|900000000000000000103', '76bfb844-9c4f-4f43-971a-554f44a470cc', now() - interval '15 days' + interval '13 hours'),
  ('google-oauth2|900000000000000000102', '852c847d-ac31-4dfa-83ac-a0fd030306d8', now() - interval '39 days' + interval '13 hours'),
  ('google-oauth2|900000000000000000102', '852c847d-ac31-4dfa-83ac-a0fd030306d8', now() - interval '20 days' + interval '13 hours'),
  ('google-oauth2|900000000000000000103', 'b59dd40b-c058-491b-8047-ee685a67f3f7', now() - interval '29 days' + interval '13 hours'),
  ('google-oauth2|900000000000000000102', 'b59dd40b-c058-491b-8047-ee685a67f3f7', now() - interval '10 days' + interval '13 hours'),
  ('google-oauth2|900000000000000000101', '563aa4f6-1447-43f9-b417-fff0dcca119f', now() - interval '9 days' + interval '13 hours'),
  ('google-oauth2|900000000000000000103', '4e35fae8-8258-442d-a13c-072c7a468099', now() - interval '37 days' + interval '13 hours')
on conflict do nothing;

-- Fixed share codes so a real Auth0 login can join the demo friend group
-- by typing one of these on the Share screen. The same thing happens in one
-- tap via POST /api/demo/befriend ("Join the demo map" on the Share screen).
insert into invites (code, created_by) values
  ('MAYA01', 'google-oauth2|900000000000000000101'),
  ('THEO01', 'google-oauth2|900000000000000000102'),
  ('REN001', 'google-oauth2|900000000000000000103')
on conflict (code) do nothing;

commit;

-- Materialize the new visits into the continuous aggregate.
call refresh_continuous_aggregate('daily_place_visits', null, null);
