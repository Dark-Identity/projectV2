const {User , Bet , Deposit , Withdrawal} = require('../db');

class user_functions {

  static place_bet = async(req , res)=>{

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

    let time_left = await check_date( req.body.date , req.body.time);

    if(time_left && !bet_exist){

      let user_found = await User.findOne({inv : INVITATION_CODE});
      let user_balance = parseFloat(user_found['Ammount']);

      let data = {
        phone : user_found['phone'],
        inv : INVITATION_CODE,
        parent : user_found['parent'],
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
        return res.send({status : 0});
      }

    }
  }

  static sign_new_user = async(req , res)=>{

    res.clearCookie('id');

    let body = req.body;

    let inv = await generate_inv_code();

    let user_found = await User.findOne({user : body.name});
    let phone_found = await User.findOne({phone : body.contact});

    let data = {
      user : body.name,
      password : body.password,
      inv : inv,
      parent : body.invitation_code,
      phone : body.contact
    }

    let newUser = new User(data);

    if(body.invitation_code !== 0 && !user_found && !phone_found){

      let parent = await User.findOne({inv : body.invitation_code});

      if(parent){

        let is_created = await createUser(newUser);

        if(is_created){

          await increment_parent_mem(body.invitation_code);

          req.session.user_id = is_created['_id'].valueOf();
          req.session.inv = is_created['inv'];

          return res.send({status : 1});

        }else{
          return res.send({status : 0})
        }

      }else{
        return res.send({status : 0})
      }


    }else if(body.invitation_code == 0 && !user_found && !phone_found){

      let new_user_created = await createUser(newUser);

      if(new_user_created){

        req.session.user_id = new_user_created['_id'].valueOf();
        req.session.inv = new_user_created['inv'];
        return res.send({status : 1});

      }else{
        return res.send({status : 0});
      }

    }else{
      if(user_found){
        return res.send({status : 404});
      }else if(phone_found){
        return res.send({status : 101})
      }else{
        return res.send({status : 0})
      }
    }
  }

  static login_user = async(req , res)=>{

    let data = req.body;
    let db_user = await User.findOne({user : data.name});

    if(
      db_user !== null &&
      db_user.password.localeCompare(data.pass) == 0
    ){

      req.session.user_id = db_user['_id'].valueOf();
      req.session.inv = db_user['inv'];
      res.send({status : 1});

    }else{
      res.send({status : 0});
    }

  }

  static spinner_update = async(req , res)=>{

    if(req.body.value){
      let amm = parseInt(req.body.value);
      await User.updateOne({_id : req.session.user_id} , {$inc : {Ammount : amm}});
      return res.send({'status' : 1});
    }else{
      return res.redirect('/login');
    }

  }

  static delete_bet = async(req , res)=>{

     let id = parseInt(req.body.value);
     let bet = await Bet.findOne({leagueId : id});

     if(bet){

       let valid_date = await check_date(bet['date'] , bet['time']);

       if(valid_date){

         let is_deleted = await Bet.findOneAndDelete({leagueId : id });

         if(is_deleted){
           res.send({status : 1});
         }else{
           res.send({status : 0});
         }

       }else{
         // if the time limit exeeded;
         res.send({status : 2})
       }

     }else{
       res.send({status : 0})
     }



  }

}

module.exports = user_functions;

// this function saves the new bet user has placed;
async function newBet(data){

  let res = await Bet.create(data);
  let what_happened = (!res)? false : true;
  return what_happened;

}

// this will create a new deposit form at the database;
async function newDeposit(data){

  let res = await Deposit.create(data);
  let what_happened = (!res)? false : true;
  return what_happened;
}

// when a user initiates a new withdrawal this will save teh data to the database
async function newWithdrawal(data){

  let res = await Withdrawal.create(data);
  let what_happened = (!res)? false : true;
  return what_happened;
}

// it will increment the member of the user who has invited this new user while sign_in;
async function increment_parent_mem(inv , prev_members){
  let x = await User.updateOne({inv : inv} , {$inc : {members : 1}})
  return;
}

 // it will check the date wethere its valid to place bet and match has not been started;
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

// after signup it will create a new user at the database;
async function createUser(data){

  let res = await User.create(data);
  temp_user['number'] = data['phone'];
  temp_user['inv'] = data['inv']
  temp_user['parent'] = data['parent'];
  // temp_user['last_spin'] = data['last_spin']
  return res;

};

// this function will create the new invitation code for new users when signed in ;
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
