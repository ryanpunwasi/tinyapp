const { assert } = require('chai');

const {
  getUserByEmail,
  emailExists,
  getIdFromEmail,
  generateRandomString,
  urlsForUser,
  getShortURLInfo,
  getUser
} = require('../helpers.js');

const testUsers = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};

const testUrlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW"
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lQ"
  }
};

describe('getUserByEmail', function() {
  it('should return a user with valid email', function() {
    const user = getUserByEmail("user@example.com", testUsers);
    const expectedUserID = "userRandomID";
    assert(user, expectedUserID);
  });

  it('should return false with invalid email', function() {
    const user = getUserByEmail("user@example.com", testUsers);
    assert(user, false);
  });
});

describe('emailExists', function() {
  it('should return true if email exists', function() {
    const actual = emailExists(testUsers, 'user2@example.com');
    const expected = true;
    assert.deepEqual(actual, expected);
  });

  it('should return false if email does not exist', function() {
    const actual = emailExists(testUsers, 'user655@example.com');
    const expected = false;
    assert.deepEqual(actual, expected);
  });
});

describe('getIdFromEmail', function() {
  it('should return `userRandomID` if given user@example.com', function() {
    const actual = getIdFromEmail(testUsers, 'user@example.com');
    const expected = "userRandomID";
    assert.equal(actual, expected);
  });

  it('should return false if user with provided email does not exist', function() {
    const actual = getIdFromEmail(testUsers, 'user655@example.com');
    const expected = false;
    assert.deepEqual(actual, expected);
  });
});

describe('generateRandomString', function() {
  it('should return a string', function() {
    const actual = generateRandomString();
    const expected = true;
    assert.isString(actual, expected);
  });
  
  it('should return a string that is six characters long', function() {
    const actual = generateRandomString().length;
    const expected = 6;
    assert.equal(actual, expected);
  });
});

describe('urlsForUser', function() {
  it('should return user object(s) if database contains url(s) associated with given id', function() {
    const actual = Object.keys(urlsForUser(testUrlDatabase, 'aJ48lW'));
    const expected = ['b6UTxQ'];
    assert.deepEqual(actual, expected);
  });
  
  it('should return an empty object if database does not contain url(s) associated with given id', function() {
    const actual = urlsForUser(testUrlDatabase, 'notfound');
    const expected = {};
    assert.deepEqual(actual, expected);
  });
});

describe('getShortURLInfo', function() {
  it('should return url object if database contains url associated with given shortURL', function() {
    const actual = getShortURLInfo(testUrlDatabase, 'i3BoGr');
    const expected = {
      longURL: "https://www.google.ca",
      userID: "aJ48lQ"
    };
    assert.deepEqual(actual, expected);
  });
  
  it('should return undefined if database does not contain url associated with given shortURL', function() {
    const actual = getShortURLInfo(testUrlDatabase, 'notfound');
    assert.isUndefined(actual);
  });
});

describe('getUser', function() {
  it('should return user object if database contains user associated with given id', function() {
    const actual = getUser(testUsers, "userRandomID");
    const expected = {
      id: "userRandomID",
      email: "user@example.com",
      password: "purple-monkey-dinosaur"
    };
    assert.deepEqual(actual, expected);
  });
  
  it('Returns false if id does not exist as a key in users', function() {
    const actual = getUser(testUsers, 'notfound');
    assert.isFalse(actual);
  });
});
