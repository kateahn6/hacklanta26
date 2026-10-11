import { places } from './mock/places';
import { postcards } from './mock/postcards';
import { scrapbooks } from './mock/scrapbooks';
import { users } from './mock/users';

/**
 * Community content the app starts with. Today this is bundled sample data;
 * later it will be replaced by responses from the Noted! backend.
 */
export const seedContent = { users, places, postcards, scrapbooks };

export { CITY_REGION } from './mock/places';
export { DEMO_USER_ID } from './mock/users';
