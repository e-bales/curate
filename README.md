# 🖌️Curate. 

This application is a full stack JavaScript solo project for art appreciators who want to view, critique, and share art from the Met!

This application was a bit of a passion project of mine and a test to see if I could implement the basics of a social media platform, 'liking' and 'following,' while also incorporating my interest in art and art museums. With this web app, you can explore, favorite, and share pieces from The Metropolitan Museum of Art right from your desk! Using a multitude of technologies, such as React.js and PostgreSQL, I built this application to test my web architecture capabilites and CSS expertise, while also increasing art exposure along the way!

# 🔗Link

To explore my web app, visit: https://curate.elibales.dev/

Feel free to use the <ins>Guest Account</ins> option when signing in to play around!

# 🕶Previews
![curate-explore-and-favorite](https://github.com/e-bales/curate/assets/132625085/0213503e-7523-4fca-bf6a-cf602d3b0b02)

![curate-gallery-and-follow](https://github.com/e-bales/curate/assets/132625085/1dbeb0e3-1362-4735-9ee9-03e754c6925d)

# 👍Features

&nbsp;&nbsp;&nbsp; As you can see in the previews, Curate allows signed-in users to explore different departments of the Met Museum. I implemented pagination server-side to allow users to view up to ten art pieces on each page. They can add any piece to their favorites by clicking the Heart outline, or they can get a closer look at the piece by selecting either the image or the title, to be taken to a page with more information. There, they can view the raw image, or get taken to the Met's page about the piece, for even more information if you are especially interested in a piece.

&nbsp;&nbsp;&nbsp; Once a piece has been favorited, it can be added to your Gallery, as long as your Gallery isn't already full with five pieces. Users can write a review of up to 400 characters, and then save their review to their Gallery for their followers to see! I implemented a rudimentary but efficient follower system, so if you and your friends make accounts, you can follow one another by username and view each other's Gallery. If you made a mistake in your submission, or no longer want to have a certain piece, you can always edit or delete by clicking the small pencil icon next to the image of the piece.

## 🎯Stretch Features

With more time, I would love to incorporate other art museum APIs. I have found the the Art Institute of Chicago has an API for their collection.
Additionally, I would like to allow user's to search by artistic movements or time periods, such as allowing user's to specifically view Impressionist work, or Romantic work.

# 💻Technologies Used

- JavaScript
- CSS
- JSX
- PostgreSQL
- JSON
- React.js
  - react
  - react-dom
  - react-router-dom
  - react-icons
- Node.js
- Express
- argon2
- jsonwebtoken
- The Metropolitan Museum of Art Collection API
  - https://metmuseum.github.io/
