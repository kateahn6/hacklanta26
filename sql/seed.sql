-- Unfold demo seed: one city (Atlanta), three friends, repeat visits.
-- Run after schema.sql:  psql "$DATABASE_URL" -f sql/seed.sql
-- Re-running is safe: it deletes the demo users' data first.
--
-- Seeded photos are remote placeholder URLs. Photos added from the app are
-- base64 JPEG data URLs; the app renders either.

begin;

delete from users where id in ('auth0|demo-maya', 'auth0|demo-theo', 'auth0|demo-ren');

insert into users (id, name, email, avatar_url) values
  ('auth0|demo-maya', 'Maya Okonkwo', 'maya@unfold.demo', 'https://i.pravatar.cc/200?img=47'),
  ('auth0|demo-theo', 'Theo Alvarez', 'theo@unfold.demo', 'https://i.pravatar.cc/200?img=12'),
  ('auth0|demo-ren', 'Ren Fujita', 'ren@unfold.demo', 'https://i.pravatar.cc/200?img=33');

-- Friendships are symmetric: both directions are stored.
insert into friendships (user_id, friend_id) values
  ('auth0|demo-maya', 'auth0|demo-theo'),
  ('auth0|demo-theo', 'auth0|demo-maya'),
  ('auth0|demo-maya', 'auth0|demo-ren'),
  ('auth0|demo-ren', 'auth0|demo-maya'),
  ('auth0|demo-theo', 'auth0|demo-ren'),
  ('auth0|demo-ren', 'auth0|demo-theo')
on conflict do nothing;

insert into places (id, name, lat, lng, created_by, created_at) values
  ('a9b64e05-739f-478b-8983-c7adfa8701e2', 'Hodgepodge Coffee', 33.7404, -84.3486, 'auth0|demo-maya', now() - interval '45 days' + interval '9 hours'),
  ('091f3142-6fd8-4d51-b5b3-9b15984761fc', 'Krog Street Market', 33.7544, -84.363, 'auth0|demo-theo', now() - interval '45 days' + interval '9 hours'),
  ('20bb3f09-1717-4b1d-a09e-16a7366b4010', 'Ponce City Market Roof', 33.7726, -84.3657, 'auth0|demo-ren', now() - interval '45 days' + interval '9 hours'),
  ('36ff1fe5-b11e-4c19-aaa6-ea4ab968ca34', 'Piedmont Park Active Oval', 33.7857, -84.3733, 'auth0|demo-maya', now() - interval '45 days' + interval '9 hours'),
  ('b21c78a5-1c35-4f32-ae5c-1f86010547f0', 'Eastside Beltline Mural Wall', 33.77, -84.365, 'auth0|demo-theo', now() - interval '45 days' + interval '9 hours'),
  ('bdfea07e-e488-4d34-8ff7-5c8a6c17c052', 'Octopus Bar', 33.7417, -84.3414, 'auth0|demo-ren', now() - interval '45 days' + interval '9 hours'),
  ('fa1b863c-0c22-48e0-adbd-8e07fc6b8aad', 'Java Lords', 33.7399, -84.3474, 'auth0|demo-maya', now() - interval '45 days' + interval '9 hours'),
  ('55416521-209e-4011-88d9-1f4d9f6ec089', 'Fox Theatre Marquee', 33.7726, -84.3857, 'auth0|demo-theo', now() - interval '45 days' + interval '9 hours'),
  ('7249c08a-9d87-43ad-97c2-bf23a72f14f1', 'Oakland Cemetery Hill', 33.7489, -84.3715, 'auth0|demo-ren', now() - interval '45 days' + interval '9 hours'),
  ('81d31367-efdd-452d-9b82-821d7249daf5', 'Grant Park Farmers Market', 33.736, -84.37, 'auth0|demo-maya', now() - interval '45 days' + interval '9 hours'),
  ('a5e7adc3-c0a8-4cf8-8fac-220b48dce02b', 'Sweet Auburn Curb Market', 33.7536, -84.3772, 'auth0|demo-theo', now() - interval '45 days' + interval '9 hours'),
  ('703c57d6-c3b9-4fa0-aa9b-a2aa02e5bb82', 'The Earl', 33.7405, -84.3493, 'auth0|demo-ren', now() - interval '45 days' + interval '9 hours'),
  ('05334edf-f0ff-4735-aab9-562d6644002f', 'Chrome Yellow Trading Co.', 33.7557, -84.3647, 'auth0|demo-maya', now() - interval '45 days' + interval '9 hours'),
  ('ce01daf2-0c46-4e1a-8288-90049209bbe9', 'Argosy', 33.7405, -84.3463, 'auth0|demo-theo', now() - interval '45 days' + interval '9 hours'),
  ('d20fa5d1-4027-4d6f-80ed-10ae1a09157b', 'Freedom Park Trail Bench', 33.764, -84.348, 'auth0|demo-ren', now() - interval '45 days' + interval '9 hours');

