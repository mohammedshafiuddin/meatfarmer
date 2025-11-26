const express = require('express');
const path = require('path');

const app = express();

// Set up Pug as the view engine
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Home route - statically render the home page
app.get('/', (_, res) => {
  res.render('home', {
    title: 'Symbuyote - Local Trust, Online Convenience',
    year: new Date().getFullYear()
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Symbuyote info site running at http://localhost:${PORT}`);
});