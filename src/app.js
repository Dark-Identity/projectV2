if(process.env.NODE_ENV !== 'production'){
  require('dotenv').config();
}

const p_key = process.env.PUBLIC_KEY;
const s_key = process.env.SECRET_KEY;

const express  = require('express');
const hbs = require('hbs');
const parser = require('cookie-parser');
const {User, Bet ,Deposit,Withdrawal} = require('./db');
const path = require('path');
const auth = require('./auth');
const http = require('http');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken' );
const cookieParser = require('cookie-parser');
const crypto = require("crypto");
const request = require("request");
const jssha = require("jssha");
const ITEMS = require('./items.json');
const session = require('express-session');
var MongoDBStore = require('connect-mongodb-session')(session);

const app = express();
const JWT_SECRET = 'VISHAL';

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({extended : true}));
app.set('view engine' , 'hbs');


let static_path = path.join( __dirname , '../' , 'public' );

app.use(express.static(static_path));

const port = process.env.PORT || 2000;

let link = 'mongodb+srv://herofootball:hero%40123@cluster0.ujlhaqb.mongodb.net/heroFootball?retryWrites=true&w=majority';


  mongoose.connect(link , {
    useNewUrlParser : true,
    useUnifiedTopology : true
  })
  .then(function(db){
    console.log('dtabse connected');
    app.listen(port , ()=>{
      console.log(`listening on ${port}`);
    })

  })
  .catch(function(err){
    console.log(err);
  })

let temp_user = {
  number : 0,
  inv : 0,
  last_spin : 0,
  parent : 0,
  id : 0
}

var store = new MongoDBStore(
  {
    uri: link,
    databaseName: 'heroFootball',
    collection: 'sessions'
  });

app.use(
  session({
  secret : 'vishal',
  resave : false,
  saveUninitialized: true,
  store : store
}));


// module.exports = temp_user;


async function verify_user(req , res) {

  const token = await req.cookies.id;
  if(token){
    let user_parsed_data = await jwt.verify(token , JWT_SECRET);

    return (user_parsed_data['_id'] === temp_user['id'])? true : false;

  }else{
    return false;
  }

}

const isAuthenticated = (req, res, next) => {
  if(req.session.user_id){
    next();
  }else{
    res.redirect('/login');
  }
}


app.get('/' , (req , res)=>{
  res.render('login');
})

let code;

app.get('/invited' , (req,res)=>{
  res.render('login' , {inv_code : code});
})

app.get('/signup/:id' , (req,res)=>{
  console.log(req.params);
  code = parseInt(req.params.id);
  console.log(code);
  res.writeHead(301, { "Location": '/invited' });
  res.end();
})


// get all the data

app.get('/user_data' ,isAuthenticated, async (req , res)=>{

  let data ;

  if(!req.session.user_id && !req.session.inv){
    res.clearCookie('id');
    res.send({status : 0});
  }else{
    const USER_ID = req.session.user_id;
    try {

     let db_data = await User.findOne({ _id : USER_ID});

      data = {
        name : db_data.user,
        inv  : db_data.inv,
        members : db_data.members,
        balance : db_data.Ammount,
        BankDetails : db_data.BankDetails,
        RebadeBonus : db_data.RebadeBonus,
        WithdrawalDetails : db_data.WithdrawalDetails,
        phone : db_data.phone,
        betPlayed : db_data.betPlayed,
        profit : db_data.profit,
        vipLevel : db_data.vipLevel,
        status : 1
      };

    } catch (e) {

      console.log(e);
        res.clearCookie('id');
      res.send({status : 0});

    } finally {
      return res.send(data);
    }
  }

});

app.get('/get_payment' ,isAuthenticated, async (req,res)=>{

  let data;
  const INVITATION_CODE = req.session.inv;

  let withdrawal = await Withdrawal.find({ inv : INVITATION_CODE});
  let deposit = await Depost.find({ inv : INVITATION_CODE });

  data = {withdrawal , deposit};

  res.send(data);

});

