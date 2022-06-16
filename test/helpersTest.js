const { assert } = require('chai');

const { 
  getUserByEmail,
  emailExists,
  getIdFromEmail,
  generateRandomString
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

describe('getUserByEmail', function() {
  it('should return a user with valid email', function() {
    const user = getUserByEmail("user@example.com", testUsers)
    const expectedUserID = "userRandomID";
    assert(user, expectedUserID);
  });

  it('should return false with invalid email', function() {
    const user = getUserByEmail("user@example.com", testUsers)
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
