const express = require('express');
const cookieSession = require('cookie-session');
const bodyParser = require("body-parser");
const bcrypt = require("bcryptjs");
require('dotenv').config();

const helper = require('./helpers');

const app = express();
const PORT = 8080;

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieSession({
  name: 'session',
  keys: [
    process.env.KEY_1,
    process.env.KEY_2
  ]
}));

const urlDatabase = {};
const users = {};

app.get('/', (req, res) => {
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
  if (!user) {
    res.status(403).send("You must log in to perform that action.");
    return;
  } else if (usersUrls[shortURL]) {
    res.status(403).send("You don't have permission to edit this URL.");
    return;
  }

  urlDatabase[key] = {
    longURL,
    userID: id
  };

  res.redirect(`/urls/${key}`);
});

app.get("/u/:shortURL", (req, res) => {
  const { shortURL } = req.params;

  if (!(shortURL in urlDatabase)) {

    // Render error page if short url doesn't exist
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

  if (!helper.getUser(users, id)) {
    authError = 'You must log in to view URLs.';
  }
  
  const templateVars = {
    urls: helper.urlsForUser(urlDatabase, id),
    user,
    authError
  };

  res.render("urls_index", templateVars);
});

app.get('/urls/new', (req, res) => {
  const id = req.session.user_id;
  const user = users[id];

  if (!helper.getUser(users, id)) {
    res.redirect('/login');
    return;
  }

  const templateVars = {
    user
  };

  res.render('urls_new', templateVars);
});

app.get("/urls/:shortURL", (req, res) => {

  const id = req.session.user_id;
  const { shortURL } = req.params;
  const user = helper.getUser(users, id);
  const urlInfo = helper.getShortURLInfo(urlDatabase, shortURL) || {};
  const urlUserID = urlInfo.userID;
  const longURL  = urlInfo.longURL;

  if (!user) {
    // Render error page if user is not logged in
    res.render("error", {
      error: "You must log in to view this URL."
    });

    return;

  } else if (urlUserID !== id) {

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

  if (!helper.getUser(users, id)) {
    res.status(403).send("You are not authorized to perform this action.");
    return;
  }

  urlDatabase[shortURL].longURL = longURL;
  res.redirect(`/`);
});

app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});

app.post('/urls/:shortURL/delete', (req, res) => {
  const id = req.session.user_id;
  const { shortURL } = req.params;
  const usersUrls = helper.urlsForUser(urlDatabase, id);
  const urlOwnerID = usersUrls.userID;

  if (!(helper.getUser(users, id)) || urlOwnerID !== id) {
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
  const user = users[id];

  if (id in users) {

    res.redirect('/urls');
    return;

  }

  const templateVars = {
    urls: urlDatabase,
    user,
    error: null
  };

  res.render("login", templateVars);
});

app.post('/login', (req, res) => {
  let id;
  const { email, password } = req.body;

  if (helper.emailExists(users, email)) {
    id = helper.getUserByEmail(email, users).id;
    const dbPassword  = helper.getUserByEmail(email, users).password;
    
    if (!(bcrypt.compareSync(password, dbPassword))) {
      res.status(403).render('login',
        {
          error: 'Invalid credentials provided.',
          user: id
        }
      );
      return;
    }
  } else {

    res.status(403).render('login', {
      error: 'Invalid credentials provided.',
      user: id
    });

    return;

  }

  req.session.user_id = id;
  res.redirect('/urls');
});

app.get('/register', (req, res) => {
  const id = req.session.user_id;
  const user = users[id];

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
  const id = helper.generateRandomString();
  const hashedPassword = bcrypt.hashSync(password, 10);

  if (!email.trim() || !password) {

    res.status(400).send('You must provide an email and password!');
    return;

  } else if (helper.emailExists(users, email)) {

    res.status(400).send('The email you provided is being used by another account.');
    return;

  }
  
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