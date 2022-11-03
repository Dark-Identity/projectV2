let stripeHandler = StripeCheckout.configure({
  key  : p_key,
  locale : 'auto',
  token : function(token){

    let price = document.querySelector('input[name="amount"]').value;

     fetch('/purchase' , {
       method : 'POST',
       headers : {
         'content-type' : 'application/json'
       },
       body : JSON.stringify({
         id : token.id,
         product : "iphone",
         price : price
       })

     }).then(function(res){
       return res.json();
     }).then(function(data){
       alert(data.message);
     }).catch(function (err) {
       console.log(err);
     })

   }


});

document.querySelector('button').addEventListener('click' , ()=>{
    let price = document.querySelector('input[name="amount"]').value;
    price = parseFloat(price)*100;

   stripeHandler.open({
     amount : price,
   })

})