app.get('/get_all_members' ,isAuthenticated,   async (req,res)=>{

  let data = {};
  const INVITATION_CODE = req.session.inv;

    let direct_members = await User.find(
      {parent : INVITATION_CODE},
      {_id : 0 , user : 1 , members : 1 , Ammount : 1 , WithdrawalDetails : 1  , betPlayed : 1 , withdrawalC : 1 , inv : 1 , deposit : 1}
    );
    let level2_user = {};
    let level3_user = {};

    data['direct_members'] = direct_members;

    for(let i = 0 ; i< direct_members.length; i++){
     let level2 =   await User.find(
        {parent : direct_members[i].inv},
        {_id : 0 , user : 1 , members : 1 , Ammount : 1 , WithdrawalDetails : 1  , betPlayed : 1 , withdrawalC : 1 , inv : 1, deposit : 1}
      );
      level2_user[i] = level2;
      for(let j = 0 ; j < level2.length; j++){
        let level3 =  await User.find(
           {parent : level2[j].inv},
           {_id : 0 , user : 1 , members : 1 , Ammount : 1 , WithdrawalDetails : 1  , betPlayed : 1 , withdrawalC : 1 , inv : 1, deposit : 1}
         );
         // level3_user.push(level3);
         level3_user[j] = level3;
      }

    }

    data['status'] = 1;
    data['level2_user'] = level2_user;
    data['level3_user'] = level3_user;
    // console.log(data);
    return res.send(data);


});

app.get('/get_bet_history' ,isAuthenticated ,  async (req,res)=>{

    const INVITATION_CODE = req.session.inv;

    let setteled_bets = await Bet.find({inv : INVITATION_CODE , settled : true} , {_id : 0 , team_a : 1 , team_b : 1 , scoreDetails : 1 , final_score : 1 , date : 1 , profit : 1 , time : 1 , league : 1  , bAmmount : 1, leagueId : 1});

    let unsetteled_bets = await Bet.find({inv : INVITATION_CODE , settled : false} , {_id : 0 , team_a : 1 , team_b : 1 , scoreDetails : 1  , date : 1 , profit : 1 , time : 1 , league : 1 , bAmmount : 1 , leagueId : 1});

    let data = {setteled_bets,unsetteled_bets , status : 1};

    res.send(data);


}); //done



app.post('/placebet' , isAuthenticated,  async (req,res)=>{

  const INVITATION_CODE = req.session.inv;

  let date = Date.now();
  let bet_exist = await Bet.findOne(
    {
    inv : INVITATION_CODE,
    leagueId : req.body.league_id,
    team_a :  req.body.team_a ,
    team_b : req.body.team_b ,
    settled: false
    }
  );

  let time_left = await check_date( req.body.date , req.body.time );

  if(time_left && !bet_exist){

    let user_balance = await User.findOne({phone : temp_user['inv']} , {Ammount : 1});
    user_balance = parseFloat(user_balance);

    let data = {
      phone : temp_user['number'],
      inv : temp_user['inv'],
      parent : temp_user['parent'],
      bAmmount : req.body.ammount,
      leagueId : req.body.league_id,
      league : req.body.league,
      team_a :  req.body.team_a,
      team_b : req.body.team_b,
      scoreDetails : [
        {
          first : req.body.first,
          second: req.body.second
        }
      ],
      final_score : [
        {
          first : -1,
          second : -1
        }
      ],
      date : req.body.date,
      time : req.body.time,
      profit : req.body.profit,
      league_type : req.body.l_type
    }

    let bet_amount = -parseFloat(req.body.ammount);

    // if(user_balance >= req.body.ammount){
      if(await newBet(data)){
        // await User.findOneAndUpdate( {phone : temp_user['number']} , {$inc : {betPlayed : 1 , Ammount : bet_amount} });
        await User.findOneAndUpdate( {_id : req.session.user_id} , {$inc : {betPlayed : 1 } });

        res.send({'status' : 1});
      }else{
      res.clearCookie('id');
      res.send({'status' : 0});
    }
    // }else{
    //   return res.send({status : 4})
    // }

  }else{

    if(bet_exist){
      return res.send({status : 2});
    }else if(!time_left){
      return res.send({status : 3});
    }else{
      res.clearCookie('id');
      return res.send({status : 0});
    }
  }

});

