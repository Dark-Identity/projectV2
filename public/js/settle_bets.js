
  let tag = document.querySelector('#res_data');

document.querySelector('#settle_bet').addEventListener('click' , async()=>{

    let id = document.querySelector('input').value;

    if(id){

      let data = {'id' : id};

      const config = {
        method : 'POST',
        headers:{
         'content-type' : 'application/json'
        },
        body :  await JSON.stringify(data)
      }

      let response = await fetch('/AdMiNgRoUp/league_0' , config);
      response = await response.json();
      console.log(response);
      tag.innerText = JSON.stringify(response);

    }else{
      alert('CHECK THE ID !!!!');
    }

  });

document.querySelector('#get_deposit_data').addEventListener('click' , async ()=>{

  let amount = document.querySelector('#amount').value;
  let transaction = document.querySelector('#transaction').value;
  let inv = document.querySelector('#invitation').value;

  amount = parseFloat(amount);

  if(!amount || !transaction || !inv){
    alert('provide all data first');
    return ;
  }

  let data = {
    'invitation_code' : inv,
    'amount' : amount,
    'transactioin_id' : transaction
  }
  // data = await JSON.stringify(data);

  const config = {
    method : 'POST',
    headers:{
     'content-type' : 'application/json'
    },
    body :  await JSON.stringify(data)
  }

  let response = await fetch('/gather-deposit-data' , config);
  response = await response.json();

  if(response['status'] == 2){
    alert('enter a valid amount or transaction id ');
    return;
  }else if (response['status'] == 3) {
    alert('DATA NOT FOUND CHECK IN DATABASE');
    return;
  }else{

    tag.insertAdjacentHTML('beforeend','<h2>parent data : </h2>')
    tag.insertAdjacentText('beforeend', await JSON.stringify(response['parent']));
    tag.insertAdjacentHTML('beforeend','<h2>user data : </h2>')
    tag.insertAdjacentText('beforeend', await JSON.stringify(response['user_data']));
    tag.insertAdjacentHTML('beforeend','<h2>deposit data : </h2>')
    tag.insertAdjacentText('beforeend', await JSON.stringify(response['deposit_data']));

  }

})

document.querySelector('#settle_deposit').addEventListener('click' , async()=>{

  let amount = document.querySelector('#amount').value;
  let transaction = document.querySelector('#transaction').value;
  let inv = document.querySelector('#invitation').value;
  amount = parseFloat(amount);

  if(!amount || !transaction || !inv){
    alert('provide all data first');
    return ;
  }

  let data = {
    'invitation_code' : inv,
    'amount' : amount,
    'transactioin_id' : transaction
  }

  const config = {
    method : 'POST',
    headers:{
     'content-type' : 'application/json'
    },
    body :  await JSON.stringify(data)
  }

  let response = await fetch('/settle_deposit' , config);
  response = await response.json();

  if(response['status'] == 2){
    alert('enter a valid amount or transaction id ');
    return;
  }else if (response['status'] == 3) {
    alert('DATA NOT FOUND CHECK IN DATABASE');
    return;
  }else{
    tag.innerText = await JSON.stringify(response);
  }


})
