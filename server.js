const cookieParser = require('cookie-parser');
const express = require('express');
const graphqlHTTP = require('express-graphql');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const path = require('path');;
const { buildSchema } = require('graphql');
const db = require('./queries');
const withAuth = require('./middleware');

// Stop with irritating notification
// mongoose.set('useCreateIndex', true);

// Loads environment variables from .env
require('dotenv').config()
const secret = 'f9bf78b9a18ce6d46a0cd2b0b86df9da';

// Construct a schema, using GraphQL schema language
let UserSchema = buildSchema(`
  type User {
    id: Int,
    username: String,
    password: String,
    profileName: String,
  }
  type Card {
    card_name: String,
  }
  type Query {
    getUser(username: String!): User,
    checkUsername(username: String!): Boolean,
    getUserFromToken: User,
    getUsers: [User],
    checkToken: Boolean,
    isCorrectPassword(password: String!): Boolean,
    getCardsFromUser(username: String!): [Card],
    isCardCollectedFromUser(username: String!, cardName: String!): Boolean,
    getProfileNameFromUser(username: String!): [String],
  }
  type Mutation {
    addUser( username: String!, password: String!, profileName: String!): String,
    deleteUser(username: String!): String,
    changePassword(username: String!, newPassword: String!): String,
    addCardToUser(cardName: String!, username: String!): String,
    removeCardFromUser(username: String!, cardName: String!): String,
    changeProfileNameFromUser(username: String!, profileName: String!): String,
  }
`);

async function checkToken( request ) {

  return await new Promise((resolve, reject) => {
    console.log('passouaki123yxxxxxxxxxxx')
    console.log('request.headers.authorization', request.headers.authorization)
    let token = '';

    if(request.headers.authorization){
      console.log('abacaxi')
      token = request.headers.authorization.split(' ')[1];
    }
    console.log('token2', token);

    if(!token){
      console.log('passouaki1')
      reject("Unauthorized: No token provided");
    } else {
      jwt.verify(token, secret, function(err, decoded) {
        if (err) {
          console.log('passouaki2')
          reject("Unauthorized: Invalid token")
        } else {
          console.log('passouaki3')
          resolve(decoded);
        }
      });
    }
  });
}
const Pool = require('pg').Pool
const pool = new Pool({
  user: 'me',
  host: 'localhost',
  database: 'api',
  password: 'password',
  port: 5432,
})


