const express = require('express');
const cookieParser = require('cookie-parser');
const bodyParser = require("body-parser");

const app = express();
const PORT = 8080;

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

const urlDatabase = {};
const users = {};

// ===== HELPER FUNCTIONS ===== //

const emailExists = (users, email) => {
  /* Returns true if email exists in users, where users consists of keys whose values are objects.
   * Returns false if otherwise.
   */

  for (let user in users) {
    if (users[user].email === email) {
      return true;
    }
  }
  return false;
};

const getIdFromEmail = (users, email) => {
  /* Returns the userID associated with email in the users object, where users consists of keys whose values are objects.
   * Returns false if email does not exist in users.
   */

  for (let user in users) {
    if (users[user].email === email) {
      return user;
    }
  }

  return false;
};

const generateRandomString = () => {
  // Returns a six-character long string of random alpha-numeric characters

  const alphanum = 'abcdefghigklmnopqrstuvwxyz1234567890';
  const lastIndex = alphanum.length - 1;
  let random = '';

  for (let i = 0; i < 6; i++) {
    let char = Math.floor(Math.random() * (lastIndex - 0 + 1)) + 0;
    random += alphanum[char];
  }

  return random;
};

const urlsForUser = (urlDatabase, id) => {
  /* Returns an object that consists of the key-value pairs in urlDatabase that have a userID equal to id.
   */
  let filtered = {};

  for (let url in urlDatabase) {
    if (urlDatabase[url].userID === id) {
      filtered[url] = urlDatabase[url];
    }
  }

  return filtered;
};

const getUser = (id) => {
  /* Returns the value with key id in the global user object. Returns false if id does not exist as a key in users.
   */
  if (id in users) {
    return users[id];
  }

  return false;
};

// ===== ROUTE HANDLERS ===== //

app.get('/', (req, res) => {

  const id = req.cookies.user_id;
  const user = users[id];
  let authError = null;
  const urls = urlsForUser(urlDatabase, id);

  if (id === undefined || !(id in users)) {
    authError = 'You must log in to view URLs.';
  }
  
  const templateVars = {
    urls,
    user,
    authError
  };

  res.render("urls_index", templateVars);
});

app.post("/urls", (req, res) => {
  const id = req.cookies.user_id;
  const { longURL } = req.body;
  const key = generateRandomString();

  if (!getUser(id)) {
    res.status(403).send("You must log in to perform that action.");
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
  const id = req.cookies.user_id;
  const user = users[id];
  let authError = null;

  if (!getUser(id)) {
    authError = 'You must log in to view URLs.';
  }
  
  const templateVars = {
    urls: urlsForUser(urlDatabase, id),
    user,
    authError
  };
  
  res.render("urls_index", templateVars);
});

app.get('/urls/new', (req, res) => {
  const id = req.cookies.user_id;
  if (!(id) || !(id in users)) {
    res.redirect('/login');
    return;
  }
  const user = users[id];
  const templateVars = {
    user
  };
  res.render('urls_new', templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  const id = req.cookies.user_id;
  const { shortURL } = req.params;
  if (!(id) || !(id in users)) {
    res.send("You must log in to perform that action.");
    return;
  } else if (urlDatabase[shortURL].userID !== id) {
    res.send("Uh oh! Looks like you don't have access to this URL.");
    return;
  }
  const user = users[id];
  const templateVars = {
    shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL,
    user
  };
  res.render("urls_show", templateVars);
});

app.post('/urls/:shortURL', (req, res) => {
  const id = req.cookies.user_id;
  if (!(id in users)) {
    res.status(403).send("You are not authorized to perform this action.");
    return;
  }
  const { shortURL } = req.params;
  const { longURL } = req.body;
  urlDatabase[shortURL].longURL = longURL;
  res.redirect(`/`);
});

app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});

app.post('/urls/:shortURL/delete', (req, res) => {
  const id = req.cookies.user_id;
  if (!(id in users)) {
    res.status(403).send("You are not authorized to perform this action.");
    return;
  }
  const { shortURL } = req.params;
  if (shortURL in urlDatabase) {
    delete urlDatabase[shortURL];
  }
  res.redirect('/');
});

app.get('/login', (req, res) => {
  const id = req.cookies.user_id;
  if (id in users) {
    res.redirect('/urls');
    return;
  }
  const user = users[id];
  const templateVars = {
    urls: urlDatabase,
    user
  };
  res.render("login", templateVars);
});

app.post('/login', (req, res) => {
  let id;
  const { email, password } = req.body;
  if (emailExists(users, email)) {
    id = getIdFromEmail(users, email);
    if (password !== users[id].password) {
      res.status(403).send('Invalid credentials provided.');
      return;
    }
  } else {
    res.status(403).send('Invalid credentials provided.');
    return;
  }
  res.cookie("user_id", id);
  res.redirect('/urls');
});

app.get('/register', (req, res) => {
  const id = req.cookies.user_id;
  if (id in users) {
    res.redirect('/urls');
    return;
  }
  const user = users[id];
  const templateVars = {
    urls: urlDatabase,
    user
  };
  res.render("register", templateVars);
});

app.post('/register', (req, res) => {
  const { email, password } = req.body;
  if (email === '' || password === '') {
    res.status(400).send('You must provide an email and password!');
    return;
  } else if (emailExists(users, email)) {
    res.status(400).send('The email you provided is being used by another account.');
    return;
  }
  const id = generateRandomString();
  users[id] = {
    id,
    email,
    password
  };
  res.cookie("user_id", id);
  res.redirect('/urls');
});

app.post('/logout', (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/');
});

app.listen(PORT, () => {
  console.log("Listening on port", PORT);
});