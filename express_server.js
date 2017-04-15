const express = require("express");
const app = express();
const PORT = process.env.PORT || 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser')
const serveStatic = require('serve-static');
const bcrypt = require('bcrypt');

app.use(serveStatic(`${__dirname}/public`));
app.use(cookieParser())
app.set("view engine", "ejs")
app.use(bodyParser.urlencoded({extended: true}));

// why are we using keys as codes?
const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com",
  "sdfsdf": "sfsdfsdffs",
  "rwerwerwer": "nmvbnn"
};


const users = {
    "userRandomID": {
      id: "userRandomID",
      email: "user@example.com",
      password: "purple-monkey-dinosaur",
      shortURL: ["b2xVn2", "sdfsdf", "rwerwerwer"],
      longURL: ["http://www.lighthouselabs.ca", "sfsdfsdffs", "nmvbnn"]
    },
   "user2RandomID": {
     id: "user2RandomID",
     email: "user2@example.com",
     password: "dishwasher-funk",
     shortURL: ["9sm5xK"],
     longURL: ["http://www.google.com"]
   }
};



let loginStatus = false;
let loggedEmail = {};

app.get("/", (req, res) => {
  res.end("Hello!!! Welcome to Tiny Url");
});

// register page
app.get("/register", (req, res) => {
  const currentUser = req.cookie ? users[req.cookie['user_id']] : null;
  let templateVars = { urls: urlDatabase, allUsers: users, loginStatus, currentUser };
  console.log("currentUser from register" + currentUser);
  res.render("urls_register", templateVars);
});
// register post
app.post("/register", (req, res) => {
  const checkEmails = checkRegisterEmails(req.body.email, users)
  console.log('this is req.body.email ' + req.body.email);
  console.log('this is checkEmails ' + checkEmails);
    // add another if statment if email entered already exists return error
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
    console.log(urlDatabase);
    console.log("THIS IS USERS urlDatabase IS ^^^^^");
    console.log(users);
    res.cookie('user_id', createID);
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
  console.log('Cookies: ', req.cookies);
  console.log('clicked log in page');
  let templateVars = { allUsers: users, loginStatus, currentUser };
  res.render('urls_login', templateVars);
});
// login post
app.post("/login", (req, res) => {
  console.log('clicked log in');
  // check consts have value of the key from users object
  const checkEmails = checkLoginEmail(req.body.email, users)
  console.log("this is checkEmails " + checkEmails);
  const checkPassword = checkPasswords(req.body.password, users)
  const hashed_password = bcrypt.hashSync(req.body.password, 10);
  bcrypt.compareSync(req.body.password, hashed_password);

  if (checkEmails == "" && checkPassword == "" ) {
    res.statusCode = 403;
    res.end("error 403 make sure email and password are correct")
  } else {
    res.cookie('user_id', users[checkEmails].id);
    let userID = users[checkEmails].id
    const currentUser = users[userID];
    console.log("this is currentUser " + currentUser);
    loggedEmail = checkEmails;
    console.log("this is loggedEmail: " + loggedEmail);
    loginStatus = true
    res.redirect('/');
    console.log(users);
  }
});
// logout post
app.post("/logout", (req, res) => {
  console.log('clicked log out');
  res.clearCookie('user_id')
  loginStatus = false;
  res.redirect('/');
});
// index of urls
app.get("/urls", (req, res) => {
  // const currentUser = users[req.cookies[user_id]];
  const currentUser = req.cookies ? users[req.cookies['user_id']] : null;
  console.log("this is currentUser" + currentUser);
  console.log('you are the the urls page');
  let templateVars = { urls: urlDatabase, allUsers: users, loginStatus, userCurrent: currentUser };
  res.render("urls_index", templateVars);
});

  // delete post
app.post("/urls/:id/delete", (req, res) => {
console.log("you clicked delete");
console.log("STARTING DELETE");
let currentLongURL = 0;
  if (loginStatus == false) {
    res.statusCode = 403;
    res.end("error 403 you are not logged in")
  }

  const currentUser = req.cookies ? users[req.cookies['user_id']] : null;
  console.log("delte currentUser.id : " + currentUser.id);
  console.log("delete req.params.id " + req.params.id);
  currentLongURL = findCurrentLongURL(currentUser, req.params.id);
  console.log("delete currentLongURL " + currentLongURL);
  console.log(users);
  console.log("USERS IS ^^^^^ DATABASE IS BELOW");
  console.log(urlDatabase);

  properOwner = checkOwner(req.params.id, currentUser.id, currentLongURL);

  if (properOwner == false) {
    res.statusCode = 403;
    res.end("error 403 you are not the owner of that URL")
  } else {
    console.log('you deleted somthing ' + req.params.id);
    delete urlDatabase[req.params.id];
    users[currentUser.id].shortURL.splice(currentLongURL, 1)
    users[currentUser.id].longURL.splice(currentLongURL, 1)
    console.log('redirecting back to urls');
    res.redirect('/urls');
  }
});


