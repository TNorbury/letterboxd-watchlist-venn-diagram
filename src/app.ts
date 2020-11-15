import fetch, { Response } from "node-fetch";
import cheerio from "cheerio";
import yargs from "yargs";

main();

async function main() {
  const argv = yargs(process.argv.slice(2)).options({
    users: {
      type: "array",
      demandOption: true,
      description:
        "The two users (separated by a space) that you wish to compare the watchlists of",
    },
  }).argv;

  if (argv.users.length != 2) {
    return console.log("You must specify two users!");
  }

  let userOne = argv.users[0] as string;
  let userTwo = argv.users[1] as string;
  const userOneTitles = await getUsersWatchList(userOne);
  const userTwoTitles = await getUsersWatchList(userTwo);

  // This is for optimizing: only iterate over the shortest list
  let shortList: string[] = userOneTitles;
  let longList: string[] = userTwoTitles;
  if (userOneTitles.length <= userTwoTitles.length) {
    shortList = userOneTitles;
    longList = userTwoTitles;
  } else {
    shortList = userTwoTitles;
    longList = userOneTitles;
  }

  let venn: string[] = [];
  shortList.forEach((title: string) => {
    if (longList.includes(title)) {
      venn.push(title);
    }
  });

  console.log(`\nThe watchlist venn diagram for ${userOne} and ${userTwo} is:`);
  venn.forEach((title: string) => {
    console.log(title);
  });
}

async function getUsersWatchList(username: string): Promise<string[]> {
  console.log(`Loading ${username}'s watchlist, this could take a sec...`);
  // Load the user's watchlist page, this'll get us the number of movies that
  // have in their watchlist
  const res: Response = await fetch(
    `https://letterboxd.com/${username}/watchlist/`,
    {
      method: "GET",
    }
  );
  let status = res.status;

  // not a user
  if (status === 404) {
    console.log(`${username} isn't a user registered on Letterboxd`);
    process.exit(1);
  }

  // watchlist is private
  else if (status === 401) {
    console.log(`${username} has their watchlist set to private`);
    process.exit(1);
  }

  // I'm expecting a 200, but I didn't get one... Run away :(
  else if (status !== 200) {
    console.log(
      "Didn't get the result I was expecting. Exiting just to be safe..."
    );
  }

  let $ = cheerio.load(await res.text());

  // Get the number of films in a user's watchlist, and thus the number of pages
  let numFilms: number = 0;
  let numPages: number = 0;
  let numFilmsHeader = $(".replace-if-you");
  let filmsStr = numFilmsHeader[0].next.data
    ?.replace(" to see ", "")
    .replace("films", "")
    .replace(",", "")
    .trim();
  if (filmsStr) {
    numFilms = parseInt(filmsStr);
    numPages = Math.ceil(numFilms / 28);
  }

  let titles: string[] = [];

  // no go through all the other ones
  for (let i = 1; i <= numPages; i++) {
    const res: Response = await fetch(
      `https://letterboxd.com/${username}/watchlist/page/${i}/`,
      {
        method: "GET",
      }
    );
    $ = cheerio.load(await res.text());

    // We have to look at the image tag so we can read the alt attribute as
    // that's the only place the film's name is located
    const titlesHtml = $(".image");
    titlesHtml.each((_, e: cheerio.Element) => {
      titles.push(e.attribs.alt);
    });
  }

  return titles;
}
