# Letterbox Watchlist Venn Diagram

## How to use

### install

`npm install`  
It's also required that you have tsc (or ts-node) installed globally.

### Run

#### tsc installed

`npm run run -- --users userOne userTwo`

#### ts-node installed

`npx ts-node src/app.ts --users userOne userTwo ... userN`

where `userOne`, `userTwo`, all the ways up to `userN` are the users you want to compare.

## Notes

All user's watchlists have to be public.
