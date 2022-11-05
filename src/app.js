let PUBLIC_KEY , SECRET_KEY;

if(process.env.NODE_ENV !== 'production'){
  require('dotenv').config();
   PUBLIC_KEY = process.env.PUBLIC_KEY;
   SECRET_KEY = process.env.SECRET_KEY;
}

console.log(PUBLIC_KEY , SECRET_KEY);

const {
  express , hbs , path ,
  mongoose , jwt , cookieParser ,
  crypto , request , jssha , session ,
  MongoDBStore , user_data , admin_function , user_function
} = require('./controlers/imports');

const static_path = path.join( __dirname , '../' , 'public' );
const {User, Bet ,Deposit,Withdrawal} = require('./db');
const port = process.env.PORT || 2000;


const app = express();

app.use(express.urlencoded({extended : true}));
app.set('view engine' , 'hbs');
app.use(cookieParser());
app.use(express.json());



app.use(express.static(static_path));


let link = 'mongodb+srv://herofootball:hero%40123@cluster0.ujlhaqb.mongodb.net/heroFootball?retryWrites=true&w=majority';

mongoose.connect(link)
  .then(function(db){
    console.log('dtabse connected');
  app.listen(port , ()=>{
    console.log(`listening on ${port}`);
  })

})
  .catch(function(err){
  console.log(err);
})

const JWT_SECRET = 'VISHAL';

const one_day = 1000 * 60 * 60 * 48;

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
  cookie: { maxAge: one_day },
  store : store
}));

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

app.get('/user_data' , user_data.get_data );

app.get('/get_payment' , user_data.get_payment_data );

app.get('/get_all_members' ,isAuthenticated , user_data.get_members_data );

app.get('/get_bet_history' , user_data.get_bet_data ); //done


app.post('/login' , user_function.login_user);

app.post('/signup' , user_function.sign_new_user);

app.post('/placebet' , isAuthenticated , user_function.place_bet);

app.post('/delbet', isAuthenticated ,  user_function.delete_bet);

app.post('/spinner_update' , isAuthenticated , user_function.spinner_update);

app.get('/AdMiNgRoUp/league_0' , (req , res)=>{
  res.render('bet_settle');
});

app.post('/AdMiNgRoUp/league_0' , admin_function.settle_bet);

// all data gathered

app.get("/home" ,isAuthenticated, (req,res)=>{

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

app.get('/betfault' ,isAuthenticated,(req,res)=>{
  res.render('betfault');
})