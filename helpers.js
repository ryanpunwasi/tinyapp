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

const getUserByEmail = (email, database) => {

  for (let user in database) {
    if (database[user].email === email) {
      return database[user];
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

const getShortURLInfo = (urlDatabase, shortURL) => {
  return urlDatabase[shortURL];
};

const getUser = (users, id) => {
  /* Returns the value with key id in the users object. Returns false if id does not exist as a key in users.
   */
  if (id in users) {
    return users[id];
  }

  return false;
};

module.exports = {
  emailExists,
  getIdFromEmail,
  getUserByEmail,
  getUser,
  generateRandomString,
  urlsForUser,
  getShortURLInfo
};