const express = require('express');
const cookieParser = require('cookie-parser');
const bodyParser = require("body-parser");

const app = express();
const PORT = 8080;

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

// const urlDatabase = {
//   "b2xVn2": "http://www.lighthouselabs.ca",
//   "9sm5xK": "http://www.google.com"
// };

const urlDatabase = {
  b6UTxQ: {
        longURL: "https://www.tsn.ca",
        userID: "aJ48lW"
    },
    i3BoGr: {
        longURL: "https://www.google.ca",
        userID: "aJ48lW"
    }
};

const users = {};

const emailExists = (users, email) => {
  for (let user in users) {
    if(users[user].email === email) {
      return true;
    }
  }

  return false;
};

const getIdFromEmail = (users, email) => {
  for (let user in users) {
    if(users[user].email === email) {
      return user;
    }
  }
};

const generateRandomString = () => {
  // Generates a six-character long string of random alpha-numeric characters
  const alphanum = 'abcdefghigklmnopqrstuvwxyz1234567890';
  let random = '';
  for (let i = 0; i < 6; i++) {
    let char = Math.floor(Math.random() * (35 - 0 + 1)) + 0;
    random += alphanum[char];
  }
  return random;
};

const urlsForUser = (urlDatabase, id) => {
  let filtered = {};
  for (let url in urlDatabase) {
    if (urlDatabase[url].userID === id) {
      filtered[url] = urlDatabase[url];
    }
  }

  return filtered;
}

app.get('/', (req, res) => {
  const id = req.cookies.user_id;
  let authError = null;
  if (!id || !id in users) {
    authError = 'You must log in to view URLs.';
  }
  const user = users[id];
  const templateVars = {
    urls: urlsForUser(urlDatabase, id),
    user,
    authError
  };
  res.render("urls_index", templateVars);
});

app.post("/urls", (req, res) => {
  const id = req.cookies.user_id;
  if (!id || !id in users) {
    res.status(403).send("You must log in to perform that action.");
    return;
  }
  const { longURL } = req.body;
  const key = generateRandomString();
  urlDatabase[key] = {
    longURL,
    userID: id
  };
  res.redirect(`/urls/${key}`);
});

app.get("/u/:shortURL", (req, res) => {
  const { shortURL } = req.params;
  if (!(shortURL in urlDatabase)) {
    res.send("Invalid address.");
    return;
  }

  const { longURL } = urlDatabase[shortURL];
  res.redirect(longURL);
});

app.get('/urls', (req, res) => {
  const id = req.cookies.user_id;
  let authError = null;
  if (!id || !id in users) {
    authError = 'You must log in to view URLs.';
  }
  const user = users[id];
  const templateVars = { 
    urls: urlsForUser(urlDatabase, id),
    user,
    authError
  };
  res.render("urls_index", templateVars);
});

app.get('/urls/new', (req, res) => {
  const id = req.cookies.user_id;
  if (!id || !id in users) {
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
  if (!id || !id in users) {
    res.send("You must log in to perform that action.");
    return;
  }
  const user = users[id];
  const templateVars = { 
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL,
    user
  };
  res.render("urls_show", templateVars);
});

app.post('/urls/:shortURL', (req, res) => {
  const { shortURL } = req.params;
  const { longURL } = req.body;
  urlDatabase[shortURL].longURL = longURL;
  res.redirect(`/`);
});

app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});

app.post('/urls/:shortURL/delete', (req, res) => {
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
    res.status(400).send('You must provide an email and password!')
    return;
  } else if (emailExists(users, email)) {
    res.status(400).send('The email you provided is being used by another account.')
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