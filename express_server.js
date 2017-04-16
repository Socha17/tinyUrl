const express = require("express");
const app = express();
const PORT = process.env.PORT || 8080; // default port 8080
app.set("view engine", "ejs")
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session')
const serveStatic = require('serve-static');
const bcrypt = require('bcrypt');


// setting cookies
app.use(serveStatic(`${__dirname}/public`));
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2'],

  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}))


  // bodyParser gets values from forms
app.use(bodyParser.urlencoded({extended: true}));


// database for all urls and shortURL keys
const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com",
  "j4N9es": "http://facebook.com",
  "B5f8ol": "http://youtube.com"
};

// database for all users and which keys they own
const users = {
    "userRandomID": {
      id: "userRandomID",
      email: "user@example.com",
      password: "purple-monkey-dinosaur",
      shortURL: ["b2xVn2", "j4N9es", "B5f8ol"],
      longURL: ["http://www.lighthouselabs.ca", "http://facebook.com", "http://youtube.com"]
    },
   "user2RandomID": {
     id: "user2RandomID",
     email: "user2@example.com",
     password: "dishwasher-funk",
     shortURL: ["9sm5xK"],
     longURL: ["http://www.google.com"]
   }
};

// tracking loginStatus
let loginStatus = false;
let loggedEmail = {};

app.get("/", (req, res) => {
  res.redirect('/urls');
});

// short URL links to full URL
app.get('/u/:id', (req, res) => {
//     grabbing the full url according to the key from the object
  const fullLink = urlDatabase[req.params.id]
  res.redirect(fullLink);
});

// register page
app.get("/register", (req, res) => {
  const currentUser = req.cookie ? users[req.cookie['user_id']] : null;
  let templateVars = { urls: urlDatabase, allUsers: users, loginStatus, currentUser };
  res.render("urls_register", templateVars);
});
// register post
app.post("/register", (req, res) => {
  const checkEmails = checkRegisterEmails(req.body.email, users)
  // check if somthing was entered
  if (req.body.email == "") {
    console.log('error 401');
    res.statusCode = 401;
    res.end("error 401 text field was blank")
  }
  // check if email exists
  if (checkEmails == "") {
    const createID = generateRandomString()
    const hashed_password = bcrypt.hashSync(req.body.password, 10);
    users[createID] = {
      id: createID,
      email: req.body.email,
      password: hashed_password,
      shortURL: [],
      longURL: []
    };
    loginStatus = true;
    loggedEmail = req.body.email;
    req.session.user_id = createID;
    let userID = createID
    const currentUser = users[userID];
    res.redirect('/');
  } else {
    res.statusCode = 401;
    res.end("error 401 email already exists")
  }

});
  // login get
app.get("/login", (req, res) => {
  const currentUser = req.cookie ? users[req.cookie['user_id']] : null;
  let templateVars = { allUsers: users, loginStatus, currentUser };
  res.render('urls_login', templateVars);
});
// login post
app.post("/login", (req, res) => {

  // check consts have value of the key from users object
  const checkEmails = checkLoginEmail(req.body.email, users)
  // const checkPassword = checkPasswords(req.body.password, users)

  if (checkEmails == "" || bcrypt.compareSync(req.body.password, users[checkEmails].password) == false ) {
    res.statusCode = 403;
    res.end("error 403 make sure email and password are correct")
  } else {
    // setting cookie
    req.session.user_id = users[checkEmails].id;
    let userID = users[checkEmails].id
    const currentUser = users[userID];
    loggedEmail = checkEmails;
    loginStatus = true
    res.redirect('/');
  }
});
// logout post
app.post("/logout", (req, res) => {
  req.session = null
  loginStatus = false;
  res.redirect('/');
});
// index of urls
app.get("/urls", (req, res) => {
  const currentUser = req.session ? users[req.session.user_id] : null;
  let templateVars = { urls: urlDatabase, allUsers: users, loginStatus, userCurrent: currentUser };
  res.render("urls_index", templateVars);
});

  // delete post
