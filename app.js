const express = require("express");
const path = require('path');
const hbs = require('hbs');
const parser = require('body-parser');
const jssha = require('jssha');

const port = process.env.PORT || 2000;

const app = express();

app.use(parser.json());
app.use(parser.urlencoded({ extended: true }));

const the_static = path.join(__dirname);

app.set("view engine" , 'hbs');
app.use(express.static(the_static));

app.get('/' , (req,res)=>{
  res.render("thehtml");
})

 const request = require('request');

 app.post('/payment_gateway/payumoney', (req, res) => {

  // req.body.txnid = "oidjsfk0ww"

  // req.body.email = req.user.email;
  // req.body.firstname = req.user.firstname;
  //Here save all the details in pay object

  const pay = req.body;

  const hashString = '6BFPjU' //store in in different file
  + '|' + pay.txnid
  + '|' + pay.amount
  + '|' + pay.productinfo
  + '|' + pay.firstname
  + '|' + pay.email
  + '|' + '||||||||||'
  + 'K0heTR9JiwtnDrcFdWYc83IsaLY6t1d4' //store in in different file

  const sha = new jssha('SHA-512', "TEXT");

  sha.update(hashString);

  //Getting hashed value from sha module
   const hash = sha.getHash("HEX");

 //We have to additionally pass merchant key to API
 // so remember to include it.
 pay.key = '6BFPjU' //store in in different file;
 pay.surl = '/success';
 pay.furl = '/failure';
 pay.hash = hash;

//Making an HTTP/HTTPS call with request

request.post({
 headers: {
   'Accept': 'application/json',
   'Content-Type': 'application/json'
  },
  url: 'https://secure.payu.in/_payment',
  form: pay

  }, function (error, httpRes, body) {

 if (error)
 res.send(
  {status: false,
   message:error.toString()
  }
 );

if (httpRes.statusCode === 200) {

 console.log("hey the payment was successfull");

 } else if (httpRes.statusCode >= 300 &&
 httpRes.statusCode <= 400) {

  res.redirect(httpRes.headers.location.toString());
  console.log("something went wrong");

 }
 })

});

app.post("/success" , (req,res)=>{
  res.render("success");
});
app.post("/failure" , (req,res)=>{
  res.render("failure");
});
app.listen(port , ()=>{
  console.log(`started server at ${port}`);
})