insert into entries (place_id, user_id, caption, story, tags, postcard_text, photo_urls, created_at) values
  ('a9b64e05-739f-478b-8983-c7adfa8701e2', 'auth0|demo-maya', 'The corner table where the afternoon went missing.', 'We ducked in out of the heat and stayed three hours. The barista remembered our order from last time.', array['coffee','slow morning','corner table']::text[], 'Found your kind of place - tiny, loud, great cortado.', array['https://picsum.photos/seed/hodgepodge-maya0/900/1200']::text[], now() - interval '42 days' + interval '18 hours'),
  ('a9b64e05-739f-478b-8983-c7adfa8701e2', 'auth0|demo-theo', 'Second time this week, not sorry.', 'Maya was right about this one. I came back alone on a Tuesday just to sit in the back with a notebook.', array['coffee','notebook hours','eav']::text[], 'I have a usual order now. It happened fast.', array['https://picsum.photos/seed/hodgepodge-theo0/900/1200','https://picsum.photos/seed/hodgepodge-theo1/900/1200']::text[], now() - interval '35 days' + interval '18 hours'),
  ('a9b64e05-739f-478b-8983-c7adfa8701e2', 'auth0|demo-ren', 'Porch light on, laptop closed.', 'Got here before the rush and watched the whole street wake up. The cinnamon thing is not optional.', array['coffee','porch','early']::text[], 'Saving you the seat by the window on Sunday.', array['https://picsum.photos/seed/hodgepodge-ren0/900/1200','https://picsum.photos/seed/hodgepodge-ren1/900/1200','https://picsum.photos/seed/hodgepodge-ren2/900/1200']::text[], now() - interval '28 days' + interval '18 hours'),
  ('a9b64e05-739f-478b-8983-c7adfa8701e2', 'auth0|demo-maya', 'Still the best thirty minutes of my week.', 'Brought Ren this time. We argued about the best pastry and settled nothing.', array['coffee','ritual','friends']::text[], 'Our table is holding up. Come back soon.', array['https://picsum.photos/seed/hodgepodge-maya0/900/1200']::text[], now() - interval '14 days' + interval '18 hours'),
  ('a9b64e05-739f-478b-8983-c7adfa8701e2', 'auth0|demo-theo', 'Rain outside, condensation on the window.', 'The kind of place that is better when the weather is bad. Stayed until the mugs went cold.', array['coffee','rainy day','eav']::text[], 'It rained and this was exactly the right call.', array['https://picsum.photos/seed/hodgepodge-theo0/900/1200','https://picsum.photos/seed/hodgepodge-theo1/900/1200']::text[], now() - interval '6 days' + interval '18 hours'),
  ('091f3142-6fd8-4d51-b5b3-9b15984761fc', 'auth0|demo-theo', 'Elbow to elbow and worth it.', 'Ate standing up because every stool was taken. The tacos were the reason we skipped dinner plans.', array['market','tacos','crowded']::text[], 'Come hungry, there is nowhere to sit and it does not matter.', array['https://picsum.photos/seed/krog-theo0/900/1200','https://picsum.photos/seed/krog-theo1/900/1200','https://picsum.photos/seed/krog-theo2/900/1200']::text[], now() - interval '40 days' + interval '18 hours'),
  ('091f3142-6fd8-4d51-b5b3-9b15984761fc', 'auth0|demo-maya', 'Found the quiet stall at the back.', 'Theo dragged me here on a Saturday and I finally get it. The bread counter at closing time is a scene.', array['market','bread','saturday']::text[], 'The back corner is the secret. Do not tell everyone.', array['https://picsum.photos/seed/krog-maya0/900/1200']::text[], now() - interval '25 days' + interval '18 hours'),
  ('091f3142-6fd8-4d51-b5b3-9b15984761fc', 'auth0|demo-ren', 'Dumplings, then the tunnel.', 'Walked here off the Beltline and ended up staying for a second round. Good light around six.', array['market','dumplings','beltline']::text[], 'Met the others here. Easiest plan we have ever made.', array['https://picsum.photos/seed/krog-ren0/900/1200','https://picsum.photos/seed/krog-ren1/900/1200']::text[], now() - interval '9 days' + interval '18 hours'),
  ('20bb3f09-1717-4b1d-a09e-16a7366b4010', 'auth0|demo-ren', 'Up on the roof with the whole skyline.', 'Paid for the mini golf and then just stood at the railing instead. Worth the elevator wait.', array['rooftop','skyline','sunset']::text[], 'The city looks unreasonably good from up here at seven.', array['https://picsum.photos/seed/poncecity-ren0/900/1200','https://picsum.photos/seed/poncecity-ren1/900/1200','https://picsum.photos/seed/poncecity-ren2/900/1200']::text[], now() - interval '38 days' + interval '18 hours'),
  ('20bb3f09-1717-4b1d-a09e-16a7366b4010', 'auth0|demo-maya', 'Sunset round two.', 'Came back for the view and stayed for the terrible putting. Ren still won.', array['rooftop','sunset','minigolf']::text[], 'Second time up here and still not over it.', array['https://picsum.photos/seed/poncecity-maya0/900/1200']::text[], now() - interval '20 days' + interval '18 hours'),
  ('36ff1fe5-b11e-4c19-aaa6-ea4ab968ca34', 'auth0|demo-maya', 'Blanket, bagels, no plans.', 'The oval fills up by noon so we got there at nine. Nobody checked a phone for two hours.', array['park','picnic','morning']::text[], 'Blanket weather. Bring the bagels next time.', array['https://picsum.photos/seed/piedmont-maya0/900/1200','https://picsum.photos/seed/piedmont-maya1/900/1200']::text[], now() - interval '36 days' + interval '18 hours'),
  ('36ff1fe5-b11e-4c19-aaa6-ea4ab968ca34', 'auth0|demo-theo', 'Ran the loop, regretted the loop.', 'Did three laps and then collapsed on the hill with everyone else. The skyline framing from here is perfect.', array['park','running','skyline']::text[], 'The hill at the north end is the best seat in the city.', array['https://picsum.photos/seed/piedmont-theo0/900/1200','https://picsum.photos/seed/piedmont-theo1/900/1200','https://picsum.photos/seed/piedmont-theo2/900/1200']::text[], now() - interval '18 days' + interval '18 hours'),
  ('36ff1fe5-b11e-4c19-aaa6-ea4ab968ca34', 'auth0|demo-ren', 'Dog watching as a sport.', 'Sat on the same bench for an hour. Counted eleven corgis, which is a personal record.', array['park','bench','dogs']::text[], 'Eleven corgis. I am not exaggerating.', array['https://picsum.photos/seed/piedmont-ren0/900/1200']::text[], now() - interval '4 days' + interval '18 hours'),
  ('b21c78a5-1c35-4f32-ae5c-1f86010547f0', 'auth0|demo-theo', 'The wall changed again.', 'Every month there is something new here. Took the same photo as last time to compare.', array['mural','beltline','walk']::text[], 'The mural is different again. Come see before it goes.', array['https://picsum.photos/seed/beltline-theo0/900/1200','https://picsum.photos/seed/beltline-theo1/900/1200']::text[], now() - interval '33 days' + interval '18 hours'),
  ('b21c78a5-1c35-4f32-ae5c-1f86010547f0', 'auth0|demo-ren', 'Golden hour on the trail.', 'Walked from Krog to Ponce and barely noticed the distance. The buskers near the bridge were good.', array['beltline','golden hour','walk']::text[], 'Walked the whole thing. Do it at six, not noon.', array['https://picsum.photos/seed/beltline-ren0/900/1200','https://picsum.photos/seed/beltline-ren1/900/1200','https://picsum.photos/seed/beltline-ren2/900/1200']::text[], now() - interval '16 days' + interval '18 hours'),
  ('b21c78a5-1c35-4f32-ae5c-1f86010547f0', 'auth0|demo-maya', 'Same wall, new paint.', 'Third time standing in front of this. It is becoming a thing we do.', array['mural','ritual','beltline']::text[], 'Our wall got repainted. Still ours.', array['https://picsum.photos/seed/beltline-maya0/900/1200']::text[], now() - interval '3 days' + interval '18 hours'),
  ('bdfea07e-e488-4d34-8ff7-5c8a6c17c052', 'auth0|demo-ren', 'Open late, loud, perfect.', 'Showed up after midnight with no expectations and left fully converted. Sat at the end of the bar.', array['late night','bar','seafood']::text[], 'Nothing good happens before midnight here.', array['https://picsum.photos/seed/octopus-ren0/900/1200','https://picsum.photos/seed/octopus-ren1/900/1200']::text[], now() - interval '30 days' + interval '18 hours'),
  ('bdfea07e-e488-4d34-8ff7-5c8a6c17c052', 'auth0|demo-theo', 'Back at the end of the bar.', 'Same seat as last time. The kitchen was still going at one in the morning.', array['late night','bar','regular']::text[], 'Same stool, same order. I am consistent.', array['https://picsum.photos/seed/octopus-theo0/900/1200','https://picsum.photos/seed/octopus-theo1/900/1200','https://picsum.photos/seed/octopus-theo2/900/1200']::text[], now() - interval '11 days' + interval '18 hours'),
  ('fa1b863c-0c22-48e0-adbd-8e07fc6b8aad', 'auth0|demo-maya', 'Cheap coffee, good noise.', 'No wifi password on the wall, which I think is on purpose. Read forty pages.', array['coffee','reading','eav']::text[], 'Zero wifi and that is the point.', array['https://picsum.photos/seed/javalords-maya0/900/1200']::text[], now() - interval '27 days' + interval '18 hours'),
  ('fa1b863c-0c22-48e0-adbd-8e07fc6b8aad', 'auth0|demo-maya', 'Forty more pages.', 'Finished the book in the window seat. Ordered a second cup to justify the chair.', array['coffee','reading','window seat']::text[], 'Finished the book here. Needed somewhere good for it.', array['https://picsum.photos/seed/javalords-maya0/900/1200','https://picsum.photos/seed/javalords-maya1/900/1200']::text[], now() - interval '13 days' + interval '18 hours'),
  ('55416521-209e-4011-88d9-1f4d9f6ec089', 'auth0|demo-theo', 'Under the marquee in the rain.', 'Did not even have tickets. Just stood across the street while the lights came on.', array['marquee','night','midtown']::text[], 'Stood under the lights with no tickets. Still a night out.', array['https://picsum.photos/seed/fox-theo0/900/1200','https://picsum.photos/seed/fox-theo1/900/1200','https://picsum.photos/seed/fox-theo2/900/1200']::text[], now() - interval '31 days' + interval '18 hours'),
  ('55416521-209e-4011-88d9-1f4d9f6ec089', 'auth0|demo-ren', 'Lights on at eight.', 'Caught the marquee switching on. Everybody on the sidewalk stopped at the same moment.', array['marquee','lights','midtown']::text[], 'Be on Peachtree at eight. Trust me.', array['https://picsum.photos/seed/fox-ren0/900/1200']::text[], now() - interval '7 days' + interval '18 hours'),
  ('7249c08a-9d87-43ad-97c2-bf23a72f14f1', 'auth0|demo-ren', 'Quietest hill in the city.', 'Walked the paths for an hour without talking much. The magnolias at the top are enormous.', array['quiet','walk','history']::text[], 'The quietest place downtown, somehow.', array['https://picsum.photos/seed/oakland-ren0/900/1200','https://picsum.photos/seed/oakland-ren1/900/1200']::text[], now() - interval '34 days' + interval '18 hours'),
  ('7249c08a-9d87-43ad-97c2-bf23a72f14f1', 'auth0|demo-maya', 'Back for the quiet.', 'Needed an hour away from everything and knew exactly where to go. Same bench near the top.', array['quiet','bench','ritual']::text[], 'Went back for the quiet. It was still there.', array['https://picsum.photos/seed/oakland-maya0/900/1200','https://picsum.photos/seed/oakland-maya1/900/1200','https://picsum.photos/seed/oakland-maya2/900/1200']::text[], now() - interval '10 days' + interval '18 hours'),
  ('81d31367-efdd-452d-9b82-821d7249daf5', 'auth0|demo-maya', 'Peaches and a terrible impulse buy.', 'Sunday market, got there late and still found good peaches. Also bought a plant I cannot keep alive.', array['market','sunday','peaches']::text[], 'Peaches, a plant, zero regrets about one of those.', array['https://picsum.photos/seed/grantpark-maya0/900/1200']::text[], now() - interval '29 days' + interval '18 hours'),
  ('81d31367-efdd-452d-9b82-821d7249daf5', 'auth0|demo-theo', 'Sunday as a routine.', 'Third Sunday in a row. The tamale stand knows me now, which is the entire point of a neighborhood.', array['market','sunday','routine']::text[], 'Sundays are spoken for now. Join us.', array['https://picsum.photos/seed/grantpark-theo0/900/1200','https://picsum.photos/seed/grantpark-theo1/900/1200']::text[], now() - interval '8 days' + interval '18 hours'),
  ('a5e7adc3-c0a8-4cf8-8fac-220b48dce02b', 'auth0|demo-theo', 'Lunch counter, no menu needed.', 'Ate at the counter and talked to the guy next to me for twenty minutes. Old building, great light.', array['lunch','counter','downtown']::text[], 'Sit at the counter. Talk to whoever is there.', array['https://picsum.photos/seed/sweetauburn-theo0/900/1200','https://picsum.photos/seed/sweetauburn-theo1/900/1200','https://picsum.photos/seed/sweetauburn-theo2/900/1200']::text[], now() - interval '26 days' + interval '18 hours'),
  ('703c57d6-c3b9-4fa0-aa9b-a2aa02e5bb82', 'auth0|demo-ren', 'Ears still ringing.', 'Stood too close to the stage on purpose. The burger after was non negotiable.', array['music','loud','eav']::text[], 'Great show. Cannot hear you, sorry.', array['https://picsum.photos/seed/theearl-ren0/900/1200']::text[], now() - interval '22 days' + interval '18 hours'),
  ('05334edf-f0ff-4735-aab9-562d6644002f', 'auth0|demo-maya', 'Coffee next to the clothes rack.', 'Half shop, half cafe, entirely my aesthetic. Bought nothing, stayed an hour.', array['coffee','shop','inman park']::text[], 'A cafe inside a clothing store. It works.', array['https://picsum.photos/seed/chromeyellow-maya0/900/1200','https://picsum.photos/seed/chromeyellow-maya1/900/1200']::text[], now() - interval '19 days' + interval '18 hours'),
  ('ce01daf2-0c46-4e1a-8288-90049209bbe9', 'auth0|demo-theo', 'Long table, longer night.', 'Pizza and the big table in the back. Ren showed up two hours late and we were still there.', array['pizza','bar','long table']::text[], 'The back table holds eight. We will need it.', array['https://picsum.photos/seed/argosy-theo0/900/1200','https://picsum.photos/seed/argosy-theo1/900/1200','https://picsum.photos/seed/argosy-theo2/900/1200']::text[], now() - interval '15 days' + interval '18 hours'),
  ('d20fa5d1-4027-4d6f-80ed-10ae1a09157b', 'auth0|demo-ren', 'One bench, whole sky.', 'Biked out here with nothing to do. Stayed until the mosquitoes won.', array['bench','bike','evening']::text[], 'Found a bench with a view of nothing in particular. Perfect.', array['https://picsum.photos/seed/freedompark-ren0/900/1200']::text[], now() - interval '5 days' + interval '18 hours');

