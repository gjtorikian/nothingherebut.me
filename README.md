# nothingherebut.me

N o t h i n g H e r e (but me) is a little experiment in storytelling.

At the beginning of an hour, a phrase appears. As that hour passes, the phrase begins to fade out, and the next phrase in the story fades in. Thus, the best time to read a phrase is at the top of every hour; the hardest time to read both phrases is at the half-hour mark.

The "artistic intent" here is to play with people's obsession with checking the same websites over and over. In this case, the content changes imperceptibly as you watch the site over the course of the day, but it is most legible when you make frequent visits.

To add further chaos, the text displayed is different depending on where in the world you're viewing the website from. The twenty-four hour day is divided into three chunks of eight hours each. The world itself is divided into Northwest, Northeast, Southwest, and Southeast. Perhaps the diagram below will help illustrate how the story is broken up:

```
                           +
                           |
                           |
                           |
                           |      (hours 0 - 7)
                           |
                           |
                           |
                 North     |     South    
             +++++++++++++++++++++++++++++
             |                           |
             |                           |
             |                           |
             |                           |
             |                           |
             |                           |      (hours 8 - 15)
             |                           |
             |                           |
       +++++++++++++               +++++++++++++
       |           |               |           |
       |           |               |           |
       |           |               |           |
       |           |               |           |
West   |           | East     West |           | East      (hours 16 - 23)
       |           |               |           |
       |           |               |           |
       |           |               |           |
       +           +               +           +
```

Each `|` pipe represents an hour. At the beginning of the day (midnight to 7 a.m.), everyone receives the same story. The first branch occurs at 8 a.m. If you live in the Northern Hemisphere, you get the Northern branch; if you live in the Southern Hemisphere, you get the Southern branch. Similarly, at 4 p.m. the second split occurs. Depending on whether you live in the Eastern or Western Hemisphere, by the time 11 p.m. comes around you'll have received one of four unique narratives.

Over the course of a month, the four stories do cycle through every branch, meaning that within four weeks you'll have been given the opportunity to read every part.

# Open source

I am a believer in open source, which is why nearly the entire project is available here.

What's _not_ available is the actual story itself. Providing that full text would sort of default the purpose of the project. (This is also why the story is an image. Embedding the text in the browser DOM would just allow you to always read the two lines easily at any point in an hour. Fetching the image and decoding it ought to provide just enough of a frustrating barrier.)

The file _text.sample.yml_ provides a rough outline of what that file looks like. Feel free to add your own text and rename it to _text.yml_ to make the server render it.

# Running locally

After cloning the repository and renaming _text.sample.yml_, enter

```
npm install
npm run dev-server
```
