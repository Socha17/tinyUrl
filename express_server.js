const express = require("express");
const app = express();
const PORT = process.env.PORT || 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser')
const serveStatic = require('serve-static');

app.use(serveStatic(`${__dirname}/public`));
app.use(cookieParser())
app.set("view engine", "ejs")
app.use(bodyParser.urlencoded({extended: true}));

// why are we using keys as codes?
const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {
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


let loginStatus = false

app.get("/", (req, res) => {
  res.end("Hello!!! Welcome to Tiny Url");
});

// register page
app.get("/register", (req, res) => {
  let templateVars = { urls: urlDatabase, allUsers: users, loginStatus };
  res.render("urls_register", templateVars);
});
// register post
app.post("/register", (req, res) => {
  const checkEmails = checkRegisterEmails(req.body.email, users)
  console.log('this is checkEmails' + checkEmails);
    // add another if statment if email entered already exists return error
  if (req.body.email == "") {
    console.log('error 401');
    res.statusCode = 401;
    res.end("error 401 text field was blank")
  }
  if (checkEmails == false) {
    res.statusCode = 401;
    res.end("error 401 email already exists")
  }

  const createID = generateRandomString()
  users[createID] = {
    id: createID,
    email: req.body.email,
    password: req.body.password
  };
  loginStatus = true
  // users[createID].email = req.body.email;
  // users.createID.password = req.body.password;
  console.log(users);
  res.cookie('user_id', createID);
  res.redirect('/');
});
  // login get
app.get("/login", (req, res) => {
  console.log('clicked log in page');
  let templateVars = { allUsers: users, loginStatus };
  res.render('urls_login', templateVars);
});
// login post
app.post("/login", (req, res) => {
  console.log('clicked log in');
  // check consts have value of the key from users object
  const checkEmails = checkLoginEmail(req.body.email, users)
  const checkPassword = checkPasswords(req.body.password, users)
  if (checkEmails == "" && checkPassword == "" ) {
    res.statusCode = 403;
    res.end("error 403 make sure email and password are correct")
  } else {
    loginStatus = true
    res.cookie('user_id', users[checkEmails].id);
    res.redirect('/');
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
  console.log('you are the the urls page');
  let templateVars = { urls: urlDatabase, allUsers: users, loginStatus };
  res.render("urls_index", templateVars);
});
  // delete post
app.post("/urls/:id/delete", (req, res) => {
  console.log('you deleted somthing ' + req.params.id);
  delete urlDatabase[req.params.id];
  console.log('redirecting back to urls');
  res.redirect('/urls');
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
  let templateVars = {  allUsers: users, loginStatus };
  res.render("urls_new", templateVars);
});

app.post("/urls", (req, res) => {
  const link = generateRandomString();
  urlDatabase[link] = req.body.longURL;
  res.redirect('/urls/' + link);
});

app.get("/urls/:id", (req, res) => {

  let templateVars = { shortURL: req.params.id, urls: urlDatabase[req.params.id], allUsers: users, loginStatus };
  res.render("urls_show", templateVars);
});

app.post("/urls/:id/update", (req, res) => {
  console.log('you updated somthing ' + req.params.id);
  console.log('updating ' + urlDatabase[req.params.id] + ' to ' + req.body.update);
  urlDatabase[req.params.id] = req.body.update;
  console.log('redirecting back to urls from update');
  res.redirect('/urls');
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
  let checkEmails = true;
  Object.keys(objUsers).forEach(function (c, i) {
      if (objUsers[c]['email'] == email) {
        return checkEmails = false;
      }
  });
      if (checkEmails == false) { return false; } else { return true; }
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