-- Every entry is a visit...
insert into visits (user_id, place_id, visited_at)
select user_id, place_id, created_at from entries
where user_id in ('auth0|demo-maya', 'auth0|demo-theo', 'auth0|demo-ren')
on conflict do nothing;

-- ...plus the return trips nobody wrote an entry for. Hodgepodge Coffee is
-- the runaway winner: all three friends, 20+ separate days.
insert into visits (user_id, place_id, visited_at) values
  ('auth0|demo-maya', 'a9b64e05-739f-478b-8983-c7adfa8701e2', now() - interval '41 days' + interval '13 hours'),
  ('auth0|demo-maya', 'a9b64e05-739f-478b-8983-c7adfa8701e2', now() - interval '39 days' + interval '13 hours'),
  ('auth0|demo-maya', 'a9b64e05-739f-478b-8983-c7adfa8701e2', now() - interval '37 days' + interval '13 hours'),
  ('auth0|demo-maya', 'a9b64e05-739f-478b-8983-c7adfa8701e2', now() - interval '30 days' + interval '13 hours'),
  ('auth0|demo-maya', 'a9b64e05-739f-478b-8983-c7adfa8701e2', now() - interval '23 days' + interval '13 hours'),
  ('auth0|demo-maya', 'a9b64e05-739f-478b-8983-c7adfa8701e2', now() - interval '17 days' + interval '13 hours'),
  ('auth0|demo-maya', 'a9b64e05-739f-478b-8983-c7adfa8701e2', now() - interval '12 days' + interval '13 hours'),
  ('auth0|demo-maya', 'a9b64e05-739f-478b-8983-c7adfa8701e2', now() - interval '5 days' + interval '13 hours'),
  ('auth0|demo-maya', 'a9b64e05-739f-478b-8983-c7adfa8701e2', now() - interval '2 days' + interval '13 hours'),
  ('auth0|demo-theo', 'a9b64e05-739f-478b-8983-c7adfa8701e2', now() - interval '34 days' + interval '13 hours'),
  ('auth0|demo-theo', 'a9b64e05-739f-478b-8983-c7adfa8701e2', now() - interval '29 days' + interval '13 hours'),
  ('auth0|demo-theo', 'a9b64e05-739f-478b-8983-c7adfa8701e2', now() - interval '21 days' + interval '13 hours'),
  ('auth0|demo-theo', 'a9b64e05-739f-478b-8983-c7adfa8701e2', now() - interval '15 days' + interval '13 hours'),
  ('auth0|demo-theo', 'a9b64e05-739f-478b-8983-c7adfa8701e2', now() - interval '10 days' + interval '13 hours'),
  ('auth0|demo-theo', 'a9b64e05-739f-478b-8983-c7adfa8701e2', now() - interval '4 days' + interval '13 hours'),
  ('auth0|demo-theo', 'a9b64e05-739f-478b-8983-c7adfa8701e2', now() - interval '1 days' + interval '13 hours'),
  ('auth0|demo-ren', 'a9b64e05-739f-478b-8983-c7adfa8701e2', now() - interval '27 days' + interval '13 hours'),
  ('auth0|demo-ren', 'a9b64e05-739f-478b-8983-c7adfa8701e2', now() - interval '24 days' + interval '13 hours'),
  ('auth0|demo-ren', 'a9b64e05-739f-478b-8983-c7adfa8701e2', now() - interval '18 days' + interval '13 hours'),
  ('auth0|demo-ren', 'a9b64e05-739f-478b-8983-c7adfa8701e2', now() - interval '9 days' + interval '13 hours'),
  ('auth0|demo-ren', 'a9b64e05-739f-478b-8983-c7adfa8701e2', now() - interval '3 days' + interval '13 hours'),
  ('auth0|demo-maya', 'fa1b863c-0c22-48e0-adbd-8e07fc6b8aad', now() - interval '26 days' + interval '13 hours'),
  ('auth0|demo-maya', 'fa1b863c-0c22-48e0-adbd-8e07fc6b8aad', now() - interval '21 days' + interval '13 hours'),
  ('auth0|demo-maya', 'fa1b863c-0c22-48e0-adbd-8e07fc6b8aad', now() - interval '12 days' + interval '13 hours'),
  ('auth0|demo-maya', 'fa1b863c-0c22-48e0-adbd-8e07fc6b8aad', now() - interval '6 days' + interval '13 hours'),
  ('auth0|demo-maya', '36ff1fe5-b11e-4c19-aaa6-ea4ab968ca34', now() - interval '35 days' + interval '13 hours'),
  ('auth0|demo-maya', '36ff1fe5-b11e-4c19-aaa6-ea4ab968ca34', now() - interval '24 days' + interval '13 hours'),
  ('auth0|demo-maya', '36ff1fe5-b11e-4c19-aaa6-ea4ab968ca34', now() - interval '11 days' + interval '13 hours'),
  ('auth0|demo-theo', '36ff1fe5-b11e-4c19-aaa6-ea4ab968ca34', now() - interval '17 days' + interval '13 hours'),
  ('auth0|demo-theo', '36ff1fe5-b11e-4c19-aaa6-ea4ab968ca34', now() - interval '8 days' + interval '13 hours'),
  ('auth0|demo-ren', '36ff1fe5-b11e-4c19-aaa6-ea4ab968ca34', now() - interval '3 days' + interval '13 hours'),
  ('auth0|demo-maya', '81d31367-efdd-452d-9b82-821d7249daf5', now() - interval '28 days' + interval '13 hours'),
  ('auth0|demo-maya', '81d31367-efdd-452d-9b82-821d7249daf5', now() - interval '15 days' + interval '13 hours'),
  ('auth0|demo-theo', '81d31367-efdd-452d-9b82-821d7249daf5', now() - interval '22 days' + interval '13 hours'),
  ('auth0|demo-theo', '81d31367-efdd-452d-9b82-821d7249daf5', now() - interval '15 days' + interval '13 hours'),
  ('auth0|demo-theo', '81d31367-efdd-452d-9b82-821d7249daf5', now() - interval '1 days' + interval '13 hours'),
  ('auth0|demo-theo', 'b21c78a5-1c35-4f32-ae5c-1f86010547f0', now() - interval '32 days' + interval '13 hours'),
  ('auth0|demo-theo', 'b21c78a5-1c35-4f32-ae5c-1f86010547f0', now() - interval '19 days' + interval '13 hours'),
  ('auth0|demo-theo', 'b21c78a5-1c35-4f32-ae5c-1f86010547f0', now() - interval '2 days' + interval '13 hours'),
  ('auth0|demo-ren', 'b21c78a5-1c35-4f32-ae5c-1f86010547f0', now() - interval '15 days' + interval '13 hours'),
  ('auth0|demo-theo', '091f3142-6fd8-4d51-b5b3-9b15984761fc', now() - interval '39 days' + interval '13 hours'),
  ('auth0|demo-theo', '091f3142-6fd8-4d51-b5b3-9b15984761fc', now() - interval '20 days' + interval '13 hours'),
  ('auth0|demo-ren', 'bdfea07e-e488-4d34-8ff7-5c8a6c17c052', now() - interval '29 days' + interval '13 hours'),
  ('auth0|demo-theo', 'bdfea07e-e488-4d34-8ff7-5c8a6c17c052', now() - interval '10 days' + interval '13 hours'),
  ('auth0|demo-maya', '7249c08a-9d87-43ad-97c2-bf23a72f14f1', now() - interval '9 days' + interval '13 hours'),
  ('auth0|demo-ren', '20bb3f09-1717-4b1d-a09e-16a7366b4010', now() - interval '37 days' + interval '13 hours')
on conflict do nothing;

-- Fixed share codes so a real Auth0 login can join the demo friend group
-- by typing one of these on the Share screen.
insert into invites (code, created_by) values
  ('MAYA01', 'auth0|demo-maya'),
  ('THEO01', 'auth0|demo-theo'),
  ('REN001', 'auth0|demo-ren')
on conflict (code) do nothing;

commit;

-- Materialize the new visits into the continuous aggregate.
call refresh_continuous_aggregate('daily_place_visits', null, null);