const rootResolver = {
/*  getUsers: () => {
    if(checkToken(req) === true){
      return User.find()
    } else{
      return new Error("It is necessary to login")
    }
  },*/
  getUsers: async () => {
    const users =  await db.getUsers()
    return users
  },

  checkUsername: async ({ username }, req) => {
    const user = await db.getUser(username)
    if(user){
      return true;
    } else {
      return false;
    }
  },

  getUser: async ({ username }, req) => {
    console.log('passouakixxxxxxxxxxx')

    let userData = await checkToken(req);
    console.log('userData', userData);
    const user = await db.getUser(username)
    console.log('user123', user);
    return user;
  },

  getUserFromToken: async (args, req) => {
    console.log('passouaki11122xxxxxxxxxxx')

    let userData = '';

    await checkToken(req)
      .then((result) => {
        userData = result;
      })
      .catch((err) => {
        return new Error("It is necessary to login")
      });
    
    console.log('userData', userData);
    let user = {
      username: userData.username,
    }
    console.log('user', user);
    return user;
  },

  addUser: async ({ username, password, profileName }) => {
    return await db.createUser({
      username: username,
      password: password,
      profileName: profileName,
    })
  },

  deleteUser: async ({ username }, req) => {
    let userData = '';

     await checkToken(req)
    .then((result) => {
      userData = result;
    })
    .catch((err) => {
      return new Error("It is necessary to login")
    });

    console.log('userData', userData);
    if(userData){
      return await db.deleteUser(username);
    } else{
      return new Error("It is necessary to login")
    }
    // return await db.deleteUser(username);
  },

  isCorrectPassword: async ({password}, req) => {
    console.log('isCorrectPassword passouaki')
    let userData = '';

     await checkToken(req)
    .then((result) => {
      userData = result;
    })
    .catch((err) => {
      return new Error("It is necessary to login")
    });

    console.log('userData', userData)
    console.log('password', password)
    if(userData && password){
      return await db.isCorrectPassword(userData.username, password).then( (same, err) => {
        if (err) {
          console.log('yougurt1');
          return new Error('Internal error please try again');
        } else if (!same) {
          console.log('yougurt2');
          return new Error('Incorrect password');
        } else {
          console.log('yougurt3');
          return true;
        }
      });
    }
  },

  changePassword: async ({username, newPassword}, req) => {
    return await db.changePassword(username, newPassword);
  },

  checkToken: (args, req) => {
    if(checkToken(req) === true){
      return true
    } else{
      return new Error("It is necessary to login")
    }
  },

  addCardToUser: async ({cardName, username}, req) => {
    await db.addCard(cardName);

    return await db.addCardToUser(cardName, username);
  },

  getCardsFromUser: async ({username}, req) => {
    return await db.getCardsFromUser(username);
  },

  getProfileNameFromUser: async ({username}, req) => {
    let tmp = await db.getProfileNameFromUser(username);

    return tmp.map(result => {
      return result.profilename
    });
  },

  isCardCollectedFromUser: async({username, cardName}, req) => {
    let cards = await db.getCardsFromUser(username);

    for(let i = 0; i < cards.length; i++){

      if(cardName === cards[i].card_name){
        return true;
      }
    }

    return false;
  },

  removeCardFromUser: async({username, cardName}, req) => {
    return await db.removeCardFromUser(cardName, username);
  },

  changeProfileNameFromUser: async ({profileName, username}, req) => {
    return await db.changeProfileNameFromUser(profileName, username);
  },
}

const loggingMiddleware = (req, res, next) => {
  console.log('ip:', req.ip);
  next();
}

let app = express();
var cors = require('cors');

// use it before all route definitions
app.use(cors({origin: true, credentials: true}));

app.options('*', cors());

// Add headers
app.use(function (req, res, next) {

  // Website you wish to allow to connect
  res.setHeader('Access-Control-Allow-Origin', '*');

  // Request methods you wish to allow
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

  // Request headers you wish to allow
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

  // Set to true if you need the website to include cookies in the requests sent
  // to the API (e.g. in case you use sessions)
  res.setHeader('Access-Control-Allow-Credentials', true);

  // Pass to next layer of middleware
  next();
})

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(loggingMiddleware);

app.use('/graphql', graphqlHTTP({
  schema: UserSchema,
  rootValue: rootResolver,
  graphiql: true,
}));

app.post('/api/authenticate', async function(req, res) {
  console.log('req.body', req.body)
  const { username, password } = req.body;

  db.getUser(username)
    .then((result, err) => {
      if (err) {
        console.error(err);
        res.status(500)
          .json({ error: 'Internal error please try again' });
      } else if (!result) {
        res.status(401)
          .json({ error: 'Incorrect email or password1' });
      } else {
        db.isCorrectPassword(username, password).then( (same, err) => {
          if (err) {
            res.status(500)
              .json({ error: 'Internal error please try again' });
          } else if (!same) {
            res.status(401)
              .json({ error: 'Incorrect email or password2' });
          } else {
            // Issue token
            const payload = { username };
            const token = jwt.sign(payload, secret, {
              expiresIn: '1d',
            });
            // res.cookie('token', token, { httpOnly: true })
          
            res.status(200).send({ auth: true, token: token });
          }
        });
      }
  });
});

// This endpoint uses the middleware
// to check the token from the cookies
// and verify if the user is logged in
app.get('/checkToken', withAuth, function(req, res) {
  console.log('req', req.res.username);
  res.json({"oki": "doki"});
})
app.listen(process.env.PORT || 4000);