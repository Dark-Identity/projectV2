const {User , Bet , Deposit , Withdrawal} = require('../db');

class admin_function{

  static settle_bet = async(req, res)=>{

    let id = req.body['id'];

    if(!id){
      return res.send('<h1>SORRY SOMETHING WENT WRONG WITH LEAGUE ID</h1>');
    }else{


    let results = {};
    let settled = [];
    let bets = {};

    // add another querry parameter league id , cause if one user places two bets then he will get double rebade ammount; and this id you will get from user;

    let all_unsettled_bets = await Bet.find({settled : false , league_type : 1 , leagueId : id} , {bAmmount : 1 , leagueId : 1 , inv : 1 , scoreDetails : 1 , profit : 1 , date : 1 , members : 1 , ammount : 1 , final_score : 1 , rebade_amm : 1});

    if( all_unsettled_bets ){

      let data = await get_settled_bet_byID(parseInt(all_unsettled_bets[0]['leagueId']));
      data = await JSON.parse(data);

      if(data){

        let result_id = parseInt(data['response'][0]['fixture']['id']);
        let result_obj = data['response'][0]['goals'];

        results[result_id] = result_obj;

      }else{
        return res.send(`<h1>Something went wrong try again. after checking the database or league id you entered !!!</h1>`);
      }

    }else{
      return res.send(`<h1>Either their is no bet to settle or you have entered wrong league id`);
    }

    // setting things up
    if(all_unsettled_bets ){

      for(let item of all_unsettled_bets){

        if( !(item['leagueId'] in results) ){
          res.send(`<h1>ODD ONE OUT PLEASE ${item['leagueId']}</h1>`);
        }else{

          //this bets object will help me fin wethere a user has placed bet or not in O(1);
          bets[item['inv']] = item;

        }

      }

    }


    let test_array = [];
    // analyze all the data
    if(all_unsettled_bets ){

      for(let level0 of all_unsettled_bets){

        let body = {
          inv : level0['inv'],
          leagueId : level0['leagueId'],
          amount : 0,
          profit : 0,
          rebade : 0,
          score_a : 0,
          score_b : 0,
        }

        let level1_rebade = 0 ;
        let level2_rebade = 0 ;
        let level3_rebade = 0 ;

        // console.log(level0);
        let score0 = results[level0['leagueId']];
        let test_amount = 0;
        let test_profit = 0;
        // console.log(results , level0['leagueId']);
        let score_a = parseInt(score0['home']);
        let score_b = parseInt(score0['away']);

        if(level0['scoreDetails'][0]['first'] !== score_a ||
        level0['scoreDetails'][0]['second'] !== score_b)
        {

          let profit0 = parseFloat(level0['profit']);
          let bet_ammount0 = parseFloat(level0['bAmmount']);

          body['amount'] = bet_ammount0 + (bet_ammount0/100 * profit0 - 1);

          body['profit'] = parseFloat(parseFloat(bet_ammount0/100 * profit0 - 1).toFixed(3));

        }

        body['score_a'] = score_a;
        body['score_b'] = score_b;

        // find level 1 users

        let level1_user = await User.find({parent : parseInt(level0['inv']) ,  betPlayed : {$gt: 0} });

        if(level1_user ){

          for(let level1 of level1_user){

            if(level1['inv'] in bets){

              if(bets[level1['inv']]['scoreDetails'][0]['first'] !== score_a ||
              bets[level1['inv']]['scoreDetails'][0]['second'] !== score_b)
              {

                let profit1 = parseFloat((bets[level1['inv']]['profit']).toFixed(3));
                let bet_ammount1 = parseFloat(parseFloat(bets[level1['inv']]['bAmmount']).toFixed(3));

                level1_rebade += parseFloat( (bet_ammount1/100 * profit1).toFixed(3) );

              }

            }

            let level2_user = await User.find({parent : parseInt(level1['inv']) , betPlayed : {$gt : 0} });

            if(level2_user ){

              for(let level2 of level2_user){

                if(level2['inv'] in bets){


                  if(bets[level2['inv']]['scoreDetails'][0]['first'] !== score_a ||
                  bets[level2['inv']]['scoreDetails'][0]['second'] !== score_b)
                  {

                    let profit2 = parseFloat(bets[level2['inv']]['profit']);
                    let bet_ammount2 = parseFloat(bets[level2['inv']]['bAmmount']);

                    level2_rebade += (bet_ammount2/100) * profit2;

                  }


                }

                let level3_user = await User.find({parent : level2['inv'] , betPlayed : {$gt : 0} });

                if(level3_user){

                  for(level3 of level3_user){

                    if(level3['inv'] in bets){



                      if(bets[level3['inv']]['scoreDetails'][0]['first'] !== score_a ||
                      bets[level3['inv']]['scoreDetails'][0]['second'] !== score_b)
                      {

                        let profit3 = parseFloat(bets[level3['inv']]['profit']);
                        let bet_ammount3 = parseFloat(bets[level3['inv']]['bAmmount']);


                        level3_rebade += (bet_ammount3/100) * profit3;

                      }

                    }

                  }

                }

              }

            }

          }

        }


        let final_rebade1 = parseFloat( ((parseFloat(level1_rebade)/100 ) * 12).toFixed(3) );
        let final_rebade2 = parseFloat( ((parseFloat(level2_rebade)/100 ) * 10).toFixed(3) );
        let final_rebade3 = parseFloat( ((parseFloat(level3_rebade)/100 ) * 8).toFixed(3) );

        body['rebade'] = parseFloat( (final_rebade1 + final_rebade2 + final_rebade3).toFixed(3) );

        test_array.push(body);
      }

    }


    let data_to_send = {};
    let went_wrong = [];

    if(test_array ){

      for(let update_it of test_array){

        let set_score_a = parseInt(update_it['score_a']);
        let set_score_b = parseInt(update_it['score_b']);
        let to_update_amm = parseFloat( (update_it['amount'] + update_it['rebade']).toFixed(3) );

        let updated_data = await User.findOneAndUpdate(
          {inv : update_it['inv']} ,
          {
            $inc : {
              Ammount : to_update_amm,
              RebadeBonus : parseFloat(parseFloat(update_it['rebade']).toFixed(3)),
              profit : parseFloat(parseFloat(update_it['profit']).toFixed(3))
            },
          },{new : true}
        );

        let updated_bet = await Bet.findOneAndUpdate(
          {inv : update_it['inv'] , leagueId : update_it['leagueId']} ,
          {
            settled : true,
            final_score : [{first : set_score_a , second : set_score_b}]
          },{new : true}
        );

      }
    }

    return res.send({'settled_bets' : test_array , 'went wrong' : went_wrong});

  }

  }

}

module.exports =  admin_function;

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
