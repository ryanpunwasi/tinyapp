const express = require('express'); // Express library
const cookieSession = require('cookie-session'); // Create encrypted cookie sessions
const bodyParser = require("body-parser"); // Parse HTTP POST requests
const bcrypt = require("bcryptjs"); // Hashing library
require('dotenv').config(); // Loads environment variables from .env

const helper = require('./helpers'); // Helper functions

const app = express();
const PORT = 8080;

// Middleware setup

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieSession({
  name: 'session',
  keys: [
    process.env.KEY_1,
    process.env.KEY_2
  ]
}));

// Initialize databases
const urlDatabase = {};
const users = {};

app.get('/', (req, res) => {
  // Redirect to /login if user is not logged in, otherwise redirect to /urls
  const id = req.session.user_id;

  if (!(helper.getUser(users, id))) {
    return res.redirect('/login');
  } else {
    return res.redirect('/urls');
  }
});

app.post("/urls", (req, res) => {

  const id = req.session.user_id;
  const { longURL, shortURL } = req.body;
  const key = helper.generateRandomString();
  const user = helper.getUser(users, id);
  const usersUrls = helper.urlsForUser(urlDatabase, id);

  // Send 403s if user is not logged in or if user is attempting to edit a URL that doesn't belong to them
  if (!user) {
    res.status(403).send("You must log in to perform that action.");
    return;
  } else if (usersUrls[shortURL]) {
    res.status(403).send("You don't have permission to edit this URL.");
    return;
  }

  // Insert URL object into database with random key
  urlDatabase[key] = {
    longURL,
    userID: id
  };

  res.redirect(`/urls/${key}`);
});

app.get("/u/:shortURL", (req, res) => {
  // Extract :shortURL
  const { shortURL } = req.params;

  // Render error page if short url doesn't exist
  if (!(shortURL in urlDatabase)) {

    res.render("error", {
      error: "Whoops! That short url doesn't exist..."
    });

    return;
  }

  const { longURL } = urlDatabase[shortURL];
  res.redirect(longURL);

});

app.get('/urls', (req, res) => {
  const id = req.session.user_id;
  const user = users[id];
  let authError = null;

  // Render alert if user if not logged in
  if (!helper.getUser(users, id)) {
    authError = 'You must log in to view URLs.';
  }
  
  const templateVars = {
    urls: helper.urlsForUser(urlDatabase, id),
    user,
    authError
  };

  // If no errors, plain login page will render
  res.render("urls_index", templateVars);
});

app.get('/urls/new', (req, res) => {
  const id = req.session.user_id;
  const user = helper.getUser(users, id);

  // Redirect if user is not logged in
  if (!user) {
    res.redirect('/login');
    return;
  }

  const templateVars = {
    user
  };

  res.render('urls_new', templateVars);
});

app.get("/urls/:shortURL", (req, res) => {

  const id = req.session.user_id; // session id
  const { shortURL } = req.params; // Extract :shortURL
  const user = helper.getUser(users, id); // Get user information from session id
  const urlInfo = helper.getShortURLInfo(urlDatabase, shortURL) || {}; // Get url info from database given shortURL
  const urlUserID = urlInfo.userID; // The id of the owner of url
  const longURL  = urlInfo.longURL;

  if (!user) {
    // Render error page if user is not logged in
    res.render("error", {
      error: "You must log in to view this URL."
    });

    return;

  } else if (urlUserID !== id) {
    // Render error page if user did not create this shortURL
    res.render("error", {
      error: "Uh oh! Either this URL doesn't exist or you don't have permission to view it."
    });

    return;
  }
  
  const templateVars = {
    shortURL,
    longURL,
    user
  };

  res.render("urls_show", templateVars);
});

app.post('/urls/:shortURL', (req, res) => {
  const id = req.session.user_id;
  const { shortURL } = req.params;
  const { longURL } = req.body;

  // Send 403 if use is not logged in
  if (!helper.getUser(users, id)) {
    res.status(403).send("You are not authorized to perform this action.");
    return;
  }

  // Update shortURLs long url
  urlDatabase[shortURL].longURL = longURL;
  res.redirect(`/`);
});

app.post('/urls/:shortURL/delete', (req, res) => {
  const id = req.session.user_id;
  const { shortURL } = req.params;
  const usersUrls = helper.urlsForUser(urlDatabase, id); // Get users URLs
  // If shortURL belongs to user, assign to variable. If not, assign null.
  const urlMatch = usersUrls[shortURL] ? usersUrls[shortURL] : null;

  // Send 403 if user is not logged in, or user does not own URL
  if (!(helper.getUser(users, id)) || !urlMatch) {
    res.status(403).send("You are not authorized to perform this action.");
    return;
  }

  if (shortURL in urlDatabase) {
    delete urlDatabase[shortURL];
  }

  res.redirect('/urls');
});

app.get('/login', (req, res) => {
  const id = req.session.user_id;

  // Redirect if user is logged in already
  if (id in users) {

    res.redirect('/urls');
    return;

  }

  const templateVars = {
    urls: urlDatabase,
    user: null,
    error: null
  };

  res.render("login", templateVars);
});

app.post('/login', (req, res) => {
  let id;
  const { email, password } = req.body;

  // Check if email exists
  if (helper.emailExists(users, email)) {
    id = helper.getUserByEmail(email, users).id;
    const dbPassword  = helper.getUserByEmail(email, users).password;
    
    // Compare provided password to password hash in database
    if (!(bcrypt.compareSync(password, dbPassword))) {
      // Send 403 if passwords do not match
      res.status(403).render('login',
        {
          error: 'Invalid credentials provided.',
          user: null
        }
      );
      return;
    }
  } else {
    // Send 403 if email does not exist
    return res.status(403).render('login', {
      error: 'Invalid credentials provided.',
      user: id
    });
  }

  req.session.user_id = id;
  res.redirect('/urls');
});

app.get('/register', (req, res) => {
  const id = req.session.user_id;
  const user = users[id];

  // Redirect if user is logged in already
  if (id in users) {

    res.redirect('/urls');
    return;

  }
  
  const templateVars = {
    urls: urlDatabase,
    user
  };

  res.render("register", templateVars);
});

app.post('/register', (req, res) => {
  const { email, password } = req.body;
  const id = helper.generateRandomString(); // Random string to be used as user id
  const hashedPassword = bcrypt.hashSync(password, 10); // Hashed password

  // Send 400 if email or password are empty or if an account with the provided email already exists
  if (!email.trim() || !password) {

    res.status(400).send('You must provide an email and password!');
    return;

  } else if (helper.emailExists(users, email)) {

    res.status(400).send('The email you provided is being used by another account.');
    return;

  }
  
  // Create user
  users[id] = {
    id,
    email,
    password: hashedPassword
  };

  req.session.user_id = id;
  res.redirect('/urls');
});

app.post('/logout', (req, res) => {

  req.session = null;
  res.redirect('/');
  
});

app.listen(PORT, () => {
  console.log("Listening on port", PORT);
});