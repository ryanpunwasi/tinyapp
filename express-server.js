const express = require('express');
const cookieParser = require('cookie-parser');
const bodyParser = require("body-parser");

const app = express();
const PORT = 8080;

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
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

app.get('/', (req, res) => {
  const id = req.cookies.user_id;
  const user = users[id];
  const templateVars = {
    urls: urlDatabase,
    user
  };
  res.render("urls_index", templateVars);
});

app.post("/urls", (req, res) => {
  const { longURL } = req.body;
  const key = generateRandomString();
  urlDatabase[key] = longURL;
  res.redirect(`/urls/${key}`);
});

app.get("/u/:shortURL", (req, res) => {
  const { shortURL } = req.params;
  const longURL = urlDatabase[shortURL];
  res.redirect(longURL);
});

app.get('/urls', (req, res) => {
  const id = req.cookies.user_id;
  const user = users[id];
  const templateVars = { 
    urls: urlDatabase,
    user
  };
  res.render("urls_index", templateVars);
});

app.get('/urls/new', (req, res) => {
  const id = req.cookies.user_id;
  const user = users[id];
  const templateVars = { 
    user
  };
  res.render('urls_new', templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  const id = req.cookies.user_id;
  const user = users[id];
  const templateVars = { 
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL],
    user
  };
  res.render("urls_show", templateVars);
});

app.post('/urls/:shortURL', (req, res) => {
  const { shortURL } = req.params;
  const { longURL } = req.body;
  urlDatabase[shortURL] = longURL;
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

app.post('/login', (req, res) => {
  res.cookie("username", req.body.username);
  res.redirect('/urls');
});

app.get('/register', (req, res) => {
  const id = req.cookies.user_id;
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