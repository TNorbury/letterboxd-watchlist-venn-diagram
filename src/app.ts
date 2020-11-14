import fetch, { Response } from "node-fetch";
import cheerio from "cheerio";

main();

async function main() {
  const userOneTitles = await getUsersWatchList("coburnfilms");
  const userTwoTitles = await getUsersWatchList("tylernorbury");

  // This is for optimizing: only iterate over the shortest list
  let shortList: string[] = userOneTitles;
  let longList: string[] = userTwoTitles;
  // if (userOneTitles.length <= userTwoTitles.length) {
  //   shortList = userOneTitles;
  //   longList = userTwoTitles;
  // }
  // else {
  //   shortList = userTwoTitles;
  //   longList = userOneTitles;
  // }

  let venn: string[] = [];
  shortList.forEach((title: string) => {
    if (longList.includes(title)) {
      venn.push(title);
    }
  });

  console.log(" ");
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
