const submit = document.querySelector('#submit')


// submit.addEventListener("submit" , ()=>{
//   var pd = {
//      key: "6BFPjU",
//      txnid: "1lk2j3012klj",
//      amount: document.querySelectorAll('[name=amount]').value,
//      firstname:document.querySelectorAll('[name=firstname]').value ,
//      email: document.querySelectorAll('[name=lastname]').value,
//      phone: document.querySelectorAll('[name=Phone]').value,
//      productinfo: "no info",
//      surl: document.querySelectorAll('[name=surl]').value,
//      furl: document.querySelectorAll('[name=furl]').value,
//      hash: ''
//   }
//
//   let data = {
//     'txnid': pd.txnid,
//     'email': pd.email,
//     'amount': pd.amount,
//     'productinfo': pd.productinfo,
//     'firstname': pd.firstname
// }

// fetch(base_url + 'payment/payumoney', {
//     method: 'POST',
//     headers: {
//         'Accept': 'application/json',
//         'Content-Type': 'application/json'
//    },
//    body: JSON.stringify(data)
// })
//    .then(function (a) {
//        return a.json();
//    })
//    .then(function (json) {
//        pd.hash = json['hash']
//        this.redirectToPayU(pd);
//    });
//
//
//
// })