app.get('/u/:id', (req, res) => {
  console.log("you got to shortURL!");
//     grabbing the full url according to the key from the object
   let longURL = urlDatabase[req.params.id];
  res.redirect(longURL);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls/new", (req, res) => {
  const currentUser = req.cookies ? users[req.cookies['user_id']] : null;
  let templateVars = {  allUsers: users, loginStatus, currentUser };
  if (loginStatus == false) {
    res.redirect('/');
  }
  res.render("urls_new", templateVars);
});

//  added urls to database
app.post("/urls", (req, res) => {
  const currentUser = req.cookies ? users[req.cookies['user_id']] : null;
  const link = generateRandomString();
  urlDatabase[link] = req.body.longURL;
  users[currentUser.id].longURL.push(req.body.longURL);
  users[currentUser.id].shortURL.push(link);
  console.log(users);
  res.redirect('/urls/' + link);
});

app.get("/urls/:id", (req, res) => {
  const currentUser = req.cookies ? users[req.cookies['user_id']] : null;
  console.log(urlDatabase);
  console.log(req.params.id);
  let templateVars = { shortURL: req.params.id, urls: urlDatabase[req.params.id], allUsers: users, loginStatus, userCurrent: currentUser };
  res.render("urls_show", templateVars);
});

app.post("/urls/:id/update", (req, res) => {
  let currentLongURL = 0;
  if (loginStatus == false) {
    res.statusCode = 403;
    res.end("error 403 you are not logged in")
  }
  const currentUser = req.cookies ? users[req.cookies['user_id']] : null;
  console.log("update currentUser.id : " + currentUser.id);
  console.log("update req.params.id " + req.params.id);
  console.log("this is loggedEmail " + loggedEmail);
  currentLongURL = findCurrentLongURL(currentUser, req.params.id);
  console.log("update currentLongURL " + currentLongURL);
  console.log(users);
  console.log("USERS IS ^^^^^ DATABASE IS BELOW");
  console.log(urlDatabase);


  properOwner = checkOwner(req.params.id, currentUser.id, currentLongURL);

  if (properOwner == false) {
    res.statusCode = 403;
    res.end("error 403 you are not the owner of that URL")
  } else {
    console.log("update req.body.update " + req.body.update);
    urlDatabase[req.params.id] = req.body.update;
    users[currentUser.id].longURL[currentLongURL] = req.body.update
    console.log(users);
    console.log("USERS IS ^^^^^ DATABASE IS BELOW");
    console.log(urlDatabase);
    res.redirect('/urls');
  }

});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});


function generateRandomString() {
  let text = "";
  let possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for( var i=0; i < 7; i++ )
    text += possible.charAt(Math.floor(Math.random() * possible.length));
return text;
}


let checkRegisterEmails = (email, objUsers) => {
  let checkEmails = "";
  Object.keys(objUsers).forEach(function (c, i) {
      if (objUsers[c]['email'] == email) {
        return checkEmails = c;
      }
  });
      return checkEmails
}

let checkLoginEmail = (email, objUsers) => {
  let checkEmails = "";
  Object.keys(objUsers).forEach(function (c, i) {
      if (objUsers[c]['email'] == email) {
        return checkEmails = c
      }
  });
    return checkEmails;
}

let checkPasswords = (password, objUsers) => {
  let checkPasswords = "";
  Object.keys(objUsers).forEach(function (c, i) {
      if (objUsers[c]['password'] == password) {
        return checkPasswords = c;
      }
  });
      return checkPasswords;
}

  // properOwner = checkOwner(req.params.id, currentUser.id, currentLongURL);


let checkOwner = (shortURLID, key, currentLongURL) => {
  console.log("shortURLID: " + shortURLID + " key " + key + " currentLongURL " + currentLongURL);
      if (users[key].shortURL[currentLongURL] == shortURLID) {
        return true
      } else {
        return false
      }
}


let findCurrentLongURL = (currentUser, shortID) => {
  for (var i = 0; i < currentUser.longURL.length; i++) {
    if (currentUser.shortURL[i] === shortID) {
      return i
    }
  }
  return 0
}