app.post("/urls/:id/delete", (req, res) => {
  let currentLongURL = 0;
  if (loginStatus == false) {
    res.statusCode = 403;
    res.end("error 403 you are not logged in")
  }

  const currentUser = req.session ? users[req.session.user_id] : null;
  currentLongURL = findCurrentLongURL(currentUser, req.params.id);
  properOwner = checkOwner(req.params.id, currentUser.id, currentLongURL);

  if (properOwner == false) {
    res.statusCode = 403;
    res.end("error 403 you are not the owner of that URL")
  } else {
    delete urlDatabase[req.params.id];
    users[currentUser.id].shortURL.splice(currentLongURL, 1)
    users[currentUser.id].longURL.splice(currentLongURL, 1)
    res.redirect('/urls');
  }
});


app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls/new", (req, res) => {
  const currentUser = req.session ? users[req.session.user_id] : null;
  let templateVars = {  allUsers: users, loginStatus, currentUser };
  if (loginStatus == false) {
  res.redirect('/');
  }
  res.render("urls_new", templateVars);
});

//  added urls to database
app.post("/urls", (req, res) => {
  const currentUser = req.session ? users[req.session.user_id] : null;
  const link = generateRandomString();
  urlDatabase[link] = req.body.longURL;
  users[currentUser.id].longURL.push(req.body.longURL);
  users[currentUser.id].shortURL.push(link);
  res.redirect('/urls/' + link);
});

app.get("/urls/:id", (req, res) => {
  const currentUser = req.session ? users[req.session.user_id] : null;
  let templateVars = { shortURL: req.params.id, urls: urlDatabase[req.params.id], allUsers: users, loginStatus, userCurrent: currentUser };
  res.render("urls_show", templateVars);
});

app.post("/urls/:id/update", (req, res) => {
  let currentLongURL = 0;
  if (loginStatus == false) {
    res.statusCode = 403;
    res.end("error 403 you are not logged in")
  }
  const currentUser = req.session ? users[req.session.user_id] : null;
  currentLongURL = findCurrentLongURL(currentUser, req.params.id);

  properOwner = checkOwner(req.params.id, currentUser.id, currentLongURL);

  if (properOwner == false) {
    res.statusCode = 403;
    res.end("error 403 you are not the owner of that URL")
  } else {
    urlDatabase[req.params.id] = req.body.update;
    users[currentUser.id].longURL[currentLongURL] = req.body.update
    res.redirect('/urls');
  }
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

// func makes random string for URLS
function generateRandomString() {
  let text = "";
  let possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for( var i=0; i < 7; i++ )
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  return text;
}

// checks emails on register to make sure its not already used
let checkRegisterEmails = (email, objUsers) => {
  let checkEmails = "";
  Object.keys(objUsers).forEach(function (c, i) {
      if (objUsers[c]['email'] == email) {
        return checkEmails = c;
      }
  });
  return checkEmails
}
// checks emails when logging in
let checkLoginEmail = (email, objUsers) => {
  let checkEmails = "";
  Object.keys(objUsers).forEach(function (c, i) {
      if (objUsers[c]['email'] == email) {
        return checkEmails = c
      }
  });
  return checkEmails;
}
// checks password when logging in
let checkPasswords = (password, objUsers, currentID) => {
  if (bcrypt.compareSync(password, objUsers[currentID].password) == true) {
    let checkPasswords = "";
    Object.keys(objUsers).forEach(function (c, i) {
        if (objUsers[currentID].password == password) {
          return checkPasswords = currentID;
        }
    });
    return checkPasswords;
  }
}
// checks owner of URL
let checkOwner = (shortURLID, key, currentLongURL) => {
  if (users[key].shortURL[currentLongURL] == shortURLID) {
    return true
  } else {
    return false
  }
}

// finds current index of url to update or delete proper URL
let findCurrentLongURL = (currentUser, shortID) => {
  for (var i = 0; i < currentUser.longURL.length; i++) {
    if (currentUser.shortURL[i] === shortID) {
      return i
    }
  }
  return 0
}
