const bcrypt = require('bcrypt');
const Pool = require('pg').Pool;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  user: 'me',
  host: 'localhost',
  database: 'api',
  password: 'password',
  port: 5432,
});

pool.on('error', (err, client) => {
	console.error('Error:', err);
});

init();

async function init(){
	await pool.query(`
			CREATE TABLE IF NOT EXISTS cards (
				name varchar UNIQUE
			)
		`, (res, err) => {
		console.log(res, err);
	});

	await pool.query(`
			CREATE TABLE IF NOT EXISTS users (
			    username varchar UNIQUE,
			    password varchar,
			    profileName varchar
			)
		`, (res, err) => {
		console.log(res, err);
	})

	await pool.query(`
			CREATE TABLE IF NOT EXISTS users_cards (
				user_username VARCHAR REFERENCES users (username),
				card_name VARCHAR REFERENCES cards (name)
			)
		`, (res, err) => {
		console.log(res, err);
	});
}

const saltRounds = 10;

async function getUsers(){
	return pool.query('select * FROM users').then((response) => {
    console.log(response.rows)
    return response.rows
  }).catch((error) => {
  	return new Error(error);
  })
}

async function getUser(username){
	return pool.query(
		'SELECT * FROM users WHERE username = ($1)', [username])
	.then((response) => {
		console.log('reponse', response.rows);
		return response.rows[0];
	})
	.catch((err) => {
		return new Error(err);
	})
}

async function createUser(request){
	let { username, password, profileName } = request

	if(!profileName) {
		profileName = 'elio';
	}

	const hashedPassword = await new Promise((resolve, reject) => {
		bcrypt.hash(password, saltRounds, function(err, hash) {
		  if (err) reject(err)
		  resolve(hash)
		});
	})

	let tmp = await this.getUser(username);
	console.log('TMP', tmp);

	if(!tmp && hashedPassword){
		return pool.query(
			'INSERT INTO users (username, password, profileName) VALUES ($1, $2, $3)',
			 [username, hashedPassword, profileName]
		)
		.then((response) => {
			console.log('response', response);
			return "User added!"
		}).catch((error) => {
			return new Error(error);
		})
	} else {
		console.log('This username already exist');
		return new Error("This username already exist");
	}
}

async function isCorrectPassword(username, password){
		const user = await getUser(username);

	return await new Promise((resolve, reject) => {
		bcrypt.compare(password, user.password, function(err, same) {
			if(err){
				reject(err);
			} else {
				resolve(same);
			}
		})
	});
}

async function deleteUser(username){
	return pool.query(
		'DELETE FROM users WHERE username = ($1)', [username])
	.then((response) => {
		return "User removed!123";
	}).catch((err) =>{
		return new Error(err);
	});
}

async function changePassword(username, newPassword){
	console.log('username', username);
	console.log('newPassword', newPassword);

	const hashedPassword = await new Promise((resolve, reject) => {
		bcrypt.hash(newPassword, saltRounds, function(err, hash) {
		  if (err) reject(err)
		  resolve(hash)
		});
	})
	
	return pool.query(
		'UPDATE users SET password = ($1) WHERE username = ($2)', [hashedPassword, username])
	.then((response) => {
		console.log('response', response);
		return "Password changed!";
	}).catch((error) => {
		return new Error(error);
	});
};

async function getCards(){
	return pool.query('select * FROM cards').then((response) => {
    console.log(response.rows)
    return response.rows
  }).catch((error) => {
  	return new Error(error);
  })
}

async function addCard(name){
		return pool.query(
			'INSERT INTO cards (name) VALUES ($1)',
			 [name]
		)
		.then((response) => {
			console.log('response', response);
			return "Card added!"
		}).catch((error) => {
			return new Error(error);
		})
}

async function addCardToUser(cardName, username){
	return pool.query(
		'INSERT INTO users_cards (user_username, card_name) VALUES ($1, $2)',
		 [username, cardName]
	)
	.then((response) => {
		console.log('response', response);
		return "Card added to user!"
	}).catch((error) => {
		return new Error(error);
	})
}

async function getCardsFromUser(username){
	return pool.query(`
		SELECT card_name FROM users_cards
		JOIN users ON users.username = user_username
		JOIN cards ON cards.name = card_name
		WHERE users.username = ($1)`,
		[username]		
	).then((response) => {
    console.log(response.rows)
    return response.rows
  }).catch((error) => {
  	return new Error(error);
  })
}

async function removeCardFromUser(cardName, username){
	console.log('cardName', cardName)
	console.log('username', username)

	return pool.query(
		'DELETE FROM users_cards WHERE card_name = ($1) AND user_username = ($2)',
		 [cardName, username]
	)
	.then((response) => {
		console.log('response', response);
		return "Card removed from user!"
	}).catch((error) => {
		return new Error(error);
	})
}

async function getProfileNameFromUser(username){
	return pool.query(`SELECT profileName FROM users WHERE username = ($1)`, [username])
	.then((response) => {
    console.log(response.rows)
    return response.rows
  }).catch((error) => {
  	return new Error(error);
  })
}

async function changeProfileNameFromUser(profileName, username){
	return pool.query(
		'UPDATE users SET profileName = ($1) WHERE username = ($2)', [profileName, username])
	.then((response) => {
		console.log('response', response);
		return "profileName changed!";
	}).catch((error) => {
		return new Error(error);
	});
}

module.exports = {
	getUsers,
	getUser,
	createUser,
	deleteUser,
	isCorrectPassword,
	changePassword,
	addCard,
	addCardToUser,
	getCardsFromUser,
	removeCardFromUser,
	getProfileNameFromUser,
	changeProfileNameFromUser
}