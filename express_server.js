const express = require("express");
const app = express();
const PORT = process.env.PORT || 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser')


app.use(cookieParser())
app.set("view engine", "ejs")
app.use(bodyParser.urlencoded({extended: true}));

// why are we using keys as codes?
const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.get("/", (req, res) => {
  res.end("Hello!!! Welcome to Tiny Url");
});

app.post("/login", (req, res) => {
  console.log('clicked log in');
  console.log(req.body.username);
  res.cookie('username', req.body.username);
  res.redirect('/');
});

app.get("/urls", (req, res) => {
  console.log('you are the the urls page');
  let templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars);
});

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
  res.render("urls_new");
});

app.post("/urls", (req, res) => {
  const link = generateRandomString();
  urlDatabase[link] = req.body.longURL;
  res.redirect('/urls/' + link);
});

app.get("/urls/:id", (req, res) => {
  let templateVars = { shortURL: req.params.id, urls: urlDatabase[req.params.id] };
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