async function check_date(date , time ){

  let today = new Date();
  let match_date = date.split(/\//);
  let m_time = time.split(/\:/);
  let m_date = parseInt(match_date[0]);
  let m_month = parseInt(match_date[1]);
  let m_hours = parseInt(m_time[0]);
  let m_minutes = parseInt(m_time[1]);
  m_minutes += 5;

  let valid_date = (parseInt(today.getDate()) == m_date);
  let valid_hour = (parseInt(today.getHours()) < m_hours);
  let valid_minutes = (parseInt(today.getMinutes()) < m_minutes );
  let equal_hours = parseInt(today.getHours()) == m_hours;

  if(valid_date && valid_hour || equal_hours && valid_minutes){
    return true;
  }
  return false;

}


// all data gathered

app.get("/home" , isAuthenticated , (req,res)=>{

  // if(temp_user['last_spin'] !== 0 && temp_user['last_spin'] < date.now().getDate()){
    res.render('home' , {
      spinner : `<div class="spinner_pop_btn">

                 </div>`
     })
  // }
  // res.render('home')

});

app.get('/login' , (req , res)=>{
  res.render("login");
});

app.post('/login' , async (req , res)=>{
  res.clearCookie('id');
  let data = req.body;
  let db_user = await User.findOne({user : data.name});

  if(
    db_user !== null &&
    db_user.password.localeCompare(data.pass) == 0
    ){

      temp_user['id'] = db_user['_id'].valueOf();
      temp_user['number'] = db_user['phone'];
      temp_user['inv'] = db_user['inv'];
      temp_user['name'] = db_user['user'];
      temp_user['parent'] = db_user['parent'];


    const token = await db_user.generateToken();

    res.cookie('id' , token , {
      expires : new Date(Date.now() + 600000),
      httponly : true
    });

    req.session.user_id = temp_user['id'];
    req.session.inv = temp_user['inv'];
    res.send({status : 1});

  }else{
      res.clearCookie('id');
    res.send({status : 0});
  }


})

async function get_settled_bet_byID(id){

  var options = {
  method: 'GET',
  url: `https://v3.football.api-sports.io/fixtures`,
  qs: {id : id},
  headers : {
      "x-rapidapi-host": "v3.football.api-sports.io",
      "x-rapidapi-key": "021ae6685ec46e47ec83f8848ac1d168"
      // "x-rapidapi-key": "823296afa77a4989062591abc46178ee"
    }

};

  return new Promise(function (resolve, reject) {
  request(options , function (error, res, body) {
    if (!error && res.statusCode === 200) {
      resolve(body);
     } else {
      reject(error);
     }
   });
 });

}

async function get_settled_bet_today(){

  let date = new Date();

  var options = {
  method: 'GET',
  url: `https://v3.football.api-sports.io/fixtures/?date=${date.getFullYear() - 5}-${date.getMonth() + 1}-${date.getDate()}`,
  qs: {status:'FT'},
  headers : {
      "x-rapidapi-host": "v3.football.api-sports.io",
      "x-rapidapi-key": "021ae6685ec46e47ec83f8848ac1d168"
      // "x-rapidapi-key": "823296afa77a4989062591abc46178ee"
    }

};

  return new Promise(function (resolve, reject) {
  request(options , function (error, res, body) {
    if (!error && res.statusCode === 200) {
      resolve(body);
     } else {
      reject(error);
     }
   });
 });

}

// user functions

async function newBet(data){

  let res = await Bet.create(data);
  let what_happened = (!res)? false : true;
  return what_happened;

}

async function newDeposit(data){

  let res = await Deposit.create(data);
  let what_happened = (!res)? false : true;
  return what_happened;
}

async function newWithdrawal(data){

  let res = await Withdrawal.create(data);
  let what_happened = (!res)? false : true;
  return what_happened;
}

async function createUser(data){

  let res = await User.create(data);
  temp_user['number'] = data['phone'];
  temp_user['inv'] = data['inv']
  temp_user['parent'] = data['parent'];
  // temp_user['last_spin'] = data['last_spin']
  return res;

};


// user functions ends


async function increment_parent_mem(inv , prev_members){
  let x = await User.updateOne({inv : inv} , {$inc : {members : 1}})
  return;
}

async function generate_inv_code(){

  let code_exist = false;
  let inv_code = parseInt(Math.floor(Math.random()*10000));

  let res = await User.findOne({inv : inv_code});

  // if found then code_exist = true;

  code_exist = (res)? true : false;

  if(inv_code < 1000 || code_exist){
    return generate_inv_code();
  }

  return inv_code;

}
